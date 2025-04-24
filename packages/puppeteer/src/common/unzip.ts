import fs from 'node:fs'
import path from 'node:path'
import yocto from 'yocto-spinner'
import extract from 'extract-zip'
import { mkdirs } from './file'
import { createLog } from './logger'
import { spinnerValue } from './frames'

/**
 * 解压ZIP文件到指定目录
 * @param zipPath - ZIP文件路径
 * @param extractPath - 解压目标路径
 */
export const unzip = async (
  zipPath: string,
  extractPath: string
) => {
  const fileName = path.basename(zipPath)
  if (!fs.existsSync(zipPath)) {
    throw new Error(createLog(`文件不存在: ${zipPath}`))
  }

  mkdirs(extractPath)
  const spinner = yocto({
    text: `正在解压 ${fileName}...`,
    color: 'cyan',
    spinner: spinnerValue,
  }).start()

  await extract(zipPath, { dir: extractPath })
  spinner.success(`解压完成: ${extractPath}`)
}
