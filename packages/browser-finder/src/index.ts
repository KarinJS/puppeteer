import { BrowserInfo, BrowserType, BrowserTypeValue, FindBrowserOptions, ReleaseChannelValue } from './types'
import { findChrome } from './browsers/chrome'
import { findEdge } from './browsers/edge'
import { findBrave } from './browsers/brave'

/**
 * 比较版本号，用于排序
 * @param a 版本号A
 * @param b 版本号B
 * @returns 比较结果，新版本排在前面
 */
export function compareVersions (a?: string, b?: string): number {
  // 如果版本号不存在，排在后面
  if (!a) return 1
  if (!b) return -1
  if (a === b) return 0

  // 分割版本号为数字数组
  const aParts = a.split('.').map(Number)
  const bParts = b.split('.').map(Number)

  // 比较每个部分
  const maxLength = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || 0
    const bPart = bParts[i] || 0

    if (aPart > bPart) return -1 // a更新，排在前面
    if (aPart < bPart) return 1  // b更新，排在前面
  }

  return 0
}

/**
 * 查找系统中安装的所有浏览器
 * @param options 查找选项
 * @returns 浏览器信息数组
 */
export function findInstalledBrowsers (options: FindBrowserOptions = {}): BrowserInfo[] {
  const { browserType, returnFirstMatch = false, channel } = options
  const results: BrowserInfo[] = []

  // 如果指定了浏览器类型，只查找该类型的浏览器
  const browserTypes = browserType ? [browserType] : [BrowserType.CHROME, BrowserType.CHROMIUM, BrowserType.EDGE, BrowserType.BRAVE]

  for (const type of browserTypes) {
    let browsers: BrowserInfo[] = []

    switch (type) {
      case BrowserType.CHROME:
      case BrowserType.CHROMIUM:
        browsers = findChrome()
        break
      case BrowserType.EDGE:
        browsers = findEdge()
        break
      case BrowserType.BRAVE:
        browsers = findBrave()
        break
      default:
        continue
    }

    // 如果指定了渠道，只返回该渠道的浏览器
    const filteredBrowsers = channel
      ? browsers.filter(browser => browser.channel === channel)
      : browsers

    results.push(...filteredBrowsers)

    if (returnFirstMatch && results.length > 0) {
      // 按版本号排序后返回最新版本
      results.sort((a, b) => compareVersions(a.version, b.version))
      return results
    }
  }

  // 按版本号排序
  results.sort((a, b) => compareVersions(a.version, b.version))
  return results
}

/**
 * 查找指定类型的浏览器
 * @param browserType 浏览器类型
 * @param channel 发布渠道
 * @returns 浏览器信息或undefined
 */
export function findBrowser (browserType: BrowserTypeValue, channel?: ReleaseChannelValue): BrowserInfo | undefined {
  // returnFirstMatch设为true，结果已经按版本排序
  const browsers = findInstalledBrowsers({ browserType, returnFirstMatch: true, channel })
  return browsers.length > 0 ? browsers[0] : undefined
}

/**
 * 查找默认浏览器（按优先级：Chrome > Edge > Brave）
 * @returns 浏览器信息或undefined
 */
export function findDefaultBrowser (): BrowserInfo | undefined {
  // 按优先级查找
  const priorityOrder = [
    BrowserType.CHROME,
    BrowserType.EDGE,
    BrowserType.BRAVE,
  ]

  for (const browserType of priorityOrder) {
    const browser = findBrowser(browserType)
    if (browser) return browser
  }

  return undefined
}

export { BrowserType, ReleaseChannel, BrowserSource } from './types'
export { getCurrentPlatform } from './utils/platform'
export { isExecutable, getBrowserVersion } from './utils/file'
export { findChrome } from './browsers/chrome'
export { findEdge } from './browsers/edge'
export { findBrave } from './browsers/brave'
export type { BrowserTypeValue, BrowserInfo, FindBrowserOptions, BrowserSourceValue, ReleaseChannelValue } from './types'
