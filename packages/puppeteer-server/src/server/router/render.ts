import { puppeteer } from '../../puppeteer'
import { getConfig, logScreenshotTime } from '../../utils'
import { renderTemplate } from '../utils/template'
import {
  createScreenshotSuccessResponse,
  createServerErrorResponse,
  createSuccessResponse
} from '../utils/response'
import type { ScreenshotOptions } from '@karinjs/puppeteer'
import type { RequestHandler, Request, Response } from 'express'

/**
 * 渲染模板类型
 */
export type RenderOptions = ScreenshotOptions & { data?: Record<string, any> }

/**
 * 渲染模板并截图
 */
export const renderRouter: RequestHandler = async (req, res) => {
  screenshot('render', req, res)
}

/**
 * 截图
 */
export const screenshotRouter: RequestHandler = async (req, res) => {
  screenshot('screenshot', req, res)
}

/**
 * 截图
 * @param type 类型
 * @param req 请求
 * @param res 响应
 */
const screenshot = async (
  type: 'render' | 'screenshot',
  req: Request,
  res: Response
) => {
  const config = getConfig()
  if (!config.http.screenshot) {
    createServerErrorResponse(res, '截图功能已关闭')
    return
  }

  try {
    const time = Date.now()

    /**
     * 参数归一化
     */
    let options = (req.method === 'POST' ? req.body : req.query) || {}
    if (type === 'render') {
      options = {
        ...options,
        file: await renderTemplate(options)
      }
    }

    const result = await puppeteer.screenshot(options)
    if (result.status) {
      if (req.method === 'GET') {
        return createScreenshotSuccessResponse(res, options.multiPage, result.data)
      } else {
        createSuccessResponse(res, result.data)
      }
      return logScreenshotTime(result, options, time)
    }

    createServerErrorResponse(res, result.data.message || '未知错误')
  } catch (error) {
    createServerErrorResponse(res, (error as Error).message || '未知错误')
    logger.error(error)
  }
}
