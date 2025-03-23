import path from 'node:path'
import crypto from 'node:crypto'
import type { ScreenshotOptions } from '@karinjs/puppeteer'

/**
 * 获取文件名称
 * @param options 截图选项
 */
export const getFilename = (options: ScreenshotOptions) => {
  if (options.file_name) {
    return options.file_name
  }

  if (options.file.startsWith('file://') || options.file.startsWith('http')) {
    return path.basename(options.file)
  }

  /** 未知的使用md5 */
  return crypto.createHash('md5').update(options.file).digest('hex')
}
