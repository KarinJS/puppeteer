import crypto from 'node:crypto'
import { config, logger } from '@/utils'

const bearer = crypto.createHash('md5').update(`Bearer ${config.http.token}`).digest('hex')

/**
 * 鉴权
 * @param type 请求类型
 * @param ip 请求IP
 * @param authorization 鉴权token 可能是md5 也可能是原始token
 */
export const auth = (type: 'get' | 'post' | 'ws', ip?: string, authorization?: string): boolean => {
  if (authorization === config.http.token || authorization === bearer) return true
  logger.error(`[HTTP][${type}][鉴权失败]: ${ip} ${authorization}`)
  return false
}
