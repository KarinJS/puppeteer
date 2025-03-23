import { puppeteer } from '@/puppeteer'
import {
  createSuccessResponse,
  createServerErrorResponse
} from '../utils/response'
import type { RequestHandler } from 'express'
import { logScreenshotTime } from '@/utils'

/**
 * 截图
 */
export const screenshot: RequestHandler = async (req, res) => {
  logger.info(`[screenshot][http][${req.ip}] ${JSON.stringify(req.body)}`)
  try {
    const time = Date.now()
    const options = (req.method === 'POST' ? req.body : req.query) || {}
    const result = await puppeteer.screenshot(options)
    if (result.status) {
      return createSuccessResponse(res, result)
    }

    createServerErrorResponse(res, result.data.message || '未知错误')
    logScreenshotTime(result, options, time)
  } catch (error) {
    createServerErrorResponse(res, (error as Error).message || '未知错误')
    logger.error(error)
  }
}
