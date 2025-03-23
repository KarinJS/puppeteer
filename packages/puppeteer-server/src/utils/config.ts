import fs from 'fs'
import path from 'path'
import pkg from '../../package.json'
import { configFile, countFile } from './dir'
import { createQueueManager } from './queueManager'
import { hmrConfig } from '../puppeteer'
import { diffArray } from '../server/utils/number'
import { closeWebSocket, addWebSocket } from '../client/map'

import type { Level } from 'log4js'
import type { Config, CountConfig } from '../types/config'

/**
 * 默认配置文件
 */
export const defaultConfig: Config = {
  browser: {
    downloadBrowser: 'chrome',
    debug: false,
    maxPages: 15,
    idleTime: 10,
    hmr: false,
    args: [
      '--enable-gpu', // 启用 GPU 硬件加速
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
    ],
    executablePath: '',
    headless: true,
    defaultViewport: {
      width: 800,
      height: 600
    },
    protocol: 'cdp'
  },
  http: {
    host: '0.0.0.0',
    port: 7775,
    token: 'puppeteer',
    limit: '50mb',
    upload: 50 * 1024 * 1024,
    screenshot: true
  },
  ws_server: {
    enable: true,
    path: '/',
    token: '',
    timeout: 30 * 1000
  },
  ws_client: [
    {
      enable: false,
      url: 'ws://127.0.0.1:7777/render',
      heartbeatTime: 30 * 1000,
      reconnectionTime: 5 * 1000,
      authorization: ''
    }
  ],
  logger: {
    level: 'info'
  },
  env: {
    NO_PROXY: null,
    HTTPS_PROXY: null,
    PUPPETEER_CACHE_DIR: null,
    PUPPETEER_CACHE_VERSION: null,
    PUPPETEER_CHROME_HEADLESS_SHELL_VERSION: null,
    PUPPETEER_EXECUTABLE_PATH: null,
    PUPPETEER_CHROME_HEADLESS_SHELL_DOWNLOAD_BASE_URL: null
  }
}

/**
 * 默认调用次数配置文件
 */
export const defaultCountConfig: CountConfig = {
  count: 0,
  start: 0,
  video: 0,
  ws_client: 0,
  ws_server: 0,
  http: 0,
  upload: 0
}

let cfg: Config | null = null

/**
 * 获取配置文件
 * @returns 配置文件
 */
export const getConfig = (): Config => {
  if (cfg) return cfg

  if (!fs.existsSync(configFile)) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true })
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2))
    cfg = defaultConfig
    return defaultConfig
  }

  cfg = JSON.parse(fs.readFileSync(configFile, 'utf-8')) as Config
  return cfg
}

/**
 * 清空配置文件缓存
 */
export const clearConfigCache = () => {
  cfg = null
}

/**
 * 更新配置文件
 * @param config 配置文件
 */
export const updateConfig = (
  oldCfg: Config,
  config: Config
) => {
  clearConfigCache()
  if (oldCfg.logger?.level !== config.logger?.level) {
    logger.level = config.logger?.level as Level | string
  }

  hmrConfig(config.browser)

  const { removed, added } = diffArray(oldCfg.ws_client, config.ws_client)

  removed.forEach((item) => {
    closeWebSocket(item.url)
  })

  added.forEach((item) => {
    addWebSocket(item)
  })

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
}

/**
 * 初始化环境变量
 * @param config 配置文件
 */
export const initEnv = (config: Config) => {
  Object.entries(config.env || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      process.env[key] = value
    }
  })
}

/**
 * 获取调用次数配置文件
 * @returns 调用次数配置文件
 */
export const getCountConfig = (): CountConfig => {
  if (!fs.existsSync(countFile)) {
    fs.mkdirSync(path.dirname(countFile), { recursive: true })
    fs.writeFileSync(countFile, JSON.stringify(defaultCountConfig, null, 2))
    return defaultCountConfig
  }

  return JSON.parse(fs.readFileSync(countFile, 'utf-8')) as CountConfig
}

/**
 * 调用次数配置队列管理器
 */
const countConfigQueueManager = createQueueManager<CountConfig, Partial<CountConfig>>({
  getData: getCountConfig,
  saveData: (data) => {
    fs.writeFileSync(countFile, JSON.stringify(data, null, 2))
  },
  processItem: (data, item) => {
    Object.assign(data, item)
    return true
  }
})

/**
 * 更新调用次数配置文件
 * @param config 调用次数配置文件
 */
export const updateCountConfig = (config: Partial<CountConfig>): Promise<void> => {
  return countConfigQueueManager.add(config)
}

export { pkg }
