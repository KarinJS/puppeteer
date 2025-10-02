import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { PUPPETEER_REVISIONS } from 'puppeteer-core/internal/revisions.js'

/**
 * Puppeteer缓存的默认根目录
 * @default ${os.homedir()}/.cache/puppeteer
 */
const CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer')

/**
 * 缓存版本文件路径
 * @default ${CACHE_DIR}/version.json
 */
const CACHE_VERSION_PATH = process.env.PUPPETEER_CACHE_VERSION || path.join(CACHE_DIR, 'version.json')

/**
 * 版本信息接口
 */
interface VersionInfo {
  [timestamp: string]: {
    unzipDir: string
    installDir: string
  }
}

/**
 * Puppeteer缓存配置和路径计算工具
 */
export const puppeteerCache = {
  /**
   * 缓存根目录
   */
  dir: CACHE_DIR,

  /**
   * 缓存版本文件路径
   */
  versionPath: CACHE_VERSION_PATH,

  /**
   * 读取版本信息文件
   * @returns 版本信息对象
   */
  readVersionInfo: (): VersionInfo => {
    try {
      if (!fs.existsSync(CACHE_VERSION_PATH)) {
        return {}
      }
      const data = fs.readFileSync(CACHE_VERSION_PATH, 'utf-8')
      return JSON.parse(data) as VersionInfo
    } catch (error) {
      return {}
    }
  },

  /**
   * 写入版本信息到文件
   * @param versionInfo - 版本信息对象
   */
  saveVersionInfo: (versionInfo: VersionInfo): void => {
    try {
      const dirPath = path.dirname(CACHE_VERSION_PATH)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      fs.writeFileSync(CACHE_VERSION_PATH, JSON.stringify(versionInfo, null, 2), 'utf-8')
    } catch (error) {
      console.error('保存版本信息失败:', error)
    }
  },

  /**
   * 更新浏览器信息到版本文件
   * @param unzipDir - 解压目录路径
   * @param installDir - 安装程序根目录
   */
  updateBrowserInfo: (unzipDir: string, installDir: string): void => {
    const versionInfo = puppeteerCache.readVersionInfo()

    const alreadyExists = Object.values(versionInfo).some(
      entry => entry.unzipDir === unzipDir && entry.installDir === installDir
    )

    if (alreadyExists) return

    const timestamp = new Date().toISOString()
    versionInfo[timestamp] = {
      unzipDir,
      installDir
    }

    puppeteerCache.saveVersionInfo(versionInfo)
  },

  /**
   * 计算浏览器可执行文件及相关资源的路径
   * @description ${os.homedir()}/.cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64
   * @param browser - 浏览器类型
   * @param platform - 运行平台
   * @returns 包含各种路径信息的对象
   */
  path: (browser: keyof typeof PUPPETEER_REVISIONS, platform: ReturnType<typeof import('../common').platform>) => {
    /**
     * 下载路径的平台
     */
    const downloadPlatform = platform
      .replace('linux64', 'linux')
      .replace('mac-arm64', 'mac_arm')
      .replace('mac-x64', 'mac')

    /**
     * 当前系统是否为Windows
     */
    const isWindows = os.platform() === 'win32'

    /**
     * 浏览器版本
     * @description 如果用户配置了浏览器版本 则使用用户配置的版本 否则使用puppeteer-core的版本
     * @default PUPPETEER_REVISIONS[browser]
     */
    const version = process.env.PUPPETEER_CHROME_HEADLESS_SHELL_VERSION || PUPPETEER_REVISIONS[browser]

    /**
     * 浏览器类型的基础缓存目录
     * @default .cache/puppeteer/chrome
     */
    const browserCacheDir = path.join(CACHE_DIR, browser)

    /**
     * 版本和平台特定的目录名
     * @default .cache/puppeteer/chrome/win64-131.0.6778.204
     */
    const versionPlatformDir = `${downloadPlatform}-${version}`

    /**
     * 版本和平台特定的完整目录路径
     * @default .cache/puppeteer/chrome/win64-131.0.6778.204
     */
    const versionSpecificDir = path.join(browserCacheDir, versionPlatformDir)

    /**
     * 浏览器可执行文件的目录
     * @default .cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64
     */
    const executableDir = path.join(versionSpecificDir, `${browser}-${platform}`)

    /**
     * ZIP归档文件路径
     * @default .cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64.zip
     */
    const archiveFilePath = path.join(versionSpecificDir, `${browser}-${downloadPlatform}.zip`)

    /**
     * ZIP解压目录
     * @default .cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64
     */
    const unzipDir = versionSpecificDir

    /**
     * 可执行文件路径
     */
    const executablePath = (() => {
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH
      }

      // macOS 平台需要特殊处理 .app 包结构
      if (os.platform() === 'darwin') {
        if (browser === 'chrome') {
          return path.join(executableDir, 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
        } else if (browser === 'chrome-headless-shell') {
          return path.join(executableDir, 'chrome-headless-shell')
        }
      }

      // Windows 和 Linux 平台
      return path.join(executableDir, `${browser}${isWindows ? '.exe' : ''}`)
    })()

    /**
     * Debian依赖文件路径（用于Linux平台）
     * @default .cache/puppeteer/chrome/linux64-131.0.6778.204/chrome-linux64/deb.deps
     */
    const debianDepsPath = path.join(executableDir, 'deb.deps')

    return {
      /** 版本 */
      version,
      /** 平台 */
      platform,
      /** 下载路径的平台 */
      downloadPlatform,
      /** 版本和平台特定的完整目录路径 */
      dir: versionSpecificDir,
      /** 浏览器可执行文件的目录 */
      executableDir,
      /** ZIP归档文件路径 */
      archiveFile: archiveFilePath,
      /** 可执行文件路径 */
      executablePath,
      /** Debian依赖文件路径 */
      debianDepsPath,
      /** ZIP解压目录 */
      unzipDir,
    }
  },
}
