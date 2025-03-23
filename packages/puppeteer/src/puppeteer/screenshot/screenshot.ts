import { debug } from '../../common'
import { withPage } from '../browser'
import { getTimeout } from '../page/timeout'
import { setViewport } from '../page/setViewport'
import { executeTask, PuppeteerContext } from '../utils'
import { getScreenshotOptions } from '../page/screenshotOptions'

import type {
  BoundingBox,
  ElementHandle,
  Page,
  ScreenshotOptions as PuppeteerScreenshotOptions
} from '@karinjs/puppeteer-core'
import type {
  Encoding,
  MultiPage,
  ScreenshotOptions,
  ScreenshotResult,
  TaskResult
} from '../../types'

/**
 * 查找目标元素
 * @param page - 页面实例
 * @param selector - 选择器
 * @returns 目标元素
 */
export const findTargetElement = async (
  page: Page,
  selector?: string
): Promise<ElementHandle<Element>> => {
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
 * 计算分页截图的页面尺寸
 * @param pageIndex - 页面索引
 * @param pageHeight - 页面高度
 * @param totalHeight - 总高度
 * @returns 页面尺寸
 */
export const calculatePageDimensions = (
  pageIndex: number,
  pageHeight: number,
  totalHeight: number
): { y: number, height: number } => {
  let y = pageIndex * pageHeight
  let height = Math.min(pageHeight, totalHeight - pageIndex * pageHeight)

  if (pageIndex !== 0) {
    y -= 100
    height += 100
  }

  return { y, height }
}

/**
 * 实际截图操作
 * @param target - 目标实例
 * @param options - 截图参数
 * @param timeout - 超时时间
 * @returns 截图结果
 */
export const takeScreenshot = async <T extends Encoding, M extends MultiPage> (
  target: Page | ElementHandle<Element>,
  options: PuppeteerScreenshotOptions,
  timeout: number
): Promise<ScreenshotResult<T, M>> => {
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

/**
 * 处理分页截图
 * @param page - 页面实例
 * @param element - 目标元素
 * @param options - 截图参数
 * @param box - 目标元素的边界框
 * @param timeout - 超时时间
 * @returns 截图结果
 */
export const takeMultiPageScreenshot = async <T extends Encoding, M extends MultiPage> (
  page: Page,
  element: ElementHandle<Element>,
  options: ScreenshotOptions,
  box: BoundingBox | null,
  timeout: number
): Promise<ScreenshotResult<T, M>> => {
  const results: any[] = []
  const boxWidth = box?.width ?? 1200
  const boxHeight = box?.height ?? 2000

  const pageHeight = typeof options.multiPage === 'number'
    ? options.multiPage
    : boxHeight >= 2000 ? 2000 : boxHeight

  const totalPages = Math.ceil(boxHeight / pageHeight)

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const { y, height } = calculatePageDimensions(pageIndex, pageHeight, boxHeight)

    const clipOptions = {
      ...getScreenshotOptions(options),
      clip: { x: 0, y, width: boxWidth, height }
    }

    const screenshot = await takeScreenshot<T, false>(element, clipOptions, timeout)
    results.push(screenshot)
  }

  return results as unknown as ScreenshotResult<T, M>
}

/**
 * 主截图函数
 * @param ctx - 上下文实例
 * @param options - 截图参数
 * @returns 截图结果
 */
export const screenshot = async <T extends Encoding = 'binary', M extends MultiPage = false> (
  ctx: PuppeteerContext,
  options: ScreenshotOptions & { encoding?: T, multiPage?: M }
): Promise<TaskResult<ScreenshotResult<T, M>>> => {
  const retryCount = options.retry ?? 1

  const task = async (): Promise<ScreenshotResult<T, M>> => {
    const timeout = getTimeout(options?.pageGotoParams?.timeout)

    return withPage(ctx, options, timeout, async (page) => {
      const screenshotOptions = getScreenshotOptions(options)

      /** 处理全页面截图 */
      if (screenshotOptions.fullPage) {
        screenshotOptions.captureBeyondViewport = true
        return await takeScreenshot<T, M>(page, screenshotOptions, timeout)
      }

      /** 获取目标元素 */
      const element = await findTargetElement(page, options.selector)
      const box = await element.boundingBox()

      /** 设置视窗 */
      await setViewport(
        page,
        options?.setViewport?.width || box?.width,
        options?.setViewport?.height || box?.height,
        options?.setViewport?.deviceScaleFactor
      )

      /** 分页截图处理 */
      if (options.multiPage) {
        return await takeMultiPageScreenshot<T, M>(page, element, options, box, timeout)
      }

      /** 单页截图 */
      return await takeScreenshot<T, M>(element, screenshotOptions, timeout)
    })
  }

  /** 执行任务 */
  const result = await executeTask<ScreenshotResult<T, M>>(ctx, task)

  /** 处理重试逻辑 */
  if (!result.status && retryCount > 0) {
    return screenshot(ctx, { ...options, retry: retryCount - 1 })
  }

  return result
}
