import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import { BrowserInfo, BrowserType, BrowserSource, ReleaseChannel, ReleaseChannelValue, PlatformValue } from '../types'
import { isExecutable, getBrowserVersion } from '../utils/file'
import { getCurrentPlatform } from '../utils/platform'

/**
 * Edge浏览器的默认安装路径
 */
export function getEdgePath (platform: PlatformValue, channel: ReleaseChannelValue = ReleaseChannel.STABLE): string {
  switch (platform) {
    case 'win32':
    case 'win64':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return path.join(process.env['PROGRAMFILES'] || '', 'Microsoft/Edge/Application/msedge.exe')
        case ReleaseChannel.BETA:
          return path.join(process.env['PROGRAMFILES'] || '', 'Microsoft/Edge Beta/Application/msedge.exe')
        case ReleaseChannel.DEV:
          return path.join(process.env['PROGRAMFILES'] || '', 'Microsoft/Edge Dev/Application/msedge.exe')
        case ReleaseChannel.CANARY:
          return path.join(process.env['PROGRAMFILES'] || '', 'Microsoft/Edge SxS/Application/msedge.exe')
      }
      break
    case 'darwin':
    case 'darwin_arm':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        case ReleaseChannel.BETA:
          return '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta'
        case ReleaseChannel.DEV:
          return '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev'
        case ReleaseChannel.CANARY:
          return '/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary'
      }
      break
    case 'linux':
    case 'linux_arm':
      switch (channel) {
        case ReleaseChannel.STABLE:
          return '/opt/microsoft/msedge/msedge'
        case ReleaseChannel.BETA:
          return '/opt/microsoft/msedge-beta/msedge'
        case ReleaseChannel.DEV:
          return '/opt/microsoft/msedge-dev/msedge'
        case ReleaseChannel.CANARY:
          return '/opt/microsoft/msedge-canary/msedge'
      }
      break
  }
  return ''
}

/**
 * 获取Edge浏览器的所有可能安装路径
 */
export function getEdgePaths (platform: PlatformValue): string[] {
  const paths: string[] = []

  // 添加所有渠道的路径
  Object.values(ReleaseChannel).forEach(channel => {
    const path = getEdgePath(platform, channel)
    if (path) {
      paths.push(path)
    }
  })

  // 添加额外的可能路径
  if (platform === 'win32' || platform === 'win64') {
    // Windows 额外路径
    paths.push(path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe'))
  }

  return paths
}

/**
 * 从Windows注册表中查找Edge浏览器路径
 * @returns Edge浏览器路径数组
 */
export function findEdgeFromRegistry (): string[] {
  if (os.platform() !== 'win32') {
    return []
  }

  try {
    const registryKeys = [
      '\\Software\\Microsoft\\Edge\\BLBeacon',
      '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe',
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
                'reg query "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" /ve',
                { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
              ).toString().trim()

              const pathMatch = pathValue.match(/REG_SZ\s+(.*)$/)
              if (pathMatch && pathMatch[1]) {
                const edgePath = pathMatch[1].trim()
                if (edgePath && !paths.includes(edgePath)) {
                  paths.push(edgePath)
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
 * 从环境变量PATH中查找Edge浏览器
 * @returns 浏览器路径数组
 */
export function findEdgeFromPath (): string[] {
  try {
    const paths: string[] = []
    const envPath = process.env.PATH || ''
    const pathDirs = envPath.split(path.delimiter).filter(Boolean)
    const platform = os.platform()

    const executableNames = platform === 'win32'
      ? ['msedge.exe']
      : ['msedge']

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
 * 查找Edge浏览器
 * @returns Edge浏览器信息数组
 */
export function findEdge (): BrowserInfo[] {
  const results: BrowserInfo[] = []
  const platform = getCurrentPlatform()

  // 从固定路径查找
  const edgePaths = getEdgePaths(platform)
  for (const browserPath of edgePaths) {
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
        type: BrowserType.EDGE,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.DEFAULT_PATH,
        channel,
      })
    }
  }

  // 从注册表查找 (仅Windows)
  if (os.platform() === 'win32') {
    const registryPaths = findEdgeFromRegistry()
    for (const browserPath of registryPaths) {
      if (isExecutable(browserPath) && !results.some(r => r.executablePath === browserPath)) {
        results.push({
          type: BrowserType.EDGE,
          executablePath: browserPath,
          version: getBrowserVersion(browserPath),
          source: BrowserSource.REGISTRY,
          channel: ReleaseChannel.STABLE,
        })
      }
    }
  }

  // 从环境变量PATH查找
  const envPaths = findEdgeFromPath()
  for (const browserPath of envPaths) {
    if (!results.some(r => r.executablePath === browserPath)) {
      results.push({
        type: BrowserType.EDGE,
        executablePath: browserPath,
        version: getBrowserVersion(browserPath),
        source: BrowserSource.PATH_ENVIRONMENT,
        channel: ReleaseChannel.STABLE,
      })
    }
  }

  return results
}
