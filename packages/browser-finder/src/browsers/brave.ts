import * as path from 'path'
import * as os from 'os'
import { BrowserInfo, BrowserType, BrowserSource, ReleaseChannel, PlatformValue } from '../types'
import { isExecutable, getBrowserVersion } from '../utils/file'
import { getCurrentPlatform } from '../utils/platform'

/**
 * Brave浏览器的默认安装路径
 */
export function getBravePath (platform: PlatformValue): string {
  switch (platform) {
    case 'win32':
    case 'win64':
      return path.join(process.env['PROGRAMFILES'] || '', 'BraveSoftware/Brave-Browser/Application/brave.exe')
    case 'darwin':
    case 'darwin_arm':
      return '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    case 'linux':
    case 'linux_arm':
      return '/usr/bin/brave-browser'
  }
  return ''
}

/**
 * 获取Brave浏览器的所有可能安装路径
 */
export function getBravePaths (platform: PlatformValue): string[] {
  const paths: string[] = []

  // 添加主路径
  const mainPath = getBravePath(platform)
  if (mainPath) {
    paths.push(mainPath)
  }

  // 添加额外的可能路径
  if (platform === 'win32' || platform === 'win64') {
    // Windows 额外路径
    paths.push(path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware/Brave-Browser/Application/brave.exe'))
    paths.push(path.join(process.env['LOCALAPPDATA'] || '', 'BraveSoftware/Brave-Browser/Application/brave.exe'))
  } else if (platform === 'linux' || platform === 'linux_arm') {
    // Linux 额外路径
    paths.push('/usr/bin/brave')
  }

  return paths
}

/**
 * 从环境变量PATH中查找Brave浏览器
 * @returns 浏览器路径数组
 */
export function findBraveFromPath (): string[] {
  try {
    const paths: string[] = []
    const envPath = process.env.PATH || ''
    const pathDirs = envPath.split(path.delimiter).filter(Boolean)
    const platform = os.platform()

    const executableNames = platform === 'win32'
      ? ['brave.exe']
      : ['brave-browser', 'brave']

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
 * 查找Brave浏览器
 * @returns Brave浏览器信息数组
 */
export function findBrave (): BrowserInfo[] {
  const results: BrowserInfo[] = []
  const platform = getCurrentPlatform()

  // 从固定路径查找
  const bravePaths = getBravePaths(platform)
  for (const browserPath of bravePaths) {
    if (isExecutable(browserPath)) {
      results.push({
        type: BrowserType.BRAVE,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.DEFAULT_PATH,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  // 从环境变量PATH查找
  const envPaths = findBraveFromPath()
  for (const browserPath of envPaths) {
    if (!results.some(r => r.executablePath === browserPath)) {
      results.push({
        type: BrowserType.BRAVE,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.PATH_ENVIRONMENT,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  return results
}
