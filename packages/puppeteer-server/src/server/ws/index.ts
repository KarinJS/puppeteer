import fs from 'node:fs'
import path from 'node:path'
import * as mime from 'mime-types'
import { server } from '../../server/app'
import { WebSocketServer } from 'ws'
import { getCache } from '../../cache'
import { sha256 } from '../../utils/hash'
import { puppeteer } from '../../puppeteer'
import { getCount } from '../../cache/count'
import { logScreenshotTime } from '../../utils'
import { eventEmitter } from '../../utils/event'
import { renderTemplate } from '../utils/template'
import { createUploadFileEventKey } from '../utils/key'
import {
  createWsAuthErrorRequest,
  createWsScreenshotFailedResponse,
  createWsScreenshotSuccessResponse,
  createWsServerErrorResponse,
  createWsUploadFileRequestRequest,
  RequestType, Status, WsAction
} from '../utils/webSocket'

import type WebSocket from 'ws'
import type { ScreenshotOptions } from '@karinjs/puppeteer'
import type { UploadFileRequestParams } from '../../types/client'

/**
 * 创建WebSocket服务端
 * @param router - 路由
 * @param timeout - 超时时间
 * @param token - 密钥
 */
export const createWebSocketServer = (
  router: string = '/',
  timeout: number = 30 * 1000,
  token?: string
) => {
  /**
   * WebSocketServer实例
   */
  const wss = new WebSocketServer({ server })

  wss.on('connection', (socket, request) => {
    if (request.url !== router) {
      return createWsAuthErrorRequest(socket, 'path is not valid')
    }

    /**
     * 鉴权支持两种方法
     * - Bearer 明文密钥
     * - Bearer sha256
     */
    const { authorization } = request.headers
    if (token && `Bearer ${token}` !== authorization && sha256(token) !== authorization) {
      return createWsAuthErrorRequest(socket, 'auth failed')
    }

    socket.on('message', (raw) => {
      try {
        handleMessage(socket, raw, timeout)
      } catch (error) {
        logger.error(error)
        const { echo } = JSON.parse(raw.toString()) || {}
        createWsServerErrorResponse(socket, echo, (error as Error).message || '未知错误')
      }
    })
  })
}

/**
 * 处理收到的消息
 * @param socket - WebSocket实例
 * @param rawData - 消息
 * @param timeout - 超时时间
 */
const handleMessage = async (
  socket: WebSocket,
  rawData: WebSocket.RawData,
  timeout: number
) => {
  getCount.count.ws_server++
  const rawString = rawData.toString()
  const raw = JSON.parse(rawString) || {}

  /** 响应 */
  if (raw.type === RequestType.Response) {
    const { action, echo, status, data } = raw
    if (action === WsAction.UploadFile) {
      eventEmitter.emit(echo, { status, data })
      return
    }

    logger.error(`[WebSocket][client] 未知响应: ${rawString}`)
  }

  if (raw.type !== RequestType.Request) {
    logger.warn(`[WebSocket][client] 未知请求: ${rawString}`)
    return
  }

  /** 客户端主动请求 */
  if (raw.action === WsAction.Auth) {
    if (raw.params.status === Status.Failed) {
      logger.fatal(`[WebSocket][client][鉴权失败]: ${raw.params.message}`)
      return
    }

    logger.warn(`[WebSocket][client] 未知请求: ${rawString}`)
  }

  /** 截图、渲染 */
  if (raw.action !== WsAction.Screenshot && raw.action !== WsAction.Render) {
    logger.warn(`[WebSocket][client] 未知请求: ${rawString}`)
    return
  }

  const time = Date.now()
  /** 获取截图参数 */
  const data = await getScreenshotOptions(raw)
  /** 设置请求拦截 */
  setRequestInterception(socket, data, raw.echo, timeout)

  /** 截图 */
  const result = await puppeteer.screenshot(data)
  if (result.status) {
    createWsScreenshotSuccessResponse(socket, raw.echo, result.data)
    return logScreenshotTime(result, raw.params, time)
  }

  return createWsScreenshotFailedResponse(socket, raw.echo, result.data.message || '未知错误')
}

/**
 * 统一截图参数
 * @param action - 请求类型
 * @param params - 截图参数
 * @returns 截图参数
 */
const getScreenshotOptions = async (raw: any): Promise<ScreenshotOptions> => {
  const options: ScreenshotOptions = raw.params || {}
  /** 兼容 */
  if (!options.pageGotoParams) options.pageGotoParams = {}
  /** 强制等待网络空闲 */
  options.pageGotoParams.waitUntil = 'networkidle0'
  /** 只支持htmlString */
  options.file_type = 'htmlString'

  if (raw.action === WsAction.Screenshot) {
    return options
  }

  const file = await renderTemplate(options)
  return { ...options, file }
}

/**
 * 设置请求拦截
 * @param socket - WebSocket实例
 * @param options - 截图参数
 * @param echo - 请求echo
 * @param timeout - 超时时间
 */
const setRequestInterception = (
  socket: WebSocket,
  options: ScreenshotOptions,
  echo: string,
  timeout: number
) => {
  options.setRequestInterception = async (request) => {
    try {
      /** 资源类型 */
      const type = request.resourceType()
      /** 白名单 */
      const list = ['image', 'font', 'stylesheet', 'document', 'script']
      if (!list.includes(type)) {
        return request.continue()
      }

      /** 请求的url */
      const url = request.url()
      /** 资源 */
      const cache = getCache(url, type)
      /** 资源类型 */
      const contentType = mime.contentType(path.extname(url)) || 'application/octet-stream'
      if (cache) {
        return request.respond({
          status: 200,
          headers: {
            'Content-Type': contentType
          },
          body: fs.readFileSync(cache)
        })
      }

      /** 没命中缓存 找客户端要 */
      const filePath = await getFileFromClient(socket, {
        echo,
        contentType,
        url,
        timeout
      })

      /** 返回文件 */
      return request.respond({
        status: 200,
        headers: {
          'Content-Type': contentType
        },
        body: fs.readFileSync(filePath)
      })
    } catch (error) {
      return request.respond({
        status: 404,
        contentType: 'text/plain',
        body: (error as Error).message
      })
    }
  }
}

/**
 * 找客户端要文件
 * 1. 发ws请求让客户端上传
 * 2. 客户端上传文件
 * 3. http接口收到文件 发布事件
 * 4. 收到事件后 返回文件路径
 */
const getFileFromClient = (socket: WebSocket, options: {
  echo: string
  contentType: string
  url: string,
  timeout: number
}): Promise<string> => {
  /** 监听上传完成 */
  const key = createUploadFileEventKey(options.echo)
  return new Promise((resolve, reject) => {
    /** 超时处理器 */
    let timeoutHandler: NodeJS.Timeout | null = setTimeout(() => {
      timeoutHandler = null
      eventEmitter.removeListener(key, filePathHandler)
      reject(new Error('get file from client timeout'))
    }, options.timeout)

    /** 文件路径处理器 */
    const filePathHandler = (filePath: string) => {
      resolve(filePath)
      if (timeoutHandler) {
        clearTimeout(timeoutHandler)
        timeoutHandler = null
      }
    }

    eventEmitter.once(key, filePathHandler)

    sendRequest(socket, {
      echo: options.echo,
      type: options.contentType,
      path: options.url
    })
      .then(response => {
        if (response.status === Status.Failed) {
          if (timeoutHandler) {
            clearTimeout(timeoutHandler)
            timeoutHandler = null
          }
          eventEmitter.removeListener(key, filePathHandler)
          reject(new Error(response.data || '从客户端获取文件失败'))
        }
      })
  })
}

/**
 * 发送ws请求
 * - 此接口要求后端无论如何都需要返回一个响应
 * - status: 是否成功
 * - data: 失败时填写失败原因 成功为空字符串
 */
const sendRequest = (
  socket: WebSocket,
  params: UploadFileRequestParams
): Promise<{ status: Status, data: string }> => {
  return new Promise((resolve) => {
    eventEmitter.once(params.echo, (options) => resolve(options))

    setTimeout(() => {
      const options = { status: Status.Failed, data: 'send request timeout' }
      eventEmitter.emit(params.echo, options)
    }, 3 * 1000)

    /** 发送ws请求 */
    createWsUploadFileRequestRequest(socket, params)
  })
}
