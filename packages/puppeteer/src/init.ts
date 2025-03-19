import fs from 'node:fs'
import path from 'node:path'
import decompress from 'decompress'
import { createLog, download, GOOGLE, NPMMIRROR, type platform as Platform } from './common/index'

/**
 * 下载并解压浏览器
 * @param browser - 浏览器类型
 * @param version - 版本
 * @param platform - 平台
 * @param host - 源
 * @param savePath - zip保存路径
 * @param unzipPath - 解压路径
 * @description 如果下载失败 则会自动更换下载源并重新尝试: 自定义 > npmmirror > google
 */
export const downloadBrowser = async (
  browser: string,
  version: string,
  platform: ReturnType<typeof Platform>,
  host: string,
  savePath: string,
  unzipPath: string
) => {
  const url = `${host}/${version}/${platform}/${browser}-${platform}.zip`
  try {
    await download(url, savePath)
  } catch (error) {
    /** 自定义源 */
    if (host !== GOOGLE && host !== NPMMIRROR) {
      downloadBrowser(browser, version, platform, NPMMIRROR, savePath, unzipPath)
      return
    }

    /** npmmirror源 */
    if (host === NPMMIRROR) {
      downloadBrowser(browser, version, platform, GOOGLE, savePath, unzipPath)
      return
    }

    /** 谷歌源再下载失败直接跑出错误 */
    throw new Error(createLog('初始化失败: 所有下载源都下载失败 请检查你的网络是否处于正常状态'), { cause: error })
  }

  fs.mkdirSync(path.dirname(unzipPath), { recursive: true })
  await decompress(savePath, unzipPath)
  fs.unlinkSync(savePath)
}
