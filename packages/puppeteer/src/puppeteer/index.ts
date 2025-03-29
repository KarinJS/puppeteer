import { initBrowser } from './browser'
import { screenshot } from './screenshot'
import { createLogger } from '../common/logger'

import type { LaunchOptions, ScreenshotOptions, Encoding, MultiPage } from '../types'

/**
 * 创建Puppeteer实例
 * @param options - 启动选项
 * @returns 浏览器实例
 */
export const launch = async (options: LaunchOptions = {}) => {
  if (options.logger) createLogger(options.logger)
  const { ctx } = await initBrowser(options)

  return {
    /**
     * 浏览器上下文
     */
    get ctx () {
      return ctx
    },

    /**
     * 获取浏览器二进制路径
     */
    get executablePath () {
      return ctx.config.executablePath!
    },

    /**
     * 浏览器实例
     */
    get browser () {
      return ctx.browser
    },

    /**
     * 获取浏览器配置
     */
    get config () {
      return ctx.config
    },

    /**
     * 截图方法
     * @param options - 截图选项
     * @returns 截图结果
     */
    screenshot: <T extends Encoding, M extends MultiPage> (
      options: ScreenshotOptions & { encoding?: T, multiPage?: M }
    ) => screenshot<T, M>(ctx, options),

    /**
     * 关闭浏览器
     */
    close: ctx.close,

    /**
     * 更新浏览器配置
     * @param options - 新的配置选项
     * @returns 更新后的上下文
     */
    hmrConfig: ctx.hmrConfig
  }
}
