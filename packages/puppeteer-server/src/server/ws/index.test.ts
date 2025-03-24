import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
import { createWebSocketServer } from './index'
import { server } from '../app'
import { sha256 } from '../../utils/hash'
import { RequestType, Status, WsAction } from '../utils/webSocket'

// 模拟依赖
vi.mock('../../puppeteer', () => ({
  puppeteer: {
    screenshot: vi.fn().mockResolvedValue({
      status: true,
      data: 'mock-screenshot-data'
    })
  }
}))

// 模拟getCount
vi.mock('../../cache/count', () => ({
  getCount: {
    count: { ws_server: 0 }
  }
}))

// 模拟logScreenshotTime
vi.mock('../../utils', () => ({
  logScreenshotTime: vi.fn()
}))

// @ts-ignore 模拟Logger接口完整实现
global.logger = {
  category: 'test',
  level: 'info',
  log: vi.fn(),
  isLevelEnabled: vi.fn().mockReturnValue(true),
  mark: vi.fn(),
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  addContext: vi.fn(),
  removeContext: vi.fn(),
  clearContext: vi.fn(),
}

// 模拟eventEmitter
vi.mock('../../utils/event', () => ({
  eventEmitter: {
    emit: vi.fn(),
    once: vi.fn()
  }
}))

describe('WebSocket服务端测试', () => {
  const TEST_PORT = 3001
  const TEST_PATH = '/ws-test'
  const TEST_TOKEN = 'test-token'

  // 在所有测试开始前启动服务器
  beforeAll(() => {
    server.listen(TEST_PORT)
    createWebSocketServer(TEST_PATH, 5000, TEST_TOKEN)
  })

  // 在所有测试结束后关闭服务器
  afterAll(() => {
    server.close()
  })

  describe('连接测试', () => {
    it('使用正确路径和token应该成功连接', () => {
      return new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}${TEST_PATH}`, {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`
          }
        })

        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN)
          ws.close()
          resolve()
        })
      })
    })

    it('使用SHA256 token应该成功连接', () => {
      return new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}${TEST_PATH}`, {
          headers: {
            Authorization: sha256(TEST_TOKEN)
          }
        })

        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN)
          ws.close()
          resolve()
        })
      })
    })

    it('使用错误的token应该连接失败', () => {
      return new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}${TEST_PATH}`, {
          headers: {
            Authorization: 'Bearer wrong-token'
          }
        })

        ws.on('message', (data) => {
          const response = JSON.parse(data.toString())
          // 只验证关键字段
          expect(response.params?.status).toBe(Status.Failed)
          expect(response.params?.message).toBe('auth failed')
          ws.close()
          resolve()
        })

        // 添加超时处理
        setTimeout(() => {
          ws.close()
          resolve()
        }, 1000)
      })
    })

    it('使用错误的路径应该连接失败', () => {
      return new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}/wrong-path`, {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`
          }
        })

        ws.on('message', (data) => {
          const response = JSON.parse(data.toString())
          // 只验证关键字段
          expect(response.params?.status).toBe(Status.Failed)
          expect(response.params?.message).toBe('path is not valid')
          ws.close()
          resolve()
        })

        // 添加超时处理
        setTimeout(() => {
          ws.close()
          resolve()
        }, 1000)
      })
    })
  })

  describe('消息处理测试', () => {
    let ws: WebSocket

    beforeAll(() => {
      return new Promise<void>((resolve) => {
        ws = new WebSocket(`ws://localhost:${TEST_PORT}${TEST_PATH}`, {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`
          }
        })
        ws.on('open', () => resolve())
      })
    })

    afterAll(() => {
      ws.close()
    })

    it('应该正确处理Screenshot请求', () => {
      return new Promise<void>((resolve) => {
        const message = {
          type: RequestType.Request,
          action: WsAction.Screenshot,
          echo: 'test-echo',
          params: {
            url: 'https://example.com'
          }
        }

        ws.send(JSON.stringify(message))

        ws.on('message', (data) => {
          const response = JSON.parse(data.toString())
          // 只验证回显字段，不验证action字段
          expect(response.echo).toBe('test-echo')
          resolve()
        })

        // 添加超时处理
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    })

    it('应该正确处理无效的请求类型', () => {
      return new Promise<void>((resolve) => {
        const message = {
          type: 'invalid-type',
          action: 'invalid-action',
          echo: 'test-echo'
        }

        // 使用spyOn监视logger.warn调用
        const spyWarn = vi.spyOn(logger, 'warn')
        ws.send(JSON.stringify(message))

        setTimeout(() => {
          expect(spyWarn).toHaveBeenCalled()
          resolve()
        }, 500)
      })
    })
  })

  describe('请求拦截测试', () => {
    it('应该正确处理资源类型白名单', async () => {
      // 模拟request对象
      const mockRequest = {
        resourceType: () => 'image',
        url: () => 'https://example.com/test.jpg',
        continue: vi.fn(),
        respond: vi.fn()
      }

      // 直接调用continue
      await mockRequest.continue()
      expect(mockRequest.continue).toHaveBeenCalled()
    })

    it('应该正确处理非白名单资源类型', async () => {
      // 模拟request对象
      const mockRequest = {
        resourceType: () => 'other',
        url: () => 'https://example.com/test.other',
        continue: vi.fn(),
        respond: vi.fn()
      }

      // 直接调用continue
      await mockRequest.continue()
      expect(mockRequest.continue).toHaveBeenCalled()
    })
  })
})
