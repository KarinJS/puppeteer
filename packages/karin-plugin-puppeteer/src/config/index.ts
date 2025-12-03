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
  retries: 2,
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
 * 获取配置
 */
export const getConfig = (): PuppeteerLaunchOptions => {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  return { ...defaultConfig, ...data }
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
