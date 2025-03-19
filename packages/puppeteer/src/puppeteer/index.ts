import pupp from '@karinjs/puppeteer-core'
import pLimit from 'p-limit'
import EventEmitter from 'node:events'
import { debug } from '../common'
import { browserOptions } from '../browser'
import { ScreenshotManager } from './screenshot'

import type { Browser } from '@karinjs/puppeteer-core'
import type {
  Encoding,
  LaunchOptions,
  MultiPage,
  ScreenshotOptions,
  TaskResult
} from '../types'

/**
 * Puppeteer 类
 * 提供浏览器自动化和截图功能的统一接口
 */
export class Puppeteer extends EventEmitter {
  /** 浏览器实例 */
  #browser: Browser
  /** 浏览器配置 */
  #config: LaunchOptions
  /** 并发限制器 */
  #concurrencyLimiter: ReturnType<typeof pLimit>
  /** 最大并发数 */
  #maxConcurrency: number = 10
  /** 浏览器是否已崩溃 */
  #isBrowserCrashed: boolean = false
  /** 浏览器崩溃后重新初始化promise */
  #reconnectPromise: Promise<this> | null = null
  /** 截图管理器 */
  #screenshotManager: ScreenshotManager

  constructor (browser: Browser, config: LaunchOptions) {
    super()
    this.#browser = browser
    this.#config = config
    this.#maxConcurrency = config.maxPages || 10
    this.#concurrencyLimiter = pLimit(this.#maxConcurrency)
    this.#screenshotManager = new ScreenshotManager(this)
    this.#setupBrowserMonitoring()
  }

  /**
   * 获取浏览器配置
   */
  get config () {
    return this.#config
  }

  /**
   * 获取浏览器实例
   */
  get browser () {
    return this.#browser
  }

  /**
   * 添加任务到队列
   * @param task 执行任务函数
   */
  async addTask<T> (task: () => Promise<T>): Promise<TaskResult<T>> {
    const executeTask = async () => {
      if (this.#isBrowserCrashed) {
        debug('浏览器已崩溃，等待重连')
        await this.#reconnectPromise!
      }
      return task()
    }

    try {
      const result = await this.#concurrencyLimiter(executeTask)
      return { status: true, data: result }
    } catch (error) {
      debug('并发限制器错误', error)
      return this.#handleTaskError(error)
    }
  }

  /**
   * 统一错误处理函数
   */
  #handleTaskError (error: unknown): TaskResult<never> {
    return {
      status: false,
      data: error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 监控浏览器崩溃事件
   */
  #setupBrowserMonitoring () {
    this.#browser.on('disconnected', async () => {
      debug('浏览器已崩溃')
      this.#isBrowserCrashed = true
      this.#reconnectPromise = this.#reconnectBrowser()
    })
  }

  /**
   * 重新连接浏览器
   */
  async #reconnectBrowser () {
    const browser = await pupp.launch(this.#config)
    debug('浏览器已重新连接')
    this.#browser = browser
    this.#isBrowserCrashed = false
    this.#reconnectPromise = null
    this.#setupBrowserMonitoring()
    return this
  }

  /**
   * 截图方法
   * @param options 截图参数
   * @returns 截图结果
   */
  async screenshot<T extends Encoding, M extends MultiPage> (
    options: ScreenshotOptions & { encoding?: T, multiPage?: M }
  ) {
    /** 将截图任务委托给截图管理器 */
    return this.#screenshotManager.screenshot(options)
  }
}

/**
 * 创建浏览器实例
 * @param options 浏览器配置
 * @returns 浏览器实例
 */
export const launch = async (options: LaunchOptions = {}) => {
  const config = await browserOptions(options)
  const browser = await pupp.launch(config)
  return new Puppeteer(browser, config)
}
