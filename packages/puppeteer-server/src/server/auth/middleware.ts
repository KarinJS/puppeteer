import type { RequestHandler } from 'express'
import { createUnauthorizedResponse } from '../utils/response'

/**
 * 鉴权中间件
 * @param req 请求
 * @param res 响应
 * @param next 下一个中间件
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  const token = req?.headers?.authorization?.replace('Bearer ', '') || req?.query?.token as string

  if (!token) {
    createUnauthorizedResponse(res, 'header 或 query 中缺少 token')
  }

  // TODO: 验证 token

  next()
}
