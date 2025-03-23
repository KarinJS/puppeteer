import { puppeteer } from '@/puppeteer'
import { logScreenshotTime } from '@/utils'
import { renderTemplate } from '../utils/template'
import {
  createSuccessResponse,
  createServerErrorResponse
} from '../utils/response'
import type { RequestHandler } from 'express'
import type { ScreenshotOptions } from '@karinjs/puppeteer'

/**
 * 渲染模板类型
 */
export type RenderOptions = ScreenshotOptions & { data?: Record<string, any> }

/**
 * 渲染模板并截图
 */
export const render: RequestHandler = async (req, res) => {
  logger.info(`[render][http][${req.ip}] ${JSON.stringify(req.body)}`)
  try {
    const time = Date.now()
    const options = (req.method === 'POST' ? req.body : req.query) || {}
    const data: RenderOptions = {
      ...options,
      file: await renderTemplate(options)
    }

    const result = await puppeteer.screenshot(data)
    if (result.status) {
      createSuccessResponse(res, result)
      return logScreenshotTime(result, options, time)
    }

    createServerErrorResponse(res, result.data.message || '未知错误')
  } catch (error) {
    createServerErrorResponse(res, (error as Error).message || '未知错误')
    logger.error(error)
  }
}
