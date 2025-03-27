import { sha256 } from '../../utils/hash'
import { getConfig } from '../../utils/config'
import { createUnauthorizedResponse } from '../utils/response'
import type { RequestHandler } from 'express'

/**
 * 鉴权中间件
 * @param req 请求
 * @param res 响应
 * @param next 下一个中间件
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  logger.info(`${req.method} ${req.ip} ${req.url} ${JSON.stringify(req.body || {})?.slice(0, 150)}...`)
  const token = req?.headers?.authorization || req?.query?.token as string

  if (typeof token !== 'string') {
    createUnauthorizedResponse(res, 'header 或 query 中缺少 token')
    return
  }

  const config = getConfig()

  if (!config.http.token) {
    createUnauthorizedResponse(res, '未设置 token')
    return
  }

  const hash = sha256(config.http.token)
  if (
    token !== hash &&
    token !== `Bearer ${config.http.token}`
  ) {
    createUnauthorizedResponse(res, 'token 不正确')
    return
  }

  next()
}
