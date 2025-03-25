import { createWebSocket } from './webSocket'
import type WebSocket from 'ws'
import type { Config } from '../types/config'

export const WebSocketMap = new Map<WebSocket, () => void>()

/**
 * 初始化ws客户端
 * @param client 配置
 */
export const initWebSocket = async (client: Config['ws_client']) => {
  client.forEach((item) => {
    if (!item.enable) return
    addWebSocket(item)
  })
}

/**
 * 传入url 中断对应的ws连接
 * @param url
 */
export const closeWebSocket = (url: string) => {
  WebSocketMap.forEach((_, key) => {
    if (key.url === url || key.url === `${url}/`) {
      key.emit('activeDisconnect')
      key.close()
    }
  })
}

/**
 * 新建ws连接
 * @param options 配置
 */
export const addWebSocket = (options: Config['ws_client'][number]) => {
  if (!options.enable) return
  const result = createWebSocket({
    url: options.url,
    heartbeatTime: options.heartbeatTime || 30 * 1000,
    reconnectionTime: options.reconnectionTime || 5 * 1000,
    authorization: options.authorization
  })

  if (result) {
    WebSocketMap.set(result.client, result.close)
  }
}
