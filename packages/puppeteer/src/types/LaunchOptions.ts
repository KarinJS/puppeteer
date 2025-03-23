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
   * 网络请求空闲时间
   * @default 10
   */
  idleTime?: number
  /**
   * 触发配置热更新是否重载浏览器
   * @description 需要注意，会强制关闭所有正在进行中的截图任务
   * @default false
   */
  hmr?: boolean
}
