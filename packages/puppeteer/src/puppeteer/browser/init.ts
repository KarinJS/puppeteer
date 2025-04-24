import { debug } from '../../common'
import pupp from 'puppeteer-core'
import { browserOptions } from './options'
import { createPage } from '../page/page'
import { createContext, PuppeteerContext, setupBrowserMonitoring } from '../utils'

import type { Browser, Page } from 'puppeteer-core'
import type { LaunchOptions, ScreenshotOptions } from '../../types'

/**
 * 在页面上执行操作并确保正确关闭
 * @param browser - 浏览器实例
 * @param options - 选项
 * @param timeout - 超时时间
 * @param fn - 回调函数
 * @returns 回调函数返回值
 */
export const withPage = async <T> (
  ctx: PuppeteerContext,
  options: ScreenshotOptions,
  timeout: number,
  fn: (page: Page) => Promise<T>
): Promise<T> => {
  const page = await createPage(ctx, options, timeout)
  try {
    return await fn(page)
  } finally {
    if (!ctx.config.debug) {
      await page?.close?.()?.catch(err => debug('关闭页面失败:', err))
    }
  }
}

/**
 * 更新浏览器配置
 * @param ctx - 浏览器上下文
 * @param newOptions - 新的配置选项
 * @returns 更新后的上下文
 */
export const updateConfig = async (
  ctx: PuppeteerContext,
  newOptions: LaunchOptions = {}
): Promise<PuppeteerContext> => {
  const config = await browserOptions(newOptions)
  ctx.config = config

  if (config.hmr === true) {
    debug('检测到hmr为true，正在重载浏览器...')
    try {
      await ctx.browser.close().catch(err => debug('关闭浏览器失败:', err))
    } catch (error) {
      debug('重载浏览器失败:', error)
      throw error
    }
  } else {
    debug('更新配置，不重载浏览器')
  }
  return ctx
}

/**
 * 初始化浏览器
 * @param options - 选项
 * @returns 浏览器实例和更新配置函数
 */
export const initBrowser = async (
  options: LaunchOptions = {}
) => {
  let browser: Browser
  const config = await browserOptions(options)

  if (config.browserWSEndpoint) {
    browser = await pupp.connect(config)
  } else {
    browser = await pupp.launch(config)
  }

  /**
   * 关闭浏览器
   */
  const close = async () => {
    browser.removeAllListeners('disconnected')
    await browser.close()
  }

  /**
   * 更新配置
   * @param newOptions - 新的配置选项
   * @returns 更新后的上下文
   */
  const configUpdater = async (newOptions: LaunchOptions) => {
    return updateConfig(ctx, newOptions)
  }

  const ctx = createContext(browser, config, close, configUpdater)
  setupBrowserMonitoring(ctx)

  return { browser, ctx }
}
