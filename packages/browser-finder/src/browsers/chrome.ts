import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { BrowserInfo, BrowserType, BrowserSource, ReleaseChannel, ReleaseChannelValue, PlatformValue } from '../types'
import { isExecutable, getBrowserVersion, isDirectory } from '../utils/file'
import { getCurrentPlatform } from '../utils/platform'

/**
 * Chrome浏览器的默认安装路径
 */
export function getChromePath (platform: PlatformValue, channel: ReleaseChannelValue = ReleaseChannel.STABLE): string {
  switch (platform) {
    case 'win32':
    case 'win64':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return path.join(process.env['PROGRAMFILES'] || '', 'Google/Chrome/Application/chrome.exe')
        case ReleaseChannel.BETA:
          return path.join(process.env['PROGRAMFILES'] || '', 'Google/Chrome Beta/Application/chrome.exe')
        case ReleaseChannel.DEV:
          return path.join(process.env['PROGRAMFILES'] || '', 'Google/Chrome Dev/Application/chrome.exe')
        case ReleaseChannel.CANARY:
          return path.join(process.env['PROGRAMFILES'] || '', 'Google/Chrome SxS/Application/chrome.exe')
      }
      break
    case 'darwin':
    case 'darwin_arm':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        case ReleaseChannel.BETA:
          return '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta'
        case ReleaseChannel.DEV:
          return '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev'
        case ReleaseChannel.CANARY:
          return '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
      }
      break
    case 'linux':
    case 'linux_arm':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return '/opt/google/chrome/chrome'
        case ReleaseChannel.BETA:
          return '/opt/google/chrome-beta/chrome'
        case ReleaseChannel.DEV:
          return '/opt/google/chrome-unstable/chrome'
        case ReleaseChannel.CANARY:
          return '/opt/google/chrome-canary/chrome'
      }
      break
  }
  return ''
}

/**
 * 获取Chrome浏览器的所有可能安装路径
 */
export function getChromePaths (platform: PlatformValue): string[] {
  const paths: string[] = []

  // 添加所有渠道的路径
  Object.values(ReleaseChannel).forEach(channel => {
    const path = getChromePath(platform, channel)
    if (path) {
      paths.push(path)
    }
  })

  // 添加额外的可能路径
  if (platform === 'win32' || platform === 'win64') {
    // Windows 额外路径
    paths.push(path.join(process.env['LOCALAPPDATA'] || '', 'Google/Chrome/Application/chrome.exe'))
    paths.push(path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'))
  } else if (platform === 'linux' || platform === 'linux_arm') {
    // Linux 额外路径
    paths.push('/usr/bin/google-chrome')
    paths.push('/usr/bin/google-chrome-stable')
    paths.push('/usr/bin/chrome')
    paths.push('/usr/bin/chromium-browser')
    paths.push('/usr/bin/chromium')
    paths.push('/snap/bin/chromium')
  }

  return paths
}

/**
 * 从Windows注册表中查找Chrome浏览器路径
 * @returns Chrome浏览器路径数组
 */
export function findChromeFromRegistry (): string[] {
  if (os.platform() !== 'win32') {
    return []
  }

  try {
    const registryKeys = [
      '\\Software\\Google\\Chrome\\BLBeacon',
      '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe',
    ]

    const paths: string[] = []

    for (const key of registryKeys) {
      try {
        const value = execSync(
          `reg query "HKEY_CURRENT_USER${key}" /v version`,
          { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
        ).toString().trim()

        const match = value.match(/REG_SZ\s+(.*)$/)
        if (match) {
          const versionMatch = match[1].trim()
          if (versionMatch) {
            // 找到版本后，尝试找到安装路径
            try {
              const pathValue = execSync(
                'reg query "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve',
                { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
              ).toString().trim()

              const pathMatch = pathValue.match(/REG_SZ\s+(.*)$/)
              if (pathMatch && pathMatch[1]) {
                const chromePath = pathMatch[1].trim()
                if (chromePath && !paths.includes(chromePath)) {
                  paths.push(chromePath)
                }
              }
            } catch (e) {
              // 忽略错误
            }
          }
        }
      } catch (e) {
        // 忽略错误
      }
    }

    return paths
  } catch (e) {
    return []
  }
}

/**
 * 从环境变量PATH中查找Chrome浏览器
 * @returns 浏览器路径数组
 */
export function findChromeFromPath (): string[] {
  try {
    const paths: string[] = []
    const envPath = process.env.PATH || ''
    const pathDirs = envPath.split(path.delimiter).filter(Boolean)
    const platform = os.platform()

    const executableNames = platform === 'win32'
      ? ['chrome.exe', 'chromium.exe', 'chromium-browser.exe']
      : ['google-chrome', 'chromium', 'chromium-browser']

    for (const dir of pathDirs) {
      for (const browserName of executableNames) {
        const browserPath = path.join(dir, browserName)
        if (isExecutable(browserPath) && !paths.includes(browserPath)) {
          paths.push(browserPath)
        }
      }
    }

    return paths
  } catch (e) {
    return []
  }
}

/**
 * 从Puppeteer缓存中查找Chrome浏览器
 * @returns Chrome浏览器路径数组
 */
export function findChromeFromPuppeteer (): string[] {
  try {
    const paths: string[] = []
    /** 浏览器名称 */
    const browserName = (() => {
      if (os.platform() === 'win32') {
        return 'chrome.exe'
      } else if (os.platform() === 'darwin') {
        return 'Chromium.app/Contents/MacOS/Chromium'
      } else {
        return 'chrome'
      }
    })()

    const PUPPETEER_CACHE_DIR = path.join(os.homedir(), '.cache', 'puppeteer')

    if (!fs.existsSync(PUPPETEER_CACHE_DIR)) {
      return paths
    }

    const revisions = fs.readdirSync(PUPPETEER_CACHE_DIR)
    /** revision是不同的发行版 */
    for (const revision of revisions) {
      const revisionPath = path.join(PUPPETEER_CACHE_DIR, revision)
      if (!isDirectory(revisionPath)) continue

      /** 浏览器版本列表 */
      const versionList = fs.readdirSync(revisionPath)
      for (const version of versionList) {
        const versionPath = path.join(revisionPath, version)
        if (!isDirectory(versionPath)) continue

        /** 浏览器平台 */
        const platformList = fs.readdirSync(versionPath)
        for (const platform of platformList) {
          /** 浏览器平台路径 */
          const platformPath = path.join(versionPath, platform)
          if (!isDirectory(platformPath)) continue

          /** 浏览器路径 */
          const browserPath = path.join(platformPath, browserName)
          if (!isExecutable(browserPath)) continue
          paths.push(browserPath)
        }
      }
    }

    return paths
  } catch (e) {
    return []
  }
}

/**
 * 从Playwright缓存中查找Chrome浏览器
 * @returns Chrome浏览器路径数组
 */
export function findChromeFromPlaywright (): string[] {
  try {
    const paths: string[] = []
    const PLAYWRIGHT_CACHE_DIR = path.join(os.homedir(), '.cache', 'ms-playwright')

    if (!fs.existsSync(PLAYWRIGHT_CACHE_DIR)) {
      return paths
    }

    const browserDir = 'chromium-'
    let executableName: string

    if (os.platform() === 'win32') {
      executableName = 'chrome.exe'
    } else if (os.platform() === 'darwin') {
      executableName = 'Chromium.app/Contents/MacOS/Chromium'
    } else {
      executableName = 'chrome'
    }

    const browserDirs = fs.readdirSync(PLAYWRIGHT_CACHE_DIR)
      .filter(dir => dir.startsWith(browserDir))

    for (const dir of browserDirs) {
      const browserPath = path.join(PLAYWRIGHT_CACHE_DIR, dir, executableName)
      if (isExecutable(browserPath)) {
        paths.push(browserPath)
      }
    }

    return paths
  } catch (e) {
    return []
  }
}

/**
 * 查找Chrome浏览器
 * @returns Chrome浏览器信息数组
 */
export function findChrome (): BrowserInfo[] {
  const results: BrowserInfo[] = []
  const platform = getCurrentPlatform()

  // 从固定路径查找
  const chromePaths = getChromePaths(platform)
  for (const browserPath of chromePaths) {
    if (isExecutable(browserPath)) {
      // 确定渠道
      let channel: ReleaseChannelValue = ReleaseChannel.STABLE
      if (browserPath.includes('Beta')) {
        channel = ReleaseChannel.BETA
      } else if (browserPath.includes('Dev')) {
        channel = ReleaseChannel.DEV
      } else if (browserPath.includes('SxS') || browserPath.includes('Canary')) {
        channel = ReleaseChannel.CANARY
      }

      results.push({
        type: BrowserType.CHROME,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.DEFAULT_PATH,
        channel,
      })
    }
  }

  // 从注册表查找 (仅Windows)
  if (os.platform() === 'win32') {
    const registryPaths = findChromeFromRegistry()
    for (const browserPath of registryPaths) {
      if (isExecutable(browserPath) && !results.some(r => r.executablePath === browserPath)) {
        results.push({
          type: BrowserType.CHROME,
          executablePath: browserPath,
          version: getBrowserVersion(browserPath),
          source: BrowserSource.REGISTRY,
          channel: ReleaseChannel.STABLE,
        })
      }
    }
  }

  // 从环境变量PATH查找
  const envPaths = findChromeFromPath()
  for (const browserPath of envPaths) {
    if (!results.some(r => r.executablePath === browserPath)) {
      results.push({
        type: BrowserType.CHROME,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.PATH_ENVIRONMENT,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  // 从Puppeteer缓存查找
  const puppeteerPaths = findChromeFromPuppeteer()
  for (const browserPath of puppeteerPaths) {
    if (!results.some(r => r.executablePath === browserPath)) {
      results.push({
        type: BrowserType.CHROMIUM,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.PUPPETEER_CACHE,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  // 从Playwright缓存查找
  const playwrightPaths = findChromeFromPlaywright()
  for (const browserPath of playwrightPaths) {
    if (!results.some(r => r.executablePath === browserPath)) {
      results.push({
        type: BrowserType.CHROMIUM,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.PLAYWRIGHT_CACHE,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  return results
}
