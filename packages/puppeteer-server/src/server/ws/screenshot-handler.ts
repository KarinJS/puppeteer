import { puppeteer } from '../../puppeteer'
import { renderTemplate } from '../utils/template'
import { logScreenshotTime } from '../../utils'
import { createPathMapping, setupRequestInterception } from './file-handler'
import {
  createWsScreenshotSuccessResponse,
  createWsScreenshotFailedResponse,
  WsAction
} from '../utils/webSocket'

import type WebSocket from 'ws'
import type { ScreenshotOptions } from '@karinjs/puppeteer'
import { clearMaps } from '../utils/map'

/**
 * 处理截图或渲染请求
 * @param socket WebSocket连接
 * @param raw 原始请求数据
 * @param timeout 超时时间
 * @returns 处理结果
 */
export const handleScreenshotRequest = async (
  socket: WebSocket,
  raw: any,
  timeout: number
): Promise<void> => {
  const time = Date.now()

  try {
    /** 初始化截图参数 */
    const data = await getScreenshotOptions(raw)

    /** 设置请求拦截 */
    setupRequestInterception(socket, data, raw.echo, timeout)

    /** 创建文件路径映射 */
    const { mappedFile } = createPathMapping(raw.echo, data.file)

    /** 执行截图 */
    const result = await puppeteer.screenshot({ ...data, file: mappedFile })

    if (result.status) {
      createWsScreenshotSuccessResponse(socket, raw.echo, result.data)
      logScreenshotTime(result, raw.params || {}, time)
      return
    }

    createWsScreenshotFailedResponse(socket, raw.echo, result.data.message || '截图失败')
    /** 清理映射，避免内存泄漏 */
    clearMaps(raw.echo)
  } catch (error) {
    createWsScreenshotFailedResponse(socket, raw.echo, (error as Error).message || '未知错误')
    /** 清理映射，避免内存泄漏 */
    clearMaps(raw.echo)
  }
}

/**
 * 获取截图参数
 * @param raw 原始请求数据
 * @returns 截图选项
 */
const getScreenshotOptions = async (raw: any): Promise<ScreenshotOptions> => {
  const options: ScreenshotOptions = raw.params || {}

  /** 设置默认选项 */
  if (!options.pageGotoParams) options.pageGotoParams = {}
  options.pageGotoParams.waitUntil = 'networkidle0'

  /** 如果是渲染请求，需要先渲染模板 */
  if (raw.action === WsAction.Render) {
    const file = await renderTemplate(options)
    return { ...options, file }
  }

  return options
}
