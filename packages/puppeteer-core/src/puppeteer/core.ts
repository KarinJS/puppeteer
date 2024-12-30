import { common } from '@Common'
import puppeteer from 'puppeteer-core'
import type { ChildProcess } from 'child_process'
import type { RunConfig } from '.'
import type {
  Browser,
  WaitForOptions,
  HTTPRequest,
  Page,
  ScreenshotOptions,
  ElementHandle,
  BoundingBox
} from 'puppeteer-core'

export interface screenshot extends ScreenshotOptions {
  /** http地址、本地文件路径、html字符串 */
  file: string
  /**
 * 选择的元素截图
 * fullPage为false时生效
 * 如果未找到指定元素则使用body
 * @default 'body'
 */
  selector?: string
  /** 截图类型 默认'jpeg' */
  type?: 'png' | 'jpeg' | 'webp'
  /**
   * 截图质量 默认90
   * @default 90
   */
  quality?: number
  /**
   * - 额外的 HTTP 头信息将随页面发起的每个请求一起发送
   * - 标头值必须是字符串
   * - 所有 HTTP 标头名称均小写。(HTTP 标头不区分大小写，因此这不会影响服务器代码）。
   */
  headers?: Record<string, string>
  /**
   * 截图整个页面
   * @default false
   */
  fullPage?: boolean
  /**
   * 控制截图的优化速度
   * @default false
   */
  optimizeForSpeed?: boolean
  /**
   * 截图后的图片编码
   * @default 'binary'
   */
  encoding?: 'base64' | 'binary'
  /** 保存图片的文件路径 */
  path?: string
  /**
   * 是否隐藏背景
   * @default false
   */
  omitBackground?: boolean
  /**
   * 捕获视口之外的屏幕截图
   * @default false
   */
  captureBeyondViewport?: boolean
  /** 设置视窗大小和设备像素比 */
  setViewport?: {
    /** 视窗宽度 */
    width?: number
    /** 视窗高度 */
    height?: number
    /**
     * 设备像素比
     * @default 1
     */
    deviceScaleFactor?: number
  }
  /** 分页截图 传递数字则视为视窗高度 返回数组 */
  multiPage?: number | boolean
  /** 页面goto时的参数 */
  pageGotoParams?: WaitForOptions,
  /** 等待指定元素加载完成 */
  waitForSelector?: string | string[]
  /** 等待特定函数完成 */
  waitForFunction?: string | string[]
  /** 等待特定请求完成 */
  waitForRequest?: string | string[]
  /** 等待特定响应完成 */
  waitForResponse?: string | string[]
  /** 请求拦截 */
  setRequestInterception?: (HTTPRequest: HTTPRequest, data: screenshot) => void
}

/** 截图返回 */
export type RenderEncoding<T extends screenshot> = T['encoding'] extends 'base64' ? string : Buffer
/** 单页或多页截图返回 */
export type RenderResult<T extends screenshot> = T['multiPage'] extends true | number
  ? RenderEncoding<T> extends string ? string[] : Buffer[]
  : RenderEncoding<T>

export class Render {
  /** 浏览器id */
  id: number
  /** 浏览器启动配置 */
  config: RunConfig
  /** 浏览器实例 */
  browser!: Browser
  /** 截图队列 存放每个任务的唯一标识 */
  list: Map<string, any>
  /** 浏览器进程 */
  process!: ChildProcess | null
  constructor (id: number, config: RunConfig) {
    this.id = id
    this.config = config
    this.list = new Map()
    // this.pages = []
  }

  /**
   * 初始化启动浏览器
   */
  async init () {
    /** 启动浏览器 */
    this.browser = await puppeteer.launch(this.config)
    /** 浏览器id */
    this.process = this.browser.process()

    /** 监听浏览器关闭事件 移除浏览器实例 */
    this.browser.on('disconnected', async () => {
      console.error(`[浏览器][${this.id}] 已关闭或崩溃`)

      /** 传递一个浏览器崩溃事件出去 用于在浏览器池子中移除掉当前浏览器 */
      common.emit('browserCrash', this.id)
      /** 尝试关闭 */
      if (this.browser) {
        await this.browser?.close().catch(() => { })
      }
      /** 如果pid存在 再使用node自带的kill杀一次 */
      if (this.process?.pid) {
        process.kill(this.process.pid)
      }
    })
  }

  /**
   * 截图
   * @param echo 唯一标识
   * @param data 截图参数
   * @returns 截图结果
   */
  async render<T extends screenshot> (echo: string, data: T): Promise<RenderResult<T>> {
    let page: Page | undefined
    try {
      this.list.set(echo, true)
      page = await this.page(data)

      const options = this.getScreenshotOptions(data)
      const timeout = Number(data?.pageGotoParams?.timeout) || 20000

      /** 处理全页面截图 */
      if (data.fullPage) {
        return await this.handleFullPageScreenshot(page, data, options, timeout)
      }

      /** 获取目标元素和尺寸 */
      const body = await this.elementHandle(page, data.selector)
      const box = await body!.boundingBox()

      /** 设置视窗 */
      await this.setViewport(
        page,
        data?.setViewport?.width || box?.width,
        data?.setViewport?.height || box?.height,
        data?.setViewport?.deviceScaleFactor
      )

      /** 处理单元素或分页截图 */
      return data.multiPage
        ? await this.handleMultiPageScreenshot(body!, data, box, timeout)
        : await this.handleSingleElementScreenshot(body!, options, timeout)

    } finally {
      this.cleanupPage(page, echo)
    }
  }

  /**
   * 截图
   * @param page 页面实例
   * @param options 截图参数
   * @returns 截图结果
   */
  screenshot (
    page: Page | ElementHandle<Element>,
    options: Readonly<ScreenshotOptions>,
    timeout: number
  ): ReturnType<Page['screenshot']> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(JSON.stringify({
          message: `TimeoutError: Navigation Timeout Exceeded: ${timeout}ms exceeded`,
          options
        }, null, 2)))
      }, timeout)

      page.screenshot(options)
        .then((data) => {
          clearTimeout(timer)
          resolve(data)
        })
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }

  /**
   * 初始化页面
   * @param data 截图参数
   */
  async page (data: screenshot) {
    /** 创建页面 */
    const page = await this.browser.newPage()
    /** 打开页面数+1 */
    common.emit('newPage', this.id)

    /** 设置HTTP 标头 */
    if (data.headers) await page.setExtraHTTPHeaders(data.headers)
    if (typeof data.setRequestInterception === 'function') {
      await page.setRequestInterception(true)
      page.on('request', (req) => data.setRequestInterception!(req, data))
    }

    /** 打开页面 */
    if (data.file.startsWith('http') || data.file.startsWith('file://')) {
      await page.goto(data.file, data.pageGotoParams)
    } else {
      await page.setContent(data.file, data.pageGotoParams)
    }

    /** 等待body加载完成 */
    await page.waitForSelector('body')

    /** 等待指定元素加载完成 */
    if (data.waitForSelector) {
      if (!Array.isArray(data.waitForSelector)) data.waitForSelector = [data.waitForSelector]
      for (const selector of data.waitForSelector) {
        await page.waitForSelector(selector).catch(() => { })
      }
    }

    /** 等待特定函数完成 */
    if (data.waitForFunction) {
      if (!Array.isArray(data.waitForFunction)) data.waitForFunction = [data.waitForFunction]
      for (const func of data.waitForFunction) {
        await page.waitForFunction(func).catch(() => { })
      }
    }

    /** 等待特定请求完成 */
    if (data.waitForRequest) {
      if (!Array.isArray(data.waitForRequest)) data.waitForRequest = [data.waitForRequest]
      for (const req of data.waitForRequest) {
        await page.waitForRequest(req).catch(() => { })
      }
    }

    /** 等待特定响应完成 */
    if (data.waitForResponse) {
      if (!Array.isArray(data.waitForResponse)) data.waitForResponse = [data.waitForResponse]
      for (const res of data.waitForResponse) {
        await page.waitForResponse(res).catch(() => { })
      }
    }

    return page
  }

  /**
   * 获取页面元素
   * @param page 页面实例
   * @param name 元素名称
   */
  async elementHandle (page: Page, name?: string) {
    try {
      if (name) {
        const element = await page.$(name) || await page.$('#container') || await page.$('body')
        return element
      }
      const element = await page.$('#container') || await page.$('body')
      return element
    } catch (err) {
      return await page.$('#container') || await page.$('body')
    }
  }

  /**
   * 设置视窗大小
   * @param page 页面实例
   * @param width 视窗宽度
   * @param height 视窗高度
   */
  async setViewport (page: Page, width?: number, height?: number, deviceScaleFactor?: number) {
    if (!width && !height && !deviceScaleFactor) return
    const setViewport = {
      width: Math.round(width || 1920),
      height: Math.round(height || 1080),
      deviceScaleFactor: Math.round(deviceScaleFactor || 1),
    }
    await page.setViewport(setViewport)
  }

  /**
   * 实验性功能
   * @param page 页面实例
   * @param data 截图参数
   * @description 通过捕获请求和响应来模拟0毫秒的waitUntil
   */
  async simulateWaitUntil (page: Page, data: screenshot) {
    if (!data.pageGotoParams) data.pageGotoParams = {}
    data.pageGotoParams.waitUntil = 'load'

    const list: Record<string, number> = {}

    const delCount = (url: string) => {
      if (list[url]) list[url]--
      if (list[url] <= 0) delete list[url]
      if (Object.keys(list).length <= 0) common.emit('end', true)
    }

    page.on('request', (req) => {
      const url = req.url()
      if (typeof list[url] !== 'number') {
        list[url] = 0
        return
      }

      list[url]++
      req.continue()
    })

    page.on('response', request => delCount(request.url()))
    page.on('requestfailed', request => delCount(request.url()))
    page.on('requestfinished', request => delCount(request.url()))

    /** 加载页面 */
    let result
    if (data.file.startsWith('http') || data.file.startsWith('file://')) {
      result = page.goto(data.file, data.pageGotoParams)
    } else {
      result = page.setContent(data.file, data.pageGotoParams)
    }

    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(true)
        common.emit('end', false)
      }, 10000)

      common.once('end', (bool) => {
        if (bool) clearTimeout(timer)
        resolve(true)
      })
    })

    await result
  }

  /**
   * 截图选项
   * @paaam data 截图参数
   */
  private getScreenshotOptions (data: screenshot) {
    const options = {
      path: data.path,
      type: data.type || 'jpeg',
      quality: data.quality || 90 as number | undefined,
      fullPage: data.fullPage || false,
      optimizeForSpeed: data.optimizeForSpeed || false,
      encoding: data.encoding || 'binary',
      omitBackground: data.omitBackground || false,
      captureBeyondViewport: data.captureBeyondViewport || false,
    }

    /** PNG格式不支持quality选项 */
    if (options.quality && data.type === 'png') {
      options.quality = undefined
    }

    return options
  }

  /**
   * 处理全页面截图
   * @param page 页面实例
   * @param data 截图参数
   * @param options 截图选项
   * @param timeout 超时时间
   */
  private async handleFullPageScreenshot<T extends screenshot> (
    page: Page,
    data: T,
    options: ScreenshotOptions,
    timeout: number
  ): Promise<RenderResult<T>> {
    options.captureBeyondViewport = true
    const uint8Array = await this.screenshot(page, options, timeout)
    await this.setViewport(
      page,
      data?.setViewport?.width,
      data?.setViewport?.height,
      data?.setViewport?.deviceScaleFactor
    )
    return uint8Array as RenderResult<T>
  }

  /**
   * 处理单截图
   * @param body 页面实例
   * @param options 截图选项
   * @param timeout 超时时间
   */
  private async handleSingleElementScreenshot<T extends screenshot> (
    body: ElementHandle<Element>,
    options: ScreenshotOptions,
    timeout: number
  ): Promise<RenderResult<T>> {
    const uint8Array = await this.screenshot(body, options, timeout)
    return uint8Array as RenderResult<T>
  }

  /**
   * 处理分页截图
   * @param body 页面实例
   * @param data 截图参数
   * @param box 盒子尺寸
   * @param timeout 超时时间
   */
  private async handleMultiPageScreenshot<T extends screenshot> (
    body: ElementHandle<Element>,
    data: T,
    box: BoundingBox | null,
    timeout: number
  ): Promise<RenderResult<T>> {
    const list: Array<Uint8Array | string> = []
    const boxWidth = box?.width ?? 1200
    const boxHeight = box?.height ?? 2000
    const height = typeof data.multiPage === 'number'
      ? data.multiPage
      : (boxHeight >= 2000 ? 2000 : boxHeight)
    const count = Math.ceil(boxHeight / height)

    for (let i = 0; i < count; i++) {
      const { y, clipHeight } = this.calculatePageDimensions(i, height, boxHeight)
      data.clip = { x: 0, y, width: boxWidth, height: clipHeight }
      const uint8Array = await this.screenshot(body, data, timeout)
      list.push(uint8Array)
    }

    return list as RenderResult<T>
  }

  /**
   * 计算页面尺寸
   * @param pageIndex 页面索引
   * @param pageHeight 页面高度
   * @param totalHeight 总高度
   */
  private calculatePageDimensions (pageIndex: number, pageHeight: number, totalHeight: number) {
    let y = pageIndex * pageHeight
    let clipHeight = Math.min(pageHeight, totalHeight - pageIndex * pageHeight)

    if (pageIndex !== 0) {
      y -= 100
      clipHeight += 100
    }

    return { y, clipHeight }
  }

  /**
   * 清理页面
   * @param page 页面实例
   * @param echo 唯一标识
   */
  private async cleanupPage (page: Page | undefined, echo: string) {
    this.list.delete(echo)
    if (page) {
      common.emit('screenshot', this.id)
      if (!this.config.debug) {
        await page.close()
        if (!page.isClosed()) {
          await page.close().catch((error) => process.emit('uncaughtException', error))
        }
      }
    }
  }
}