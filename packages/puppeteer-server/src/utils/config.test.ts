import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defaultConfig, getConfig, clearConfigCache, updateConfig, initEnv } from './config'

// 导入模拟后的依赖
import fs from 'fs'
import * as puppeteer from '../puppeteer'
import * as clientMap from '../client/map'

// 首先，将所有的mock定义提前：模拟vi.mock使用顶层变量问题
// 所有mock操作必须在import之前完成
vi.mock('fs', () => {
  return {
    default: {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
      readFileSync: vi.fn()
    },
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn()
  }
})

vi.mock('path', () => {
  return {
    default: {
      dirname: vi.fn(() => '/mock/path'),
      join: vi.fn()
    },
    dirname: vi.fn(() => '/mock/path'),
    join: vi.fn()
  }
})

vi.mock('./dir', () => ({
  configFile: '/mock/path/config.json',
  countFile: '/mock/path/count.json'
}))

vi.mock('../puppeteer', () => ({
  hmrConfig: vi.fn()
}))

vi.mock('../server/utils/number', () => ({
  diffArray: vi.fn(() => ({
    removed: [{ url: 'ws://removed.com' }],
    added: [{ url: 'ws://added.com' }]
  }))
}))

vi.mock('../client/map', () => ({
  closeWebSocket: vi.fn(),
  addWebSocket: vi.fn()
}))

// 模拟全局logger
vi.stubGlobal('logger', {
  level: 'info',
  mark: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn()
})

describe('Config模块测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearConfigCache()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getConfig', () => {
    it('如果配置文件存在，应该读取并返回配置', () => {
      const mockConfig = {
        browser: {
          headless: true,
          args: []
        },
        http: {
          host: '127.0.0.1',
          port: 7776,
          token: 'test',
          limit: '50mb',
          screenshot: true
        },
        ws_server: { enable: true, path: '/' },
        ws_client: [],
        logger: { level: 'debug' },
        env: {}
      }

      // @ts-ignore 模拟配置文件存在
      vi.mocked(fs.existsSync).mockReturnValue(true)
      // @ts-ignore 模拟读取文件
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig) as any)

      const config = getConfig()

      expect(fs.existsSync).toHaveBeenCalled()
      expect(fs.readFileSync).toHaveBeenCalled()
      expect(config).toEqual(mockConfig)
    })

    it('如果配置文件不存在，应该创建默认配置并返回', () => {
      // @ts-ignore 模拟配置文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const config = getConfig()

      expect(fs.existsSync).toHaveBeenCalled()
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/path', { recursive: true })
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/path/config.json',
        JSON.stringify(defaultConfig, null, 2)
      )
      expect(config).toEqual(defaultConfig)
    })
  })

  describe('updateConfig', () => {
    it('应该正确更新配置', () => {
      const oldConfig = {
        browser: { headless: true, args: [] },
        http: {
          host: '127.0.0.1',
          port: 7775,
          token: 'test',
          limit: '50mb',
          screenshot: true
        },
        ws_server: { enable: true, path: '/' },
        ws_client: [{ url: 'ws://old.com', enable: true }],
        logger: { level: 'info' },
        env: {}
      }

      const newConfig = {
        browser: { headless: false, args: [] },
        http: {
          host: '127.0.0.1',
          port: 7776,
          token: 'test',
          limit: '50mb',
          screenshot: true
        },
        ws_server: { enable: false, path: '/' },
        ws_client: [{ url: 'ws://new.com', enable: true }],
        logger: { level: 'debug' },
        env: { TEST: 'test' }
      }

      // 调用更新配置
      updateConfig(oldConfig, newConfig)

      // 验证日志级别是否更新
      expect(logger.level).toBe('debug')

      // 验证浏览器配置是否更新
      expect(puppeteer.hmrConfig).toHaveBeenCalledWith(newConfig.browser)

      // 验证WebSocket客户端是否关闭和添加
      expect(clientMap.closeWebSocket).toHaveBeenCalledWith('ws://removed.com')
      expect(clientMap.addWebSocket).toHaveBeenCalled()

      // 验证配置文件是否保存
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/path/config.json',
        JSON.stringify(newConfig, null, 2)
      )
    })
  })

  describe('initEnv', () => {
    it('应该正确初始化环境变量', () => {
      const originalEnv = process.env
      process.env = {}

      const config = {
        browser: { args: [] },
        http: {
          host: '127.0.0.1',
          port: 8080,
          token: 'test',
          limit: '50mb',
          screenshot: true
        },
        ws_server: { enable: true, path: '/' },
        ws_client: [],
        logger: { level: 'info' },
        env: {
          TEST_ENV: 'test-value',
          NULL_ENV: null,
          UNDEFINED_ENV: undefined
        }
      }

      initEnv(config)

      // 验证环境变量是否设置
      expect(process.env.TEST_ENV).toBe('test-value')
      expect(process.env.NULL_ENV).toBeUndefined()
      expect(process.env.UNDEFINED_ENV).toBeUndefined()

      // 恢复环境变量
      process.env = originalEnv
    })
  })
})
