import { createSuccessResponse } from '../utils/response'
import type { RequestHandler } from 'express'

/**
 * ping
 */
export const ping: RequestHandler = (_, res) => {
  createSuccessResponse(res, { ping: 'pong' }, '永远相信美好的事情即将发生')
}
