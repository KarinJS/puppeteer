import type { LaunchOptions } from '../types'

const prefix = '[@karinjs/@karinjs/puppeteer-core]'

/**
 * 构建日志
 * @param message - 日志消息
 * @returns 日志文本
 */
export const createLog = (message: string) => {
  return `${prefix} ${message}`
}

/**
 * 调试日志
 * @param args - 日志参数
 */
export const debug = process.env.NODE_ENV === 'development'
  ? (...args: any[]) => console.log(...args)
  : () => { }

let log: LaunchOptions['logger'] = () => { }

/**
 * 日志记录器
 * @description 这部分需要用户自行提供
 */
export const logger = {
  debug: (...args: any[]) => log!('debug', prefix, ...args),
  info: (...args: any[]) => log!('info', prefix, ...args),
  warn: (...args: any[]) => log!('warn', prefix, ...args),
  error: (...args: any[]) => log!('error', prefix, ...args),
}

/**
 * 创建日志记录器
 * @param logger - 日志记录器
 */
export const createLogger = (logger: LaunchOptions['logger']) => {
  if (typeof logger !== 'function') {
    throw new Error('logger must be a function')
  }
  log = logger
}
