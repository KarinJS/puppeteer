import fs from 'node:fs'
import yocto from 'yocto-spinner'
import { downloadBrowser } from '../../init'
import { spinnerValue } from '../../common/frames'
import { puppeteerCache, isWindows, platform, createLog, ping, NPMMIRROR, GOOGLE } from '../../common'

import type { LaunchOptions } from '../../types/LaunchOptions'

/**
 * @internal
 * 浏览器初始化参数
 */
export const browserOptions = async (options: LaunchOptions): Promise<LaunchOptions> => {
  const time = Date.now()
  /**
   * 优先级: debug > downloadBrowser > headless
   */
  const headless = () => {
    if (isWindows && options.debug) return false
    if (options.downloadBrowser === 'chrome-headless-shell') return true
    return options.headless ?? true
  }

  /**
   * 获取浏览器启动参数
   */
  const args = () => {
    if (Array.isArray(options.args)) return options.args
    return [
      '--window-size=800,600',
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

  /**
   * 获取浏览器下载地址
   */
  const host = async () => {
    if (process.env.PUPPETEER_CHROME_HEADLESS_SHELL_DOWNLOAD_BASE_URL) {
      return process.env.PUPPETEER_CHROME_HEADLESS_SHELL_DOWNLOAD_BASE_URL
    }

    const url = await ping([NPMMIRROR, GOOGLE])
    return url
  }

  /**
   * 更新已安装浏览器的版本信息到version.json
   * @param execPath - 可执行文件路径
   */
  const updateBrowserVersionInfo = async (execPath: string): Promise<void> => {
    if (options.executablePath) return
    const browser = options.downloadBrowser || 'chrome'
    const cachePath = puppeteerCache.path(browser, platform())

    if (execPath.includes(puppeteerCache.dir)) {
      puppeteerCache.updateBrowserInfo(cachePath.unzipDir, process.cwd())
    }
  }

  /**
   * 获取浏览器可执行文件路径
   */
  const executablePath = async () => {
    if (options.browserWSEndpoint) {
      return undefined
    }

    /** 如果用户配置了可执行文件路径 */
    if (options.executablePath) {
      if (!fs.existsSync(options.executablePath)) {
        throw new Error(createLog('浏览器二进制文件不存在: 请检查 executablePath 并重新配置'))
      }

      return options.executablePath
    }

    const browser = options.downloadBrowser || 'chrome'

    /** 如果缓存存在 则直接返回 */
    const cache = puppeteerCache.path(browser, platform())
    if (fs.existsSync(cache.executablePath)) {
      await updateBrowserVersionInfo(cache.executablePath)
      return cache.executablePath
    }

    /** 如果缓存没有 则进行初始化 */
    await downloadBrowser(
      browser,
      cache.version,
      platform(),
      await host(),
      cache.archiveFile,
      cache.unzipDir,
      cache.debianDepsPath,
      options.silentDownload
    )

    await updateBrowserVersionInfo(cache.executablePath)
    return cache.executablePath
  }

  /**
   * 获取网络请求空闲时间
   */
  const idleTime = () => {
    if (typeof options.idleTime === 'number') return options.idleTime
    const time = Number(options.idleTime)
    if (isNaN(time)) return 10
    return time
  }

  /**
   * 获取最大并发数
   */
  const maxPages = () => {
    if (typeof options.maxPages === 'number') return options.maxPages
    const pages = Number(options.maxPages)
    if (isNaN(pages)) return 10
    return pages
  }

  /**
   * 赋予可执行文件执行权限
   */
  const chmod = (executablePath: string) => {
    try {
      fs.chmodSync(executablePath, 0o755)
    } catch { }
  }

  const data: LaunchOptions = {
    ...options,
    idleTime: idleTime(),
    headless: headless(),
    browser: 'chrome', // 暂时只支持chrome
    maxPages: maxPages(),
    args: args(),
    executablePath: await executablePath(),
  }

  const spinner = yocto({
    text: '初始化chrome...',
    color: 'yellow',
    spinner: spinnerValue,
  }).start()

  /**
   * 检查二进制是否拥有执行权限
   * Windows系统不需要检查执行权限
   * Linux和macOS系统需要确保有执行权限
   */
  if (process.platform !== 'win32' && data.executablePath) {
    try {
      fs.accessSync(data.executablePath, fs.constants.X_OK)
    } catch (error) {
      /** 只有在文件存在但没有执行权限时才赋予权限 */
      if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
        chmod(data.executablePath)
      } else {
        console.error(error)
      }
    }
  }

  spinner.success(`初始化完成: 用时 ${((Date.now() - time) / 1000).toFixed(1)}s`)
  return data
}
