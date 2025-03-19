import { debug } from '../../common'
import { createPage } from '../page/page'
import { getTimeout } from '../page/timeout'
import { setViewport } from '../page/setViewport'
import { getScreenshotOptions } from '../page/getScreenshotOptions'

import type {
  BoundingBox,
  ElementHandle,
  Page,
  ScreenshotOptions as PuppeteerScreenshotOptions,
} from '@karinjs/puppeteer-core'
import type {
  Encoding,
  MultiPage,
  ScreenshotOptions,
  ScreenshotResult,
  TaskResult,
} from '../../types'
import type { Puppeteer } from '../index'

/**
 * 截图管理器类
 * 提供截图功能的统一接口
 */
export class ScreenshotManager {
  /** Puppeteer实例 */
  #puppeteer: Puppeteer

  constructor (puppeteer: Puppeteer) {
    this.#puppeteer = puppeteer
  }

  /**
   * 截图方法
   * @param options 截图参数
   * @returns 截图结果
   */
  async screenshot<T extends Encoding = 'binary', M extends MultiPage = false> (
    options: ScreenshotOptions & { encoding?: T, multiPage?: M }
  ): Promise<TaskResult<ScreenshotResult<T, M>>> {
    const retryCount = options.retry ?? 1
    const result = await this.#puppeteer.addTask<ScreenshotResult<T, M>>(
      () => this.#performScreenshot<T, M>(options)
    )

    if (result.status || retryCount <= 0) return result

    return this.screenshot({ ...options, retry: retryCount - 1 })
  }

  /**
   * 执行截图操作
   */
  async #performScreenshot<T extends Encoding = 'binary', M extends MultiPage = false> (
    options: ScreenshotOptions & { encoding?: T, multiPage?: M }
  ): Promise<ScreenshotResult<T, M>> {
    /** 获取超时时间 */
    const timeout = getTimeout(options?.pageGotoParams?.timeout)
    /** 创建页面 */
    const page = await createPage(this.#puppeteer.browser, options, timeout)

    try {
      /** 获取截图参数 */
      const screenshotOptions = getScreenshotOptions(options)

      /** 处理全页面截图 */
      if (screenshotOptions.fullPage) {
        screenshotOptions.captureBeyondViewport = true
        return await this.#takeScreenshot(page, screenshotOptions, timeout)
      }

      /** 获取目标元素和尺寸 */
      const element = await this.#findTargetElement(page, options.selector)
      const box = await element.boundingBox()

      /** 设置视窗大小 */
      await setViewport(
        page,
        options?.setViewport?.width || box?.width,
        options?.setViewport?.height || box?.height,
        options?.setViewport?.deviceScaleFactor
      )

      /** 根据是否分页决定截图方式 */
      if (options.multiPage) {
        return await this.#takeMultiPageScreenshot<T, M>(element, options, box, timeout)
      }

      return await this.#takeScreenshot<T, M>(element, screenshotOptions, timeout)
    } finally {
      if (!this.#puppeteer.config.debug) {
        await page?.close?.().catch(err => console.error('关闭页面失败:', err))
      }
    }
  }

  /**
   * 获取页面目标元素
   * @param page 页面实例
   * @param selector 元素选择器
   */
  async #findTargetElement (page: Page, selector?: string) {
    /** 获取默认元素（容器或body） */
    const findDefaultElement = async () => {
      const container = await page.$('#container')
      if (container) return container

      const body = await page.$('body')
      return body!
    }

    try {
      if (selector) {
        const element = await page.$(selector)
        if (element) return element
      }

      return findDefaultElement()
    } catch (err) {
      debug('查找元素失败', err)
      return findDefaultElement()
    }
  }

  /**
   * 处理分页截图
   */
  async #takeMultiPageScreenshot<T extends Encoding, M extends MultiPage> (
    target: Page | ElementHandle<Element>,
    options: ScreenshotOptions,
    box: BoundingBox | null,
    timeout: number
  ): Promise<ScreenshotResult<T, M>> {
    const results: ScreenshotResult<T, number> = []
    const boxWidth = box?.width ?? 1200
    const boxHeight = box?.height ?? 2000

    /** 计算每页高度 */
    const pageHeight = typeof options.multiPage === 'number'
      ? options.multiPage
      : boxHeight >= 2000 ? 2000 : boxHeight

    /** 计算总页数 */
    const totalPages = Math.ceil(boxHeight / pageHeight)

    /** 逐页截图 */
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const { y, height } = this.#calculatePageDimensions(pageIndex, pageHeight, boxHeight)

      const clipOptions = {
        ...options,
        clip: { x: 0, y, width: boxWidth, height }
      }

      /** 单页截图 */
      const screenshot = await this.#takeScreenshot<T, false>(target, clipOptions, timeout)
      results.push(screenshot)
    }

    /** 返回结果数组 */
    return results as ScreenshotResult<T, M>
  }

  /**
   * 计算分页截图的页面尺寸
   */
  #calculatePageDimensions (
    pageIndex: number,
    pageHeight: number,
    totalHeight: number
  ) {
    let y = pageIndex * pageHeight
    let height = Math.min(pageHeight, totalHeight - pageIndex * pageHeight)

    /** 非首页上方增加100px重叠区域，避免分页截图出现断层 */
    if (pageIndex !== 0) {
      y -= 100
      height += 100
    }

    return { y, height }
  }

  /**
   * 实际截图操作
   */
  async #takeScreenshot<T extends Encoding, M extends MultiPage> (
    target: Page | ElementHandle<Element>,
    options: Readonly<PuppeteerScreenshotOptions>,
    timeout: number
  ): Promise<ScreenshotResult<T, M>> {
    const timeoutError = new Error(
      JSON.stringify(
        {
          message: `TimeoutError: Navigation Timeout Exceeded: ${timeout}ms exceeded`,
          options,
        },
        null,
        2
      )
    )

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(timeoutError)
      }, timeout)

      target.screenshot(options)
        .then((data) => {
          clearTimeout(timer)
          resolve(data as unknown as ScreenshotResult<T, M>)
        })
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }
}
