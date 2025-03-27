import { server } from '../../server/app'
import { WebSocketServer } from 'ws'
import { sha256 } from '../../utils/hash'
import { getCount } from '../../cache/count'
import { eventEmitter } from '../../utils/event'
import { handleScreenshotRequest } from './screenshot-handler'
import {
  WsAction,
  RequestType,
  createWsAuthErrorRequest,
  createWsServerErrorResponse,
} from '../utils/webSocket'

import type WebSocket from 'ws'

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
    logger.info(`[WebSocket][client] 连接: ${request.url}`)

    /** 验证路径 */
    if (request.url !== router) {
      return createWsAuthErrorRequest(socket, 'path is not valid')
    }

    /** 验证令牌 */
    if (!validateToken(request.headers.authorization, token)) {
      return createWsAuthErrorRequest(socket, 'auth failed')
    }

    /** 处理消息 */
    socket.on('message', (raw) => {
      try {
        handleMessage(socket, raw, timeout)
      } catch (error) {
        logger.error(error)
        const { echo } = JSON.parse(raw.toString()) || {}
        createWsServerErrorResponse(socket, echo, (error as Error).message || '未知错误')
      }
    })

    /** 处理关闭 */
    socket.on('close', () => {
      logger.info('[WebSocket][client] 断开连接')
    })
  })
}

/**
 * 验证令牌
 * @param authorization 认证头
 * @param token 配置的令牌
 * @returns 是否有效
 */
const validateToken = (authorization: string | undefined, token?: string): boolean => {
  if (!token) return true
  return `Bearer ${token}` === authorization || `Bearer ${sha256(token)}` === authorization
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

  try {
    const raw = JSON.parse(rawString) || {}
    const { type } = raw

    /** 处理客户端响应 */
    if (type === RequestType.Response) {
      handleClientResponse(socket, raw, rawString)
      return
    }

    /** 处理请求 */
    if (type === RequestType.Request) {
      await handleClientRequest(socket, raw, timeout)
      return
    }

    logger.warn(`[WebSocket][client] 未知消息类型: ${rawString}`)
  } catch (error) {
    logger.error(`[WebSocket] 处理消息失败: ${error}`)
    try {
      const { echo } = JSON.parse(rawString) || {}
      createWsServerErrorResponse(socket, echo, (error as Error).message || '消息处理失败')
    } catch {
      logger.error(`[WebSocket] 无法发送错误响应: ${error}`)
    }
  }
}

/**
 * 处理客户端响应
 * @param socket WebSocket连接
 * @param raw 响应数据
 * @param rawString 原始消息
 */
const handleClientResponse = (
  socket: WebSocket,
  raw: any,
  rawString: string
) => {
  if (raw.action === WsAction.UploadFile) {
    eventEmitter.emit(raw.echo, { status: raw.status, data: raw.data })
    return
  }

  logger.warn(`[WebSocket][client] 未知响应: ${rawString}`)
}

/**
 * 处理客户端请求
 * @param socket WebSocket连接
 * @param raw 请求数据
 * @param timeout 超时时间
 */
const handleClientRequest = async (
  socket: WebSocket,
  raw: any,
  timeout: number
) => {
  const { action, echo } = raw

  try {
    switch (action) {
      case WsAction.Auth:
        logger.info(`[WebSocket][client] 鉴权请求: ${JSON.stringify(raw.params)}`)
        return
      case WsAction.Screenshot:
      case WsAction.Render:
        await handleScreenshotRequest(socket, raw, timeout)
        return
      default:
        logger.warn(`[WebSocket][client] 未知请求类型: ${action}`)
        createWsServerErrorResponse(socket, echo, `不支持的请求类型: ${action}`)
    }
  } catch (error) {
    logger.error(`[WebSocket] 处理请求失败: ${error}`)
    createWsServerErrorResponse(socket, echo, (error as Error).message || '请求处理失败')
  }
}
