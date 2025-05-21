import * as fs from 'fs'
import { execSync } from 'child_process'
import * as path from 'path'

/**
 * 检查文件是否存在且可执行
 * @param filePath 文件路径
 * @returns 是否存在且可执行
 */
export function isExecutable (filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 检查路径是否为文件夹
 * @param dirPath 路径
 * @returns 是否为文件夹
 */
export function isDirectory (dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  } catch (e) {
    return false
  }
}

/**
 * 从文件属性中获取版本信息（Windows）
 * @param executablePath 可执行文件路径
 * @returns 版本号或undefined
 */
function getVersionFromFileProperties (executablePath: string): string | undefined {
  try {
    // 使用PowerShell获取文件版本信息
    const versionInfo = execSync(
      `powershell -command "(Get-Item '${executablePath}').VersionInfo.ProductVersion"`,
      { timeout: 5000, windowsHide: true }
    ).toString().trim()

    return versionInfo
  } catch (e) {
    return undefined
  }
}

/**
 * 从Linux系统中获取浏览器版本（不执行浏览器）
 * @param executablePath 可执行文件路径
 * @returns 版本号或undefined
 */
function getVersionFromLinux (executablePath: string): string | undefined {
  try {
    // 对于Linux，我们可以使用file命令查看ELF文件信息
    // 但这通常不包含版本信息，所以我们尝试从文件路径推断
    const dirName = path.dirname(executablePath)

    // 检查路径中是否包含版本信息
    const versionMatch = dirName.match(/(\d+\.\d+\.\d+(\.\d+)?)/)
    if (versionMatch) {
      return versionMatch[1]
    }

    // 如果是符号链接，尝试读取链接目标
    try {
      const linkTarget = fs.readlinkSync(executablePath)
      if (linkTarget) {
        const linkVersionMatch = linkTarget.match(/(\d+\.\d+\.\d+(\.\d+)?)/)
        if (linkVersionMatch) {
          return linkVersionMatch[1]
        }
      }
    } catch (e) {
      // 不是符号链接，忽略错误
    }

    return undefined
  } catch (e) {
    return undefined
  }
}

/**
 * 从macOS系统中获取浏览器版本（不执行浏览器）
 * @param executablePath 可执行文件路径
 * @returns 版本号或undefined
 */
function getVersionFromMacOS (executablePath: string): string | undefined {
  try {
    // 尝试从Info.plist文件获取版本信息
    const appPath = executablePath.match(/(.+?)\.app/)
    if (appPath && appPath[1]) {
      const infoPlistPath = `${appPath[1]}.app/Contents/Info.plist`
      if (fs.existsSync(infoPlistPath)) {
        try {
          // 使用defaults命令读取版本信息
          const versionInfo = execSync(
            `defaults read "${infoPlistPath}" CFBundleShortVersionString`,
            { timeout: 5000 }
          ).toString().trim()

          if (versionInfo) {
            return versionInfo
          }
        } catch (e) {
          // 忽略错误
        }
      }
    }

    return undefined
  } catch (e) {
    return undefined
  }
}

/**
 * 从文件名推断浏览器版本（不准确，但不需要执行浏览器）
 * @param executablePath 浏览器可执行文件路径
 * @returns 浏览器版本或undefined
 */
export function getBrowserVersion (executablePath: string): string | undefined {
  if (!fs.existsSync(executablePath)) {
    return undefined
  }

  try {
    // 根据不同平台使用不同的版本检测方法
    switch (process.platform) {
      case 'win32':
        return getVersionFromFileProperties(executablePath)
      case 'darwin':
        return getVersionFromMacOS(executablePath)
      case 'linux':
        return getVersionFromLinux(executablePath)
      default:
        return undefined
    }
  } catch (e) {
    return undefined
  }
}
