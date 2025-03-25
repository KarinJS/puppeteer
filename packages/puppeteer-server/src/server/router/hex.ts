import crypto from 'node:crypto'
import { createServerErrorResponse, createSuccessResponse } from '../utils/response'
import type { RequestHandler } from 'express'

/**
 * 生成sha256
 */
export const hex: RequestHandler = (req, res) => {
  const token = req.params?.token
  if (!token) {
    return createServerErrorResponse(res, 'token is required')
  }

  const bearer = 'Bearer ' + crypto.createHash('sha256').update(token).digest('hex')
  createSuccessResponse(res, bearer)
}
