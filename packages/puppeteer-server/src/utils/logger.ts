import log4js from 'log4js'
import { count } from './count'
import { launch, ScreenshotOptions } from '@karinjs/puppeteer'
import { getFilename } from './file'

/**
 * 创建日志实例
 * @param dir 日志文件路径
 * @param logLevel 日志级别
 */
export const createLogger = (
  dir: string,
  logLevel: string
) => {
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '%[[Karin-puppeteer][%d{hh:mm:ss.SSS}][%4.4p]%] %m'
        }
      },
      out: {
        /** 输出到文件 */
        type: 'file',
        filename: dir,
        pattern: 'yyyy-MM-dd.log',
        /** 日期后缀 */
        keepFileExt: true,
        /** 日志文件名中包含日期模式 */
        alwaysIncludePattern: true,
        /** 日志输出格式 */
        layout: {
          type: 'pattern',
          pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
        }
      }
    },
    categories: {
      default: { appenders: ['out', 'console'], level: logLevel }
    }
  })
}

/**
 * 打印截图耗时
 * @param result 截图结果
 * @param options 截图选项
 * @param time 截图耗时
 */
export const logScreenshotTime = (
  result: Awaited<ReturnType<Awaited<ReturnType<typeof launch>>['screenshot']>>,
  options: ScreenshotOptions,
  time: number
) => {
  count.count++
  let length = 0

  if (Array.isArray(result.data)) {
    result.data.forEach((item) => {
      length += typeof item === 'string'
        ? Buffer.byteLength(item, 'base64')
        : item.byteLength
    })
  } else {
    length = typeof result.data === 'string'
      ? Buffer.byteLength(result.data, 'base64')
      : (result.data as Uint8Array).byteLength
  }

  const kb = (length / 1024).toFixed(2) + 'KB'

  const name = getFilename(options)
  logger.mark(`[图片生成][${name}][${count.count}次] ${kb} ${Date.now() - time}ms`)
}
