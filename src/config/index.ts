import fs from 'node:fs'
import path from 'node:path'
import { karin } from 'node-karin'
import pkg from '../../package.json'
import { basePath } from 'node-karin/root'
import type { PuppeteerLaunchOptions } from '@snapka/puppeteer'

/**
 * 热更新key
 */
export const HMR_KEY = 'karin-plugin-puppeteer-hmr'

/**
 * 环境变量名称：Chrome 版本解析镜像地址
 * 设置后将直接使用该镜像，不走探针
 * @example PUPPETEER_CHROME_MIRROR=https://mirror.karinjs.com
 */
export const ENV_CHROME_MIRROR = 'PUPPETEER_CHROME_MIRROR'

/**
 * 环境变量名称：自定义下载源 URL
 * @example PUPPETEER_DOWNLOAD_BASE_URL=https://registry.npmmirror.com/-/binary/chrome-for-testing
 */
export const ENV_DOWNLOAD_BASE_URL = 'PUPPETEER_DOWNLOAD_BASE_URL'

/**
 * 版本解析 API 列表（用于探针竞速）
 * 镜像在前，官方在后，探针会选择最快响应的
 */
export const VERSION_API_URLS = [
  'https://mirror.karinjs.com',
  'https://googlechromelabs.github.io',
]

/**
 * 默认配置
 */
const defaultConfig: PuppeteerLaunchOptions = {
  protocol: 'cdp',
  headless: 'shell',
  debug: false,
  findBrowser: true,
  slowMo: 0,
  maxOpenPages: 10,
  pageMode: 'reuse',
  pageIdleTimeout: 60000,
  defaultViewport: {
    width: 800,
    height: 600
  },
  download: {
    enable: true,
    browser: 'chrome-headless-shell',
    version: 'latest'
  },
  args: [
    '--window-size=800,600', // 设置窗口大小
    '--disable-gpu', // 禁用 GPU 硬件加速
    '--no-sandbox', // 关闭 Chrome 的沙盒模式
    '--disable-setuid-sandbox', // 进一步禁用 setuid 沙盒机制，通常和 --no-sandbox 配合使用，避免权限问题
    '--no-zygote', // 关闭 Chrome 的 zygote 进程，减少进程开销，优化资源使用
    '--disable-extensions', // 禁用扩展
    '--disable-dev-shm-usage', // 禁用 /dev/shm（共享内存）用作临时存储，改用磁盘存储
    '--disable-background-networking', // 禁用后台网络请求
    '--disable-sync', // 禁用 Chrome 的同步功能
    '--disable-crash-reporter', // 禁用崩溃报告
    '--disable-translate', // 禁用翻译
    '--disable-notifications', // 禁用通知
    '--disable-device-discovery-notifications', // 禁用设备发现通知
    '--disable-accelerated-2d-canvas', // 禁用 2D 画布的硬件加速
  ]
}

/** 插件名称 */
export const pluginName = pkg.name.replace(/\//g, '-')
/** 插件版本 */
export const pluginVersion = pkg.version
/** 配置文件路径 */
export const configPath = path.resolve(basePath, pluginName, 'config', 'config.json')

/**
 * 初始化配置
 */
const init = () => {
  /** 判断文件是否存在 不存在则创建 */
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }
}

/**
 * 获取配置（合并默认配置、配置文件和环境变量）
 * 环境变量优先级最高
 */
export const getConfig = (): PuppeteerLaunchOptions => {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const config = { ...defaultConfig, ...data }

  const envBaseUrl = process.env[ENV_DOWNLOAD_BASE_URL]
  if (envBaseUrl) {
    config.download = { ...(config.download ?? {}), baseUrl: envBaseUrl }
  }

  return config
}

/**
 * 版本通道名称到 JSON 字段的映射
 */
const channelMap: Record<string, string> = {
  latest: 'Canary',
  stable: 'Stable',
  beta: 'Beta',
  dev: 'Dev',
  canary: 'Canary',
}

/**
 * 从指定 URL 解析浏览器版本号
 *
 * @param version 版本通道名称（如 latest、stable）或具体版本号
 * @param baseUrl 版本 API 地址（如 https://mirror.karinjs.com）
 * @returns 解析后的具体版本号，解析失败则抛出错误
 */
export const resolveVersionFromMirror = async (version: string, baseUrl: string): Promise<string> => {
  const channel = channelMap[version]
  if (!channel) return version

  const url = `${baseUrl.replace(/\/+$/, '')}/chrome-for-testing/last-known-good-versions.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch version info from mirror: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as { channels: Record<string, { version: string }> }
  const info = data.channels[channel]
  if (!info?.version) {
    throw new Error(`Channel "${channel}" not found in mirror response`)
  }
  return info.version
}

/**
 * 解析浏览器版本号
 * - 设置了 PUPPETEER_CHROME_MIRROR 环境变量时，直接使用该镜像，不走探针
 * - 未设置环境变量时，使用探针竞速多个 API，选择最快响应的
 *
 * @param version 版本通道名称（如 latest、stable）或具体版本号
 * @returns 解析后的具体版本号
 */
export const resolveVersion = async (version: string): Promise<string> => {
  const channel = channelMap[version]
  if (!channel) return version

  const envMirror = process.env[ENV_CHROME_MIRROR]
  if (envMirror) {
    return resolveVersionFromMirror(version, envMirror)
  }

  const urls = VERSION_API_URLS
  const staggerDelay = 300

  const probePromises = urls.map(async (baseUrl, index) => {
    if (index > 0) await new Promise(resolve => setTimeout(resolve, staggerDelay * index))
    return resolveVersionFromMirror(version, baseUrl)
  })

  try {
    return await Promise.any(probePromises)
  } catch {
    throw new Error(`所有版本解析 API 均不可用: ${urls.join(', ')}`)
  }
}

/**
 * 保存配置
 * @param config 配置
 */
export const saveConfig = (config: PuppeteerLaunchOptions) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  karin.emit(HMR_KEY, config)
}

export { pkg }

init()
