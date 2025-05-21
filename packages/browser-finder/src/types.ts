/**
 * 浏览器类型常量
 */
export const BrowserType = {
  CHROME: 'chrome',
  CHROMIUM: 'chromium',
  EDGE: 'edge',
  BRAVE: 'brave',
} as const

/**
 * 浏览器类型
 */
export type BrowserTypeValue = typeof BrowserType[keyof typeof BrowserType]

/**
 * 浏览器发布渠道
 */
export const ReleaseChannel = {
  STABLE: 'stable',
  BETA: 'beta',
  DEV: 'dev',
  CANARY: 'canary',
} as const

/**
 * 浏览器发布渠道类型
 */
export type ReleaseChannelValue = typeof ReleaseChannel[keyof typeof ReleaseChannel]

/**
 * 平台类型
 */
export const Platform = {
  WIN32: 'win32',
  WIN64: 'win64',
  MAC: 'darwin',
  MAC_ARM: 'darwin_arm',
  LINUX: 'linux',
  LINUX_ARM: 'linux_arm',
} as const

/**
 * 平台类型值
 */
export type PlatformValue = typeof Platform[keyof typeof Platform]

/**
 * 浏览器来源常量
 * - Default Path: 固定路径
 * - Registry: 注册表
 * - PATH Environment: 环境变量PATH
 * - Puppeteer Cache: Puppeteer缓存
 * - Playwright Cache: Playwright缓存
 */
export const BrowserSource = {
  DEFAULT_PATH: 'Default Path',
  REGISTRY: 'Registry',
  PATH_ENVIRONMENT: 'PATH Environment',
  PUPPETEER_CACHE: 'Puppeteer Cache',
  PLAYWRIGHT_CACHE: 'Playwright Cache',
} as const

/**
 * 浏览器来源类型
 */
export type BrowserSourceValue = typeof BrowserSource[keyof typeof BrowserSource]

/**
 * 浏览器信息接口
 */
export interface BrowserInfo {
  /**
   * 浏览器类型
   */
  type: BrowserTypeValue

  /**
   * 浏览器可执行文件路径
   */
  executablePath: string

  /**
   * 浏览器版本
   */
  version?: string

  /**
   * 浏览器来源
   */
  source: BrowserSourceValue

  /**
   * 发布渠道
   */
  channel: ReleaseChannelValue
}

/**
 * 查找浏览器选项接口
 */
export interface FindBrowserOptions {
  /**
   * 要查找的浏览器类型
   */
  browserType?: BrowserTypeValue

  /**
   * 是否只返回第一个找到的浏览器
   */
  returnFirstMatch?: boolean

  /**
   * 发布渠道
   */
  channel?: ReleaseChannelValue
}
