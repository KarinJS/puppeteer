import fs from 'node:fs'
import path from 'node:path'
import { createLog, debug } from '../../common'
import type { Page } from '@karinjs/puppeteer-core'
import type { PuppeteerContext } from '../utils'
import type { ScreenshotOptions } from '../../types/screenshot'

/**
 * 检查指定元素是否存在
 * @param page 页面实例
 * @param selector 选择器
 */
const checkElement = async (page: Page, selector: string) => {
  const result = await page.$(selector)
  return !!result
}

/**
 * 初始化页面
 * @param browser - 浏览器实例
 * @param options - 截图参数
 * @param timeout - 超时时间
 */
const newPage = async (
  ctx: PuppeteerContext,
  options: ScreenshotOptions,
  timeout: number
) => {
  if (!options.pageGotoParams) options.pageGotoParams = {}
  if (!options.pageGotoParams.timeout) options.pageGotoParams.timeout = timeout

  /** 创建页面 */
  const page = await ctx.browser.newPage()

  /** 设置HTTP 标头 */
  if (options.headers) await page.setExtraHTTPHeaders(options.headers)
  if (typeof options.setRequestInterception === 'function') {
    await page.setRequestInterception(true)
    page.on('request', (req) => options.setRequestInterception!(req, options))
  }

  if (!options.file_type) options.file_type = 'auto'

  /** 打开页面 */
  if (options.file_type === 'auto') {
    if (options.file.startsWith('http') || options.file.startsWith('file://')) {
      await page.goto(options.file, options.pageGotoParams)
    } else if (fs.existsSync(options.file)) {
      await page.goto(`file://${path.resolve(options.file)}`, options.pageGotoParams)
    } else {
      throw new Error(`不支持的file: ${options.file}`)
    }
  } else if (options.file_type === 'htmlString') {
    await page.setContent(options.file, options.pageGotoParams)
  } else {
    throw new Error(`file_type 参数错误 咱不支持${options.file_type}类型`)
  }

  if (!options.waitForSelector) {
    options.waitForSelector = ['body']
  } else if (!Array.isArray(options.waitForSelector)) {
    options.waitForSelector = [options.waitForSelector || 'body']
  } else {
    options.waitForSelector.push('body')
  }

  const list: Promise<unknown>[] = []

  /** 等待页面网络请求完成 */
  const waitForNetworkIdle = async () => {
    try {
      await page.waitForNetworkIdle({
        timeout,
        idleTime: ctx.config.idleTime ?? 10,
        concurrency: 0
      })
    } catch (error) {
      console.warn(createLog('页面网络请求加载超时'), error)
    }
  }

  /** 等待指定元素加载完成 */
  const waitForSelector = async (selector: string) => {
    const isExist = await checkElement(page, selector)
    if (!isExist) return
    await page.waitForSelector(selector, { timeout }).catch(() => {
      console.warn(createLog(`页面元素 ${selector} 加载超时`))
    })
  }

  /** 等待特定函数完成 */
  const waitForFunction = async (func: string) => {
    await page.waitForFunction(func, { timeout }).catch(() => {
      console.warn(createLog(`函数 ${func} 加载超时`))
    })
  }

  /** 等待特定请求完成 */
  const waitForRequest = async (req: string) => {
    await page.waitForRequest(req, { timeout }).catch(() => {
      console.warn(createLog(`请求 ${req} 加载超时`))
    })
  }

  /** 等待特定响应完成 */
  const waitForResponse = async (res: string) => {
    await page.waitForResponse(res, { timeout }).catch(() => {
      console.warn(createLog(`响应 ${res} 加载超时`))
    })
  }

  /** 等待指定元素加载完成 */
  options.waitForSelector.forEach((selector) => {
    list.push(waitForSelector(selector))
  })

  /** 等待特定函数完成 */
  if (options.waitForFunction) {
    if (!Array.isArray(options.waitForFunction)) {
      options.waitForFunction = [options.waitForFunction]
    }
    options.waitForFunction.forEach((func) => {
      list.push(waitForFunction(func))
    })
  }

  /** 等待特定请求完成 */
  if (options.waitForRequest) {
    if (!Array.isArray(options.waitForRequest)) {
      options.waitForRequest = [options.waitForRequest]
    }
    options.waitForRequest.forEach((req) => {
      list.push(waitForRequest(req))
    })
  }

  /** 等待特定响应完成 */
  if (options.waitForResponse) {
    if (!Array.isArray(options.waitForResponse)) {
      options.waitForResponse = [options.waitForResponse]
    }
    options.waitForResponse.forEach((res) => {
      list.push(waitForResponse(res))
    })
  }

  /** 实验性功能 等待页面网络请求完成 */
  if (options.pageGotoParams?.waitUntil === 'domcontentloaded') {
    list.push(waitForNetworkIdle())
  }

  /** 等待所有任务完成 */
  await Promise.allSettled(list)
  return page
}

/**
 * 初始化页面
 * @param browser - 浏览器实例
 * @param options - 截图参数
 * @param timeout - 超时时间
 */
export const createPage = async (
  ctx: PuppeteerContext,
  options: ScreenshotOptions,
  timeout: number
) => {
  try {
    return newPage(ctx, options, timeout)
  } catch (error) {
    debug('newPage:\n', error)
    /** 如果newPage失败 说明浏览器崩溃了 这里需要等500ms 在webDriverBiDi协议下抛出事件比较慢 */
    await new Promise(resolve => setTimeout(resolve, 500))
    throw error
  }
}
