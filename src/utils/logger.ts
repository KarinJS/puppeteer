import log4js from 'log4js'
import { config, logsDir, pkg } from './config'

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
      filename: logsDir,
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
    default: { appenders: ['out', 'console'], level: config.logLevel }
  }
})

export const logger = log4js.getLogger('default')

process.on('unhandledRejection', error => logger.error('unhandledRejection', error))
process.on('uncaughtException', error => logger.error('uncaughtException', error))

logger.mark(`${pkg.name} 正在启动中...`)
logger.info(`当前版本:${pkg.version}`)
logger.info(pkg.homepage)
