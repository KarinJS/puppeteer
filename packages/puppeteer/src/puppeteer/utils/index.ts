import pLimit from 'p-limit'
import pupp from '@karinjs/puppeteer-core'
import { debug } from '../../common'

import type { Browser } from '@karinjs/puppeteer-core'
import type { LaunchOptions, TaskResult } from '../../types'

/**
 * 创建上下文对象
 * @param browser - 浏览器实例
 * @param config - 配置选项
 * @param limiter - 限制器
 * @param reconnectPromise - 重连promise
 * @param close - 关闭浏览器函数
 * @param hmrConfig - 更新配置函数
 * @param executablePath - 浏览器可执行路径
 * @returns 上下文对象
 */
export interface PuppeteerContext {
  /** 浏览器实例 */
  browser: Browser
  /** 配置选项 */
  config: LaunchOptions
  /** 限制器 */
  limiter: ReturnType<typeof pLimit>
  /** 重连promise */
  reconnectPromise?: Promise<void> | null
  /** 关闭浏览器函数 */
  close: () => Promise<void>
  /** 更新配置函数 */
  hmrConfig: (newOptions: LaunchOptions) => Promise<PuppeteerContext>
  /** 浏览器可执行路径 */
  executablePath: string
}

/**
 * 创建上下文对象
 * @param browser - 浏览器实例
 * @param config - 配置选项
 * @param close - 关闭浏览器函数
 * @param hmrConfig - 更新配置函数
 * @returns 上下文对象
 */
export const createContext = (
  browser: Browser,
  config: LaunchOptions,
  close: () => Promise<void>,
  hmrConfig: (newOptions: LaunchOptions) => Promise<PuppeteerContext>
): PuppeteerContext => ({
  browser,
  config,
  limiter: pLimit(config.maxPages || 10),
  reconnectPromise: null,
  close,
  hmrConfig,
  get executablePath () {
    return config.executablePath!
  }
})

/**
 * 处理任务错误
 * @param error - 错误对象
 * @returns 任务结果
 */
export const handleTaskError = (error: unknown): TaskResult<never> => ({
  status: false,
  data: error instanceof Error ? error : new Error(String(error))
})

/**
 * 执行任务并处理错误
 * @param ctx - 上下文对象
 * @param task - 任务函数
 * @returns 任务结果
 */
export const executeTask = async <T> (ctx: PuppeteerContext, task: () => Promise<T>): Promise<TaskResult<T>> => {
  try {
    /** 检查浏览器是否崩溃并正在重连 */
    if (ctx.reconnectPromise) {
      debug('浏览器已崩溃，等待重连')
      await ctx.reconnectPromise
    }

    /** 执行任务 */
    const result = await ctx.limiter(task)
    return { status: true, data: result }
  } catch (error) {
    debug('任务执行错误', error)
    return handleTaskError(error)
  }
}

/**
 * 设置浏览器崩溃监控
 * @param ctx - 上下文对象
 */
export const setupBrowserMonitoring = (ctx: PuppeteerContext): void => {
  ctx.browser.on('disconnected', async () => {
    debug('浏览器已崩溃')

    /** 重新连接浏览器promise */
    ctx.reconnectPromise = (async () => {
      try {
        const browser = await pupp.launch(ctx.config)
        ctx.browser = browser
        setupBrowserMonitoring(ctx)
        ctx.reconnectPromise = null
        debug('浏览器已重新连接')
      } catch (error) {
        debug('浏览器重连失败', error)
      }
    })()
  })
}
