import crypto from 'node:crypto'
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
  const token = req?.headers?.authorization || req?.query?.token as string

  console.log(token)
  if (typeof token !== 'string') {
    createUnauthorizedResponse(res, 'header 或 query 中缺少 token')
    return
  }

  const config = getConfig()

  if (!config.http.token) {
    createUnauthorizedResponse(res, '未设置 token')
    return
  }

  const getMd5 = (token: string) => {
    return crypto.createHash('md5').update(token).digest('hex')
  }

  const md5 = 'Bearer ' + getMd5(getMd5(config.http.token))
  logger.info(token, md5)
  if (
    token !== md5 &&
    token !== `Bearer ${config.http.token}`
  ) {
    createUnauthorizedResponse(res, 'token 不正确')
    return
  }

  // TODO: 验证 token 需要将token进行两次md5加密

  next()
}
