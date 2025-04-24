import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import yocto from 'yocto-spinner'
import { unzip } from './common/unzip'
import { spinnerValue } from './common/frames'
import { installLinuxDependencies } from './common/linux-dependencies'
import { createLog, download, GOOGLE, NPMMIRROR, puppeteerCache, type platform as Platform } from './common/index'

/**
 * 下载并解压浏览器
 * @param browser - 浏览器类型
 * @param version - 版本
 * @param platform - 平台
 * @param host - 源
 * @param savePath - zip保存路径
 * @param unzipPath - 解压路径
 * @param debDepsPath - Debian依赖文件路径（可选）
 * @param silent - 是否静默下载（不显示进度条）
 * @description 如果下载失败 则会自动更换下载源并重新尝试: 自定义 > npmmirror > google
 */
export const downloadBrowser = async (
  browser: string,
  version: string,
  platform: ReturnType<typeof Platform>,
  host: string,
  savePath: string,
  unzipPath: string,
  debDepsPath: string,
  silent = false
) => {
  const url = `${host}/${version}/${platform}/${browser}-${platform}.zip`
  try {
    await download(url, savePath, { silent })
  } catch (error) {
    /** 自定义源 */
    if (host !== GOOGLE && host !== NPMMIRROR) {
      downloadBrowser(browser, version, platform, NPMMIRROR, savePath, unzipPath, debDepsPath, silent)
      return
    }

    /** npmmirror源 */
    if (host === NPMMIRROR) {
      downloadBrowser(browser, version, platform, GOOGLE, savePath, unzipPath, debDepsPath, silent)
      return
    }

    /** 谷歌源再下载失败直接跑出错误 */
    throw new Error(createLog('初始化失败: 所有下载源都下载失败 请检查你的网络是否处于正常状态'), { cause: error })
  }

  fs.mkdirSync(path.dirname(unzipPath), { recursive: true })
  await unzip(savePath, unzipPath)
  fs.unlinkSync(savePath)

  puppeteerCache.updateBrowserInfo(unzipPath, process.cwd())

  if (os.platform() === 'linux') {
    const spinner = yocto({
      text: '初始化依赖...',
      color: 'cyan',
      spinner: spinnerValue,
    }).start()
    try {
      await installLinuxDependencies(debDepsPath)
      spinner.success('初始化依赖完成')
    } catch (error) {
      spinner.error(`初始化依赖失败: ${(error as Error).message || '未知错误'}`)
    }
  }
}
