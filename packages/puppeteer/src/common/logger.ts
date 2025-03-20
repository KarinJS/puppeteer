/**
 * 构建日志
 * @param message - 日志消息
 * @returns 日志文本
 */
export const createLog = (message: string) => {
  return `[@karinjs/@karinjs/puppeteer-core] ${message}`
}

/**
 * 调试日志
 * @param args - 日志参数
 */
export const debug = process.env.NODE_ENV === 'development'
  ? (...args: any[]) => console.log(...args)
  : () => { }
