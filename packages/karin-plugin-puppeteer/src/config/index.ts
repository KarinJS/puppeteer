import type { LaunchOptions } from '@karinjs/puppeteer'

/**
 * 默认配置
 */
export const defaultConfig: LaunchOptions = {
  downloadBrowser: 'chrome',
  debug: false,
  maxPages: 10,
  checkPageInterval: 0,
  checkBrowserMemoryInterval: 0,
  browserMemoryThreshold: 500,
}
