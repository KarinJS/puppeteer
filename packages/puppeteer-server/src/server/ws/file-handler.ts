import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import * as mime from 'mime-types'
import { getCache } from '../../cache'
import { eventEmitter } from '../../utils/event'
import { createUploadFileEventKey } from '../utils/key'
import { uploadFileMap, filePathMap } from '../utils/map'
import {
  createWsUploadFileRequestRequest,
  Status
} from '../utils/webSocket'

import type WebSocket from 'ws'
import type { UploadFileRequestParams } from '../../types/client'

/**
 * 创建HTML文件路径映射
 * @param echo 请求标识
 * @param originalFile 原始文件路径
 * @returns 映射信息
 */
export const createPathMapping = (echo: string, originalFile: string) => {
  const file = originalFile.replace('file://', '')
  /** 通过盘符判断是否为windows */
  const isWindows = /^[a-zA-Z]:/.test(file)
  const dir = path.dirname(file)
  let mock = process.platform === 'win32' ? 'file:///C:/mock' : 'file:///root/mock'
  mock = `${mock}/raw-${echo}-dir`

  /** 创建MD5用于标识文件 */
  const md5 = crypto.createHash('md5').update(originalFile).digest('hex')
  const mappedFile = `${mock}/${md5}.html`

  /** 保存映射关系 */
  const mapping = { isWindows, dir, mock, original: originalFile, echo }
  filePathMap.set(mappedFile, mapping)
  filePathMap.set(echo, mapping)

  return { mappedFile, mapping }
}

/**
 * 设置请求拦截
 * @param socket WebSocket连接
 * @param options 截图选项
 * @param echo 请求标识
 * @param timeout 超时时间
 */
export const setupRequestInterception = (
  socket: WebSocket,
  options: any,
  echo: string,
  timeout: number
) => {
  options.setRequestInterception = async (request: any) => {
    try {
      /** 请求的url */
      const url = request.url()

      /** 处理HTTP请求（不拦截） */
      if (url.startsWith('http')) {
        return request.continue()
      }

      /** 资源类型 */
      const type = request.resourceType()
      /** 白名单 */
      const allowedTypes = ['image', 'font', 'stylesheet', 'document', 'script']
      if (!allowedTypes.includes(type)) {
        return request.continue()
      }

      /** 处理文件请求 */
      const targetUrl = resolveFileUrl(url)

      /** 资源类型 */
      const contentType = mime.contentType(path.extname(targetUrl)) || 'application/octet-stream'

      /** 尝试从缓存获取 */
      const cache = getCache(targetUrl, type)
      if (cache) {
        return request.respond({
          status: 200,
          headers: {
            'Content-Type': contentType
          },
          body: fs.readFileSync(cache)
        })
      }

      /** 向客户端请求文件 */
      uploadFileMap.set(echo, {
        filePath: targetUrl,
        contentType: type,
        url: targetUrl
      })

      const filePath = await requestFileFromClient(socket, {
        echo,
        contentType,
        url: targetUrl,
        timeout
      })

      /** 返回文件内容 */
      request.respond({
        status: 200,
        headers: {
          'Content-Type': contentType
        },
        body: fs.readFileSync(filePath)
      })
    } catch (error) {
      console.log('请求拦截错误:', error)
      return request.respond({
        status: 404,
        contentType: 'text/plain',
        body: (error as Error).message
      })
    }
  }
}

/**
 * 解析文件URL
 * @param url 原始URL
 * @returns 目标URL
 */
const resolveFileUrl = (url: string): string => {
  /** 尝试直接从映射中获取 */
  const original = filePathMap.get(url)
  if (original) {
    return original.original
  }

  /** 尝试解析相对路径 */
  const mockMatch = url.match(/raw-([a-zA-Z0-9]+)-dir/)
  if (mockMatch?.[1]) {
    const echo = mockMatch[1]
    const mapping = filePathMap.get(echo)

    if (mapping) {
      const targetUrl = url.replace(mapping.mock, mapping.dir)
      /** 添加文件协议前缀 */
      return mapping.isWindows ? `file:///${targetUrl}` : `file://${targetUrl}`
    }
  }

  /** 无法解析，返回原始URL */
  return url
}

/**
 * 从客户端请求文件
 * @param socket WebSocket连接
 * @param options 请求选项
 * @returns 文件路径
 */
const requestFileFromClient = (socket: WebSocket, options: {
  echo: string
  contentType: string
  url: string
  timeout: number
}): Promise<string> => {
  const key = createUploadFileEventKey(options.echo)

  return new Promise((resolve, reject) => {
    /** 设置超时处理 */
    let timeoutHandler: NodeJS.Timeout | null = setTimeout(() => {
      timeoutHandler = null
      eventEmitter.removeListener(key, filePathHandler)
      reject(new Error('从客户端获取文件超时'))
    }, options.timeout)

    /** 文件路径处理器 */
    const filePathHandler = (filePath: string) => {
      if (timeoutHandler) {
        clearTimeout(timeoutHandler)
        timeoutHandler = null
      }
      resolve(filePath)
    }

    /** 监听上传完成事件 */
    eventEmitter.once(key, filePathHandler)

    /** 发送上传请求 */
    sendUploadRequest(socket, {
      echo: options.echo,
      type: options.contentType,
      path: options.url,
      uploadPath: '/api/upload'
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
      .catch(error => {
        if (timeoutHandler) {
          clearTimeout(timeoutHandler)
          timeoutHandler = null
        }
        eventEmitter.removeListener(key, filePathHandler)
        reject(error)
      })
  })
}

/**
 * 发送上传请求到客户端
 * @param socket WebSocket连接
 * @param params 请求参数
 * @returns 请求结果
 */
const sendUploadRequest = (
  socket: WebSocket,
  params: UploadFileRequestParams
): Promise<{ status: Status, data: string }> => {
  return new Promise((resolve) => {
    eventEmitter.once(params.echo, (options) => resolve(options))
    setTimeout(() => {
      const options = { status: Status.Failed, data: '发送请求超时' }
      eventEmitter.emit(params.echo, options)
    }, 3 * 1000)

    createWsUploadFileRequestRequest(socket, params)
  })
}
