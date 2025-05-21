import * as os from 'os'
import { Platform, PlatformValue } from '../types'

/**
 * 获取当前平台
 * @returns 平台类型
 */
export function getCurrentPlatform (): PlatformValue {
  const platform = os.platform()
  const arch = os.arch()

  if (platform === 'win32') {
    return arch === 'x64' ? Platform.WIN64 : Platform.WIN32
  }

  if (platform === 'darwin') {
    return arch === 'arm64' ? Platform.MAC_ARM : Platform.MAC
  }

  if (platform === 'linux') {
    return arch === 'arm64' || arch === 'arm' ? Platform.LINUX_ARM : Platform.LINUX
  }

  // 默认返回
  return Platform.LINUX
}
