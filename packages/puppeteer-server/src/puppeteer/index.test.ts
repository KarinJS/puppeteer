import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPuppeteer, hmrConfig, puppeteer } from './index'

// 模拟@karinjs/puppeteer
vi.mock('@karinjs/puppeteer', () => {
  const mockLaunch = vi.fn().mockResolvedValue({
    hmrConfig: vi.fn()
  })
  return {
    launch: mockLaunch
  }
})

describe('Puppeteer模块测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('应该正确创建Puppeteer实例', async () => {
    const config = {
      headless: true,
      args: ['--no-sandbox']
    }

    // 创建Puppeteer实例
    await createPuppeteer(config)

    // 检查launch是否被正确调用
    const { launch } = await import('@karinjs/puppeteer')
    expect(launch).toHaveBeenCalledWith(config)
  })

  it('应该在没有配置的情况下创建默认Puppeteer实例', async () => {
    // 创建Puppeteer实例，不传入配置
    await createPuppeteer()

    // 检查launch是否被正确调用，使用空对象作为默认配置
    const { launch } = await import('@karinjs/puppeteer')
    expect(launch).toHaveBeenCalledWith({})
  })

  it('应该正确更新Puppeteer配置', async () => {
    const config = {
      headless: false,
      args: ['--disable-gpu']
    }

    // 先创建实例
    await createPuppeteer()

    // 然后更新配置
    await hmrConfig(config)

    // 检查hmrConfig是否被正确调用
    expect(puppeteer.hmrConfig).toHaveBeenCalledWith(config)
  })
})
