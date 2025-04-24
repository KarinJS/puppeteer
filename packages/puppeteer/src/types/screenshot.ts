import type {
  WaitForOptions,
  HTTPRequest,
  ScreenshotOptions as PuppeteerScreenshotOptions,
} from 'puppeteer-core'

/**
 * 截图编码类型
 */
export type Encoding = 'base64' | 'binary'

/**
 * 截图分片类型
 */
export type MultiPage = boolean | number

/**
 * 截图结果数据类型
 */
export type ScreenshotData<T extends Encoding> =
  T extends 'base64' ? string : Uint8Array

/**
 * 截图结果类型
 */
export type ScreenshotResult<T extends Encoding = 'binary', M extends MultiPage = false> =
  M extends false ? ScreenshotData<T> : Array<ScreenshotData<T>>

/**
 * @public
 * 截图参数
 */
export interface ScreenshotOptions extends PuppeteerScreenshotOptions {
  /** http地址、本地文件路径、html字符串 */
  file: string
  /**
   * file类型
   * @default 'auto'
   * @description 如果传递的是URL、HTML绝对路径则无需传递此项
   * - auto: 自动识别、支持URL、HTML绝对路径
   * - htmlString: 传递HTML字符串
   * - vue3: 传递Vue3组件路径
   * - vueString: 传递Vue3组件字符串
   * - react: 传递React组件路径 `(暂未支持)`
   */
  file_type?: 'auto' | 'htmlString' | 'vue3' | 'vueString' | 'react'
  /** 文件名 推荐在传递字符串时使用 */
  file_name?: string
  /** 重试次数 */
  retry?: number
  /**
   * 选择的元素截图
   * fullPage为false时生效
   * 如果未找到指定元素则使用body
   * @default 'body'
   */
  selector?: string
  /**
   * 截图类型
   * @default 'png'
   */
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
  encoding?: Encoding
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
  /**
   * 分页截图
   * - false: 不进行分页截图
   * - true: 进行分页截图 自动计算分页截图的页数
   * - number: 进行分页截图 指定每页高度
   * @default false
   */
  multiPage?: MultiPage
  /** 页面goto时的参数 */
  pageGotoParams?: WaitForOptions
  /** 等待指定元素加载完成 */
  waitForSelector?: string | string[]
  /** 等待特定函数完成 */
  waitForFunction?: string | string[]
  /** 等待特定请求完成 */
  waitForRequest?: string | string[]
  /** 等待特定响应完成 */
  waitForResponse?: string | string[]
  /** 请求拦截 */
  setRequestInterception?: (HTTPRequest: HTTPRequest, data: ScreenshotOptions) => void
}
