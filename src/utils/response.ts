import type { WebSocket } from 'ws'
import type { Response } from 'express'
import { Action } from '@/types/client'

/**
 * 处理Http成功响应
 * @param res 响应对象
 * @param data 渲染数据
 * @param encoding 编码方式
 * @param multiPage 是否为多页
 */
export const httpSuccRes = (
  res: Response,
  data: any,
  encoding: 'base64' | 'binary' = 'binary',
  multiPage?: number | boolean
) => {
  if (typeof multiPage === 'number' || multiPage === true) {
    res.setHeader('Content-Type', 'application/json')
    if (encoding === 'base64') {
      return res.status(200).send(data)
    }

    return res.status(200).send(data.map((item: Uint8Array) => Buffer.from(item)))
  }

  if (encoding === 'base64' && typeof data === 'string') {
    res.setHeader('Content-Type', 'text/plain')
    return res.status(200).send(data)
  }

  res.setHeader('Content-Type', 'image/png')
  return res.status(200).send(Buffer.from(data))
}

/**
 * 处理Http错误响应
 * @param res 响应对象
 * @param error 错误信息对象
 */
export const httpErrRes = (res: Response, error: Error) => {
  res.status(500).send({ status: 500, message: '内部错误', error: error.message })
}

/**
 * 处理ws成功响应
 * @param socket WebSocket实例
 * @param echo 请求唯一标识
 * @param data 渲染数据
 * @param encoding 编码方式
 * @param multiPage 是否为多页
 */
export const wsSuccRes = (
  socket: WebSocket,
  echo: string,
  data: any,
  encoding: 'base64' | 'binary' = 'binary',
  multiPage?: number | boolean
) => {
  const result = { echo, action: Action.response, status: 'ok', data }
  if (typeof multiPage === 'number' || multiPage === true) {
    if (encoding === 'base64') {
      return socket.send(JSON.stringify(result))
    }

    result.data = data.map((item: Uint8Array) => Buffer.from(item))
    return socket.send(JSON.stringify(result))
  }

  if (encoding === 'base64' && typeof data === 'string') {
    return socket.send(JSON.stringify(result))
  }

  result.data = Buffer.from(data)
  return socket.send(JSON.stringify(result))
}

/**
 * 处理ws错误响应
 * @param socket WebSocket实例
 * @param echo 请求唯一标识
 * @param error 错误信息对象
 */
export const wsErrRes = (socket: WebSocket, echo: string, error: unknown) => {
  const result = { echo, action: Action.response, status: 'error', data: { error } }
  socket.send(JSON.stringify(result))
}
