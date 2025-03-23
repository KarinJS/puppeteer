async function main () {
  /** 1. 初始化配置文件、环境变量 */
  const { getConfig, pkg, initEnv } = await import('./utils/config')
  const cfg = getConfig()
  initEnv(cfg)

  /** 2. 初始化日志 */
  const { processHandler } = await import('./core/index')
  const { createLogger } = await import('./utils/logger')
  const { logFilename } = await import('./utils/dir')
  const logger = createLogger(pkg, logFilename, cfg.logger.level)
  global.logger = logger
  processHandler()

  /** 3. 初始化服务 */
  const { app, router, init } = await import('./server/app')
  const { initRouter } = await import('./server/router')
  const { initWeb } = await import('./server/web')

  /** 4. 初始化路由 */
  initRouter(cfg.http.limit)
  app.use('/api', router)
  initWeb(app)

  /** 5. 初始化ws服务端 */
  const { createWebSocketServer } = await import('./server/ws')
  cfg.ws_server.enable && createWebSocketServer(
    cfg.ws_server.path,
    cfg.ws_server.timeout,
    cfg.ws_server.token
  )

  /** 6. 启动服务 */
  init(cfg.http.port, cfg.http.host)

  /** 7. 初始化浏览器实例 */
  const { createPuppeteer } = await import('./puppeteer')
  await createPuppeteer(cfg.browser)

  /** 8. 初始化ws客户端 */
  const { initWebSocket } = await import('./client/map')
  initWebSocket(cfg.ws_client)

  logger.mark('--------------------------------')
  logger.mark(`http鉴权密钥: \x1b[32m${cfg.http.token}\x1b[0m`)
  logger.mark(`webSocket鉴权密钥: \x1b[32m${cfg.ws_server.token}\x1b[0m`)
  logger.mark('--------------------------------')
}

main()
