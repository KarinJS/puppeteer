import type WebSocket from 'ws'
import type { UploadFileRequestParams } from '../../types/client'

/**
 * 请求类型
 */
export enum RequestType {
  /** 请求 */
  Request = 'request',
  /** 响应 */
  Response = 'response',
}

/**
 * 成功失败
 */
export enum Status {
  /** 成功 */
  OK = 'ok',
  /** 失败 */
  Failed = 'failed',
}

/** ws状态码 */
export enum Retcode {
  /** 成功 */
  OK = 1200,
  /** 请求错误 */
  BadRequest = 1400,
  /** 未授权 */
  Unauthorized = 1401,
  /** 禁止访问 */
  Forbidden = 1403,
  /** 未找到 */
  NotFound = 1404,
  /** 方法不允许 */
  MethodNotAllowed = 1405,
  /** 请求体过大 */
  PayloadTooLarge = 1413,
  /** 服务器错误 */
  InternalServerError = 1500,
  /** 访问令牌已过期 */
  AccessTokenExpired = 1419,
  /** 刷新令牌已过期 */
  RefreshTokenExpired = 1420,
}

/**
 * wsAction
 */
export enum WsAction {
  /** 鉴权 */
  Auth = 'auth',
  /** 截图 */
  Screenshot = 'screenshot',
  /** 渲染并截图 */
  Render = 'render',
  /** 上传文件 */
  UploadFile = 'uploadFile',
}

/**
 * 创建请求
 * @param socket - WebSocket实例
 * @param action - 动作
 * @param params - 参数
 */
export const createWsRequest = (
  socket: WebSocket,
  action: string,
  params: any = {}
) => {
  const type = RequestType.Request
  const echo = params.echo
  delete params.echo

  const string = JSON.stringify({ type, action, params, echo })
  socket.send(string)
}

/**
 * 创建响应
 * @param socket - WebSocket实例
 * @param echo - 请求的echo
 * @param retcode - 状态码
 * @param status - 状态
 * @param data - 数据
 */
export const createWsResponse = (
  socket: WebSocket,
  echo: number,
  retcode: number,
  status: Status,
  data: unknown = null
) => {
  const type = RequestType.Response
  const string = JSON.stringify({ type, retcode, status, echo, data })
  socket.send(string)
}

/**
 * 创建鉴权失败请求
 * @param socket - WebSocket实例
 * @param message - 错误信息
 */
export const createWsAuthErrorRequest = (socket: WebSocket, message: string) => {
  logger.error(`[WebSocket][client] 鉴权失败: ${message}`)
  createWsRequest(socket, WsAction.Auth, { status: Status.Failed, message })
  socket.close()
}

/**
 * 创建要求客户端上传文件请求
 * @param socket - WebSocket实例
 * @param data - 数据
 */
export const createWsUploadFileRequestRequest = (socket: WebSocket, data: UploadFileRequestParams) => {
  createWsRequest(socket, WsAction.UploadFile, data)
}

/**
 * 创建截图成功响应
 * @param socket - WebSocket实例
 * @param echo - 请求的echo
 * @param data - 数据
 */
export const createWsScreenshotSuccessResponse = (socket: WebSocket, echo: number, data: unknown) => {
  createWsResponse(socket, echo, Retcode.OK, Status.OK, data)
}

/**
 * 创建截图失败响应
 * @param socket - WebSocket实例
 * @param echo - 请求的echo
 * @param message - 错误信息
 */
export const createWsScreenshotFailedResponse = (socket: WebSocket, echo: number, message: string) => {
  createWsResponse(socket, echo, Retcode.BadRequest, Status.Failed, message)
}

/**
 * 创建服务器错误响应
 * @param socket - WebSocket实例
 * @param echo - 请求的echo
 * @param message - 错误信息
 */
export const createWsServerErrorResponse = (socket: WebSocket, echo: number, message: string) => {
  createWsResponse(socket, echo, Retcode.InternalServerError, Status.Failed, message)
}
