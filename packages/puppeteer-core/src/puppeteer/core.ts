import { common } from '@Common'
import { ChildProcess } from 'child_process'
import puppeteer, { Browser, GoToOptions, HTTPRequest, Page, LaunchOptions as PuppeteerLaunchOptions, ScreenshotOptions } from 'puppeteer-core'
import { PagePool } from './pagePool'

// 扩展 LaunchOptions 类型
export interface LaunchOptions extends PuppeteerLaunchOptions {
  /** 页面池最大数量 默认10 */
  maxPages?: number
}

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
  pageGotoParams?: GoToOptions,
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
export type RenderEncoding<T extends screenshot> = T['encoding'] extends 'base64' ? string : Uint8Array
/** 单页或多页截图返回 */
export type RenderResult<T extends screenshot> = T['multiPage'] extends true | number
  ? RenderEncoding<T> extends string ? string[] : Uint8Array[]
  : RenderEncoding<T>

export class Render {
  /** 浏览器id */
  id: number
  /** 浏览器启动配置 */
  config: LaunchOptions
  /** 浏览器实例 */
  browser!: Browser
  /** 截图队列 存放每个任务的唯一标识 */
  list: Map<string, any>
  /** 浏览器进程 */
  process!: ChildProcess | null
  /** 页面实例 */
  // pages: Page[]
  pagePool!: PagePool

  constructor (id: number, config: LaunchOptions) {
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

    // 初始化页面池，传入最大页面数配置
    this.pagePool = new PagePool(this, this.config.maxPages)

    /** 监听浏览器关闭事件 移除浏览器实例 */
    this.browser.on('disconnected', async () => {
      console.error(`[浏览器][${this.id}] 已关闭或崩溃`)
      await this.pagePool.closeAll()
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
      /** 创建页面 */
      page = await this.newPage(data)

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

      /** 如果是png并且有quality则删除quality */
      if (options.quality && data.type === 'png') options.quality = undefined

      /** 整个页面截图 */
      if (data.fullPage) {
        options.captureBeyondViewport = true
        const uint8Array = await page.screenshot(options)
        await this.setViewport(page, data?.setViewport?.width, data?.setViewport?.height, data?.setViewport?.deviceScaleFactor)
        return uint8Array as RenderResult<T>
      }

      /** 获取页面元素 */
      const body = await this.elementHandle(page, data.selector)
      /** 计算页面高度 */
      const box = await body!.boundingBox()

      await this.setViewport(page,
        data?.setViewport?.width || box?.width,
        data?.setViewport?.height || box?.height,
        data?.setViewport?.deviceScaleFactor
      )

      /** 指定元素截图 */
      if (!data.multiPage) {
        /** 截图 */
        const uint8Array = await page.screenshot(options)
        return uint8Array as RenderResult<T>
      }

      /** 分页截图 */
      const list: Array<Uint8Array | string> = []
      const boxWidth = box?.width ?? 1200
      const boxHeight = box?.height ?? 2000

      /** 高度 不传参则为2000 */
      const height = typeof data.multiPage === 'number' ? data.multiPage : (boxHeight >= 2000 ? 2000 : boxHeight)
      /** 分页数量 */
      const count = Math.ceil(boxHeight / height)

      for (let i = 0; i < count; i++) {
        /** 计算截图位置 */
        let y = i * height
        /** 计算截图高度 */
        let clipHeight = Math.min(height, boxHeight - i * height)
        /** 第二页开始y-100 */
        if (i !== 0) {
          y -= 100
          clipHeight += 100
        }

        /** 截图位置 */
        data.clip = { x: 0, y, width: boxWidth, height: clipHeight }
        const uint8Array = await body!.screenshot(data)
        list.push(uint8Array)
      }

      return list as RenderResult<T>
    } catch (error) {
      /** 如果发生错误，从池中移除页面 */
      if (page) {
        await this.pagePool.removePage(page)
        page = undefined
      }
      throw error
    } finally {
      /** 从队列中去除 */
      this.list.delete(echo)
      if (page) {
        common.emit('screenshot', this.id)
        // 不再直接关闭页面，而是将其释放回池中
        await this.pagePool.releasePage(page)
      }
    }
  }

  /**
   * 初始化页面
   * @param data 截图参数
   */
  async newPage (data: screenshot) {
    let page: Page

    if (typeof data.setRequestInterception === 'function') {
      page = await this.pagePool.createPage()

      /** 设置HTTP 标头 */
      if (data.headers) await page.setExtraHTTPHeaders(data.headers)
      await page.setRequestInterception(true)
      page.on('request', (req) => data.setRequestInterception!(req, data))
    } else {
      page = await this.pagePool.acquirePage()
      /** 设置HTTP 标头 */
      if (data.headers) await page.setExtraHTTPHeaders(data.headers)
    }

    /** 打开页面数+1 */
    common.emit('newPage', this.id)

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
}
