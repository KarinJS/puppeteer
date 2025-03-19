import type { LaunchOptions as LaunchOptionsType } from '@karinjs/puppeteer-core'

/**
 * 浏览器初始化参数
 */
export interface LaunchOptions extends LaunchOptionsType {
  /**
   * 没有浏览器时下载的浏览器类型
   * @default 'chrome'
   * - `chrome` chrome内核的浏览器
   * - `firefox` 火狐浏览器 暂时不支持
   * - `chrome-headless-shell` 纯无头chrome浏览器
   */
  downloadBrowser?: 'chrome' | 'chrome-headless-shell'
  /**
   * debug模式 仅在windows下有效
   * - 在该模式下，浏览器将前台运行，并且打开页面后不会关闭
   * @default false
   */
  debug?: boolean
  /**
   * 最大并发数
   * @default 10
   */
  maxPages?: number
  /**
   * 每隔多少分钟检查一次不活动的标签页
   * @default 0 不检查
   */
  checkPageInterval?: number
  /**
   * 每隔多少分钟检查浏览器的内存
   * @default 0 不检查
   */
  checkBrowserMemoryInterval?: number
  /**
   * 浏览器内存检查的阈值 如果超过了则重启浏览器 单位MB
   * @default 500
   */
  browserMemoryThreshold?: number
}
