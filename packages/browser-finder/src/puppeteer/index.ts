import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

/**
 * Platform names used to identify a OS platform x architecture combination in the way
 * that is relevant for the browser download.
 *
 * @public
 */
export enum BrowserPlatform {
  LINUX = 'linux',
  LINUX_ARM = 'linux_arm',
  MAC = 'mac',
  MAC_ARM = 'mac_arm',
  WIN32 = 'win32',
  WIN64 = 'win64',
}

/**
 * Supported browsers.
 *
 * @public
 */
export enum Browser {
  CHROME = 'chrome',
  CHROMEHEADLESSSHELL = 'chrome-headless-shell',
  CHROMIUM = 'chromium',
  CHROMEDRIVER = 'chromedriver',
}

/**
 * 浏览器信息接口
 */
export interface BrowserInfo {
  type: string
  executablePath: string
  version: string
  channel: string
}

/**
 * 获取当前平台
 */
function getCurrentPlatform (): BrowserPlatform {
  const platform = os.platform()
  const arch = os.arch()

  if (platform === 'linux') {
    return arch === 'arm64' || arch === 'arm' ? BrowserPlatform.LINUX_ARM : BrowserPlatform.LINUX
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? BrowserPlatform.MAC_ARM : BrowserPlatform.MAC
  }
  if (platform === 'win32') {
    return arch === 'x64' ? BrowserPlatform.WIN64 : BrowserPlatform.WIN32
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

/**
 * 获取Puppeteer缓存目录
 */
function getPuppeteerCacheDir (): string {
  // 优先使用环境变量
  if (process.env.PUPPETEER_CACHE_DIR) {
    return process.env.PUPPETEER_CACHE_DIR
  }

  // 兼容旧的环境变量
  if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD !== 'true' && process.env.PUPPETEER_EXECUTABLE_PATH) {
    // 如果设置了可执行路径，尝试从中推断缓存目录
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH
    const parts = execPath.split(path.sep)
    const puppeteerIndex = parts.indexOf('puppeteer')
    if (puppeteerIndex !== -1) {
      return parts.slice(0, puppeteerIndex + 1).join(path.sep)
    }
  }

  // 获取默认缓存目录
  const homeDir = os.homedir()
  const platform = os.platform()

  if (platform === 'win32') {
    // Windows: %USERPROFILE%\.cache\puppeteer
    return path.join(homeDir, '.cache', 'puppeteer')
  } else if (platform === 'darwin') {
    // macOS: ~/.cache/puppeteer (有时也使用 ~/Library/Caches/puppeteer)
    const xdgCache = process.env.XDG_CACHE_HOME
    if (xdgCache) {
      return path.join(xdgCache, 'puppeteer')
    }
    return path.join(homeDir, '.cache', 'puppeteer')
  } else {
    // Linux: ~/.cache/puppeteer
    const xdgCache = process.env.XDG_CACHE_HOME
    if (xdgCache) {
      return path.join(xdgCache, 'puppeteer')
    }
    return path.join(homeDir, '.cache', 'puppeteer')
  }
}

/**
 * 比较版本号，用于排序（新版本在前）
 */
function compareVersions (a: string, b: string): number {
  // 处理特殊版本号（如 "system"）
  if (a === 'system' && b === 'system') return 0
  if (a === 'system') return 1  // system 版本排在后面
  if (b === 'system') return -1

  // 对于数字版本号，使用语义化版本比较
  const parseVersion = (version: string) => {
    // 移除可能的前缀和后缀
    const cleaned = version.replace(/[^\d.]/g, '')
    const parts = cleaned.split('.').map(Number)
    // 确保至少有4个部分进行比较
    while (parts.length < 4) parts.push(0)
    return parts
  }

  const versionA = parseVersion(a)
  const versionB = parseVersion(b)

  // 逐个比较版本号的每个部分
  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const partA = versionA[i] || 0
    const partB = versionB[i] || 0

    if (partA > partB) return -1  // A版本更新，排在前面
    if (partA < partB) return 1   // B版本更新，排在前面
  }

  return 0  // 版本相同
}

/**
 * 根据版本号判断Chrome的发布通道
 */
function detectChromeChannel (version: string): string {
  // 这是一个简化的逻辑，实际情况可能更复杂
  // 通常 canary 版本号更高，beta 次之，stable 最低
  // 但这里我们简化处理，默认返回 stable

  // 如果版本号包含特殊标识符
  if (version.includes('canary') || version.includes('dev')) {
    return 'canary'
  }
  if (version.includes('beta')) {
    return 'beta'
  }

  // 对于数字版本号，这里简化处理，都认为是 stable
  // 实际应用中可以通过 API 查询或更复杂的逻辑来判断
  return 'stable'
}

/**
 * Chrome浏览器相关函数
 */
function getChromeFolder (platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      return 'linux64'
    case BrowserPlatform.MAC_ARM:
      return 'mac-arm64'
    case BrowserPlatform.MAC:
      return 'mac-x64'
    case BrowserPlatform.WIN32:
      return 'win32'
    case BrowserPlatform.WIN64:
      return 'win64'
  }
}

function getChromeExecutablePath (platform: BrowserPlatform, browserType: string, version: string): string {
  const folderName = getChromeFolder(platform)

  switch (platform) {
    case BrowserPlatform.MAC:
    case BrowserPlatform.MAC_ARM:
      if (browserType === Browser.CHROME) {
        return path.join(
          `chrome-${folderName}`,
          'Google Chrome for Testing.app',
          'Contents',
          'MacOS',
          'Google Chrome for Testing'
        )
      } else if (browserType === Browser.CHROMEHEADLESSSHELL) {
        return path.join(
          `chrome-headless-shell-${folderName}`,
          'chrome-headless-shell'
        )
      } else if (browserType === Browser.CHROMEDRIVER) {
        return path.join(`chromedriver-${folderName}`, 'chromedriver')
      }
      break
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      if (browserType === Browser.CHROME) {
        return path.join('chrome-linux64', 'chrome')
      } else if (browserType === Browser.CHROMEHEADLESSSHELL) {
        return path.join('chrome-headless-shell-linux64', 'chrome-headless-shell')
      } else if (browserType === Browser.CHROMEDRIVER) {
        return path.join('chromedriver-linux64', 'chromedriver')
      }
      break
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      if (browserType === Browser.CHROME) {
        return path.join(`chrome-${folderName}`, 'chrome.exe')
      } else if (browserType === Browser.CHROMEHEADLESSSHELL) {
        return path.join(`chrome-headless-shell-${folderName}`, 'chrome-headless-shell.exe')
      } else if (browserType === Browser.CHROMEDRIVER) {
        return path.join(`chromedriver-${folderName}`, 'chromedriver.exe')
      }
      break
  }

  throw new Error(`Unsupported browser type ${browserType} on platform ${platform}`)
}

/**
 * Chromium浏览器相关函数
 */
function getChromiumExecutablePath (platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.MAC:
    case BrowserPlatform.MAC_ARM:
      return path.join(
        'chrome-mac',
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium'
      )
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      return path.join('chrome-linux', 'chrome')
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return path.join('chrome-win', 'chrome.exe')
  }
}

/**
 * 扫描Chrome系列浏览器（chrome, chrome-headless-shell, chromedriver）
 */
async function scanChromeBrowsers (cacheDir: string, platform: BrowserPlatform): Promise<BrowserInfo[]> {
  const browsers: BrowserInfo[] = []
  const browserTypes = [Browser.CHROME, Browser.CHROMEHEADLESSSHELL, Browser.CHROMEDRIVER]

  for (const browserType of browserTypes) {
    const browserDir = path.join(cacheDir, browserType)

    if (!fs.existsSync(browserDir)) {
      continue
    }

    try {
      // Chrome系列浏览器的目录结构是：chrome/win64-version/ 而不是 chrome/win64/version/
      const entries = fs.readdirSync(browserDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      // 查找平台相关的目录（如 win64-131.0.6778.204）
      const platformFolder = getChromeFolder(platform)
      const versionDirs = entries.filter(dir => dir.startsWith(`${platformFolder}-`))

      for (const versionDir of versionDirs) {
        // 从目录名提取版本号 (如从 "win64-131.0.6778.204" 提取 "131.0.6778.204")
        const version = versionDir.replace(`${platformFolder}-`, '')
        const fullVersionDir = path.join(browserDir, versionDir)
        const relativePath = getChromeExecutablePath(platform, browserType, version)
        const executablePath = path.join(fullVersionDir, relativePath)

        if (fs.existsSync(executablePath)) {
          browsers.push({
            type: browserType,
            executablePath,
            version,
            channel: detectChromeChannel(version)
          })
        }
      }
    } catch (error) {
      console.warn(`Error scanning ${browserType}:`, error)
    }
  }

  return browsers
}

/**
 * 扫描Chromium浏览器
 */
async function scanChromiumBrowsers (cacheDir: string, platform: BrowserPlatform): Promise<BrowserInfo[]> {
  const browsers: BrowserInfo[] = []
  const browserDir = path.join(cacheDir, Browser.CHROMIUM)

  if (!fs.existsSync(browserDir)) {
    return browsers
  }

  try {
    // Chromium使用不同的文件夹结构
    let platformFolder: string
    switch (platform) {
      case BrowserPlatform.LINUX_ARM:
      case BrowserPlatform.LINUX:
        platformFolder = 'Linux_x64'
        break
      case BrowserPlatform.MAC_ARM:
        platformFolder = 'Mac_Arm'
        break
      case BrowserPlatform.MAC:
        platformFolder = 'Mac'
        break
      case BrowserPlatform.WIN32:
        platformFolder = 'Win'
        break
      case BrowserPlatform.WIN64:
        platformFolder = 'Win_x64'
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    const platformDir = path.join(browserDir, platformFolder)

    if (!fs.existsSync(platformDir)) {
      return browsers
    }

    const buildIds = fs.readdirSync(platformDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => /^\d+$/.test(name)) // Chromium使用数字构建ID

    for (const buildId of buildIds) {
      const buildDir = path.join(platformDir, buildId)
      const relativePath = getChromiumExecutablePath(platform)
      const executablePath = path.join(buildDir, relativePath)

      if (fs.existsSync(executablePath)) {
        browsers.push({
          type: Browser.CHROMIUM,
          executablePath,
          version: buildId,
          channel: 'nightly' // Chromium通常是nightly构建
        })
      }
    }
  } catch (error) {
    console.warn('Error scanning Chromium:', error)
  }

  return browsers
}

/*
// 系统浏览器扫描功能 - 暂时注释掉，仅保留Puppeteer缓存扫描
// 如需要系统浏览器支持，可以取消注释以下代码

function getSystemChromeExecutablePaths (platform: BrowserPlatform): Array<{ path: string, channel: string }> {
  const paths: Array<{ path: string, channel: string }> = []

  switch (platform) {
    case BrowserPlatform.WIN64:
    case BrowserPlatform.WIN32: {
      const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files'
      const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'

      const windowsPaths = [
        { path: path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'), channel: 'stable' },
        { path: path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'), channel: 'stable' },
        { path: path.join(programFiles, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'), channel: 'beta' },
        { path: path.join(programFilesX86, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'), channel: 'beta' },
        { path: path.join(programFiles, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'), channel: 'canary' },
        { path: path.join(programFilesX86, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'), channel: 'canary' },
        { path: path.join(programFiles, 'Google', 'Chrome Dev', 'Application', 'chrome.exe'), channel: 'dev' }
      ]

      windowsPaths.forEach(({ path: execPath, channel }) => {
        if (fs.existsSync(execPath)) {
          paths.push({ path: execPath, channel })
        }
      })
      break
    }

    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC: {
      const macPaths = [
        { path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', channel: 'stable' },
        { path: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta', channel: 'beta' },
        { path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary', channel: 'canary' },
        { path: '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev', channel: 'dev' }
      ]

      macPaths.forEach(({ path: execPath, channel }) => {
        if (fs.existsSync(execPath)) {
          paths.push({ path: execPath, channel })
        }
      })
      break
    }

    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX: {
      const linuxPaths = [
        { path: '/opt/google/chrome/chrome', channel: 'stable' },
        { path: '/opt/google/chrome-beta/chrome', channel: 'beta' },
        { path: '/opt/google/chrome-canary/chrome', channel: 'canary' },
        { path: '/opt/google/chrome-unstable/chrome', channel: 'dev' },
        { path: '/usr/bin/google-chrome', channel: 'stable' },
        { path: '/usr/bin/google-chrome-beta', channel: 'beta' },
        { path: '/usr/bin/google-chrome-unstable', channel: 'dev' }
      ]

      linuxPaths.forEach(({ path: execPath, channel }) => {
        if (fs.existsSync(execPath)) {
          paths.push({ path: execPath, channel })
        }
      })
      break
    }
  }

  return paths
}

async function scanSystemBrowsers (platform: BrowserPlatform): Promise<BrowserInfo[]> {
  const browsers: BrowserInfo[] = []

  const chromePaths = getSystemChromeExecutablePaths(platform)

  for (const { path: executablePath, channel } of chromePaths) {
    try {
      browsers.push({
        type: 'chrome-system',
        executablePath,
        version: 'system',
        channel
      })
    } catch (error) {
      console.warn(`Error processing system Chrome at ${executablePath}:`, error)
    }
  }

  return browsers
}
*/

/**
 * 查找Puppeteer缓存的浏览器
 * @param includeSystem 是否包含系统安装的浏览器（当前版本中此参数被忽略）
 * @returns 返回找到的浏览器信息数组
 */
export async function findCachedBrowsers (includeSystem: boolean = false): Promise<BrowserInfo[]> {
  const cacheDir = getPuppeteerCacheDir()
  const platform = getCurrentPlatform()

  const browsers: BrowserInfo[] = []

  // 扫描缓存的浏览器
  if (fs.existsSync(cacheDir)) {
    // 扫描Chrome系列浏览器
    const chromeBrowsers = await scanChromeBrowsers(cacheDir, platform)
    browsers.push(...chromeBrowsers)

    // 扫描Chromium浏览器
    const chromiumBrowsers = await scanChromiumBrowsers(cacheDir, platform)
    browsers.push(...chromiumBrowsers)
  }

  // 系统浏览器扫描功能已暂时注释掉
  // if (includeSystem) {
  //   const systemBrowsers = await scanSystemBrowsers(platform)
  //   browsers.push(...systemBrowsers)
  // }

  // 对结果按版本号排序（新版本在前），相同版本时按类型排序
  browsers.sort((a, b) => {
    const versionCompare = compareVersions(a.version, b.version)
    if (versionCompare !== 0) {
      return versionCompare
    }
    // 版本相同时，按类型名称排序
    return a.type.localeCompare(b.type)
  })

  return browsers
}
