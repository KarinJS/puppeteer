import WebSocket from 'ws'
import { sha256 } from '../utils/hash'
import { puppeteer } from '../puppeteer'
import { logScreenshotTime, pkg } from '../utils'
import { renderTemplate } from '../server/utils/template'
import { getCount } from '../cache/count'
import {
  Status,
  WsAction,
  RequestType,
  createWsScreenshotFailedResponse,
  createWsScreenshotSuccessResponse,
  createWsServerErrorResponse,
} from '../server/utils/webSocket'
import type { CreateWebSocketOptions } from '../types/client'

/**
 * 创建ws客户端
 * @param options - 配置
 */
export const createWebSocket = (options: CreateWebSocketOptions) => {
  /** 是否初始化完毕 */
  let init = false
  /** 是否重连 */
  let isReconnect = true

  const { url, heartbeatTime, reconnectionTime, authorization } = options

  if (!url) {
    logger.fatal('[WebSocket][client] 连接地址不能为空')
    return
  }

  if (!heartbeatTime) {
    logger.fatal('[WebSocket][client] 心跳时间不能为空')
    return
  }

  if (!reconnectionTime) {
    logger.fatal('[WebSocket][client] 重连时间不能为空')
    return
  }

  const clientOptions: WebSocket.ClientOptions = {
    headers: {
      'x-client-name': pkg.name,
      'x-client-version': pkg.version
    }
  }

  if (authorization) {
    clientOptions.headers!.authorization = sha256(authorization)
  }

  const client = new WebSocket(url, clientOptions)

  client.on('open', () => {
    init = true
    logger.mark(`[WebSocket][client][连接成功]: ${url}`)
    /** 每10秒发送一次ping */
    setInterval(() => client.ping(), heartbeatTime)
  })

  client.on('message', (raw) => {
    try {
      handleMessage(client, raw)
    } catch (error) {
      logger.error(error)
      const { echo } = JSON.parse(raw.toString()) || {}
      createWsServerErrorResponse(client, echo, (error as Error).message || '未知错误')
    }
  })

  client.on('error', (error) => {
    /** 只有初始化完毕才打印日志 */
    if (!init) return
    logger.error(error)
  })

  client.on('close', () => {
    setTimeout(() => {
      if (!isReconnect) return
      logger.warn(`[WebSocket][client][连接关闭]: ${reconnectionTime / 1000}秒后将进行重连 ${url}`)
      client.removeAllListeners()
      createWebSocket({ url, heartbeatTime, reconnectionTime, authorization })
    }, reconnectionTime)
  })

  /**
   * 关闭链接
   */
  const close = () => {
    isReconnect = false
    client.close()
    logger.mark(`[WebSocket][client] 主动关闭连接成功: ${url}`)
  }

  return {
    close,
    client
  }
}

/**
 * 处理收到的消息
 * @param socket - WebSocket实例
 * @param rawData - 消息
 */
const handleMessage = async (
  socket: WebSocket,
  rawData: WebSocket.RawData
) => {
  getCount.count.ws_client++
  const rawString = rawData.toString()
  const options = JSON.parse(rawString) || {}

  /** 服务端主动请求 */
  if (options.type === RequestType.Request) {
    if (options.action === WsAction.Auth) {
      if (options.params.status === Status.Failed) {
        logger.fatal(`[WebSocket][client][鉴权失败]: ${options.params.message}`)
        return
      }

      logger.warn(`[WebSocket][client] 未知请求: ${rawString}`)
    }

    if (!options.params) options.params = {}

    /** 截图、渲染 */
    if (options.action === WsAction.Screenshot || options.action === WsAction.Render) {
      const time = Date.now()

      const data = options.action === WsAction.Screenshot
        ? options.params
        : { ...options.params, file: await renderTemplate(options.params) }

      const result = await puppeteer.screenshot(data)
      if (result.status) {
        createWsScreenshotSuccessResponse(socket, options.echo, result.data)
        return logScreenshotTime(result, options.params, time)
      }

      return createWsScreenshotFailedResponse(socket, options.echo, result.data.message || '未知错误')
    }

    logger.warn(`[WebSocket][client] 未知请求: ${rawString}`)
    return
  }

  /** 服务端返回响应 */
  if (options.type === RequestType.Response) {
    if (options.status === Status.Failed) {
      logger.fatal(`[WebSocket][client][请求失败]: ${rawString}`)
    }
  }
}
