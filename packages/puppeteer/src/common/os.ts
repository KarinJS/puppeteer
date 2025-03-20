import os from 'node:os'
import { createLog } from './logger'

/**
 * 当前系统是否为Windows
 */
export const isWindows = os.platform() === 'win32'

/**
 * 获取当前系统
 */
export const platform = () => {
  if (process.platform === 'linux') {
    return 'linux64'
  }

  if (process.platform === 'darwin') {
    const platform = os.arch() === 'arm64' ? 'mac-arm64' : 'mac-x64'
    return platform
  }

  if (process.platform === 'win32') {
    const platform = os.arch() === 'x64' ? 'win64' : 'win32'
    return platform
  }
  throw new Error(createLog(`不支持的系统: ${process.platform}`))
}
