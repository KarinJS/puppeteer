/** 处理基本信号 */
export const processHandler = () => {
  /** 捕获错误 */
  process.on('uncaughtException', (error, origin) => logger.error(error, origin))
  /** 捕获未处理的Promise错误 */
  process.on('unhandledRejection', (error, promise) => logger.error(error, promise))
  /** 捕获Promise错误 */
  process.on('rejectionHandled', error => logger.error(error))
}
