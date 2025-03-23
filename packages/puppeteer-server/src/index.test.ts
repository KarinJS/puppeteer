import { main } from './main/index'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 模拟依赖
vi.mock('./utils/config', () => ({
  getConfig: vi.fn(() => ({
    browser: {
      headless: true,
      args: []
    },
    http: {
      host: '127.0.0.1',
      port: 7775,
      token: 'test-token',
      limit: '50mb',
      screenshot: true
    },
    ws_server: {
      enable: true,
      path: '/',
      timeout: 30000,
      token: 'ws-token'
    },
    ws_client: [],
    logger: {
      level: 'info'
    },
    env: {}
  })),
  pkg: { version: '1.0.0', name: 'puppeteer-server' },
  initEnv: vi.fn()
}))

// 模拟核心模块
vi.mock('./core/index', () => ({
  processHandler: vi.fn()
}))

// 模拟日志模块
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  mark: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn()
}
vi.mock('./utils/logger', () => ({
  createLogger: vi.fn(() => mockLogger)
}))

// 模拟目录模块
vi.mock('./utils/dir', () => ({
  logFilename: 'test.log'
}))

// 模拟服务器模块
const mockApp = {
  use: vi.fn()
}
const mockRouter = {}
const mockInit = vi.fn()
vi.mock('./server/app', () => ({
  app: mockApp,
  router: mockRouter,
  init: mockInit
}))

// 模拟路由模块
vi.mock('./server/router', () => ({
  initRouter: vi.fn()
}))

// 模拟Web模块
vi.mock('./server/web', () => ({
  initWeb: vi.fn()
}))

// 模拟WebSocket服务器模块
vi.mock('./server/ws', () => ({
  createWebSocketServer: vi.fn()
}))

// 模拟Puppeteer模块
vi.mock('./puppeteer', () => ({
  createPuppeteer: vi.fn()
}))

// 模拟WebSocket客户端模块
vi.mock('./client/map', () => ({
  initWebSocket: vi.fn()
}))

describe('main函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore 避免类型错误，预先设置global.logger
    global.logger = mockLogger
  })

  afterEach(() => {
    // @ts-ignore 允许设置为undefined
    global.logger = undefined
  })

  it('应该正确初始化应用', async () => {
    // 运行主函数
    await main()

    // 验证模块是否被正确调用
    const { getConfig, initEnv } = await import('./utils/config')
    const { processHandler } = await import('./core/index')
    const { createLogger } = await import('./utils/logger')
    const { initRouter } = await import('./server/router')
    const { initWeb } = await import('./server/web')
    const { createWebSocketServer } = await import('./server/ws')
    const { createPuppeteer } = await import('./puppeteer')
    const { initWebSocket } = await import('./client/map')

    // 检查配置是否被获取
    expect(getConfig).toHaveBeenCalled()
    expect(initEnv).toHaveBeenCalled()

    // 检查日志记录器是否被创建
    expect(createLogger).toHaveBeenCalled()
    expect(processHandler).toHaveBeenCalled()

    // 检查路由是否被初始化
    expect(initRouter).toHaveBeenCalledWith('50mb')
    expect(mockApp.use).toHaveBeenCalledWith('/api', mockRouter)
    expect(initWeb).toHaveBeenCalledWith(mockApp)

    // 检查WebSocket服务器是否被创建
    expect(createWebSocketServer).toHaveBeenCalledWith('/', 30000, 'ws-token')

    // 检查HTTP服务器是否被初始化
    expect(mockInit).toHaveBeenCalledWith(7775, '127.0.0.1')

    // 检查Puppeteer是否被初始化
    expect(createPuppeteer).toHaveBeenCalledWith({
      headless: true,
      args: []
    })

    // 检查WebSocket客户端是否被初始化
    expect(initWebSocket).toHaveBeenCalledWith([])
  })

  it('应该使用自定义配置初始化', async () => {
    const customConfig = {
      browser: {
        headless: false,
        args: ['--no-sandbox']
      },
      http: {
        host: 'localhost',
        port: 8080,
        token: 'custom-token',
        limit: '100mb',
        screenshot: false
      },
      ws_server: {
        enable: false,
        path: '/ws',
        timeout: 60000,
        token: 'custom-ws-token'
      },
      ws_client: [{
        enable: true,
        url: 'ws://example.com',
        heartbeatTime: 60000,
        reconnectionTime: 10000,
        authorization: 'client-token'
      }],
      logger: {
        level: 'debug'
      },
      env: {
        TEST_ENV: 'test'
      }
    }

    // 运行主函数并传入自定义配置
    await main(customConfig)

    // 验证模块是否使用了自定义配置
    const { createPuppeteer } = await import('./puppeteer')
    const { initWebSocket } = await import('./client/map')
    const { createWebSocketServer } = await import('./server/ws')
    const { initEnv } = await import('./utils/config')

    // 检查环境变量是否被初始化
    expect(initEnv).toHaveBeenCalledWith(customConfig)

    // 检查WebSocket服务器是否被创建（应该不会，因为启用标志为false）
    expect(createWebSocketServer).not.toHaveBeenCalled()

    // 检查Puppeteer是否使用自定义配置初始化
    expect(createPuppeteer).toHaveBeenCalledWith({
      headless: false,
      args: ['--no-sandbox']
    })

    // 检查WebSocket客户端是否使用自定义配置初始化
    expect(initWebSocket).toHaveBeenCalledWith(customConfig.ws_client)
  })
})
