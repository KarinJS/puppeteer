import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @snapka/puppeteer
const mockRun = vi.fn()
const mockScreenshot = vi.fn()
const mockScreenshotViewport = vi.fn()
const mockRestart = vi.fn()
const mockLaunch = vi.fn()

vi.mock('@snapka/puppeteer', () => ({
  snapka: {
    launch: (...args: any[]) => mockLaunch(...args),
  },
}))

// Capture the render callback registered via registerRender
let renderCallback: ((options: any) => Promise<any>) | null = null

vi.mock('node-karin', () => ({
  karin: {
    on: vi.fn(),
    emit: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    green: (s: string) => s,
    violet: (s: string) => s,
  },
  registerRender: vi.fn((_name: string, cb: any) => {
    renderCallback = cb
  }),
  renderTpl: vi.fn((options: any) => ({ ...options })),
}))

vi.mock('./config', () => ({
  pluginName: 'test-plugin',
  pluginVersion: '1.0.0',
  getConfig: vi.fn(() => ({})),
  HMR_KEY: 'test-hmr',
}))

vi.mock('./utils', () => ({
  formatBytes: vi.fn((bytes: number) => `${bytes} B`),
  getScreenshotByteSize: vi.fn(() => 1024),
}))

describe('index - 截图渲染器', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    renderCallback = null

    const browser = {
      screenshot: mockScreenshot,
      screenshotViewport: mockScreenshotViewport,
      restart: mockRestart,
    }
    mockLaunch.mockResolvedValue(browser)
    mockRun.mockResolvedValue('base64-single-image')
    mockScreenshot.mockResolvedValue({ run: mockRun })
    mockScreenshotViewport.mockResolvedValue({ run: mockRun })

    // Re-import to trigger main()
    vi.resetModules()

    // Re-apply mocks after resetModules
    vi.doMock('@snapka/puppeteer', () => ({
      snapka: { launch: (...args: any[]) => mockLaunch(...args) },
    }))
    vi.doMock('node-karin', () => ({
      karin: { on: vi.fn(), emit: vi.fn() },
      logger: {
        info: vi.fn(),
        green: (s: string) => s,
        violet: (s: string) => s,
      },
      registerRender: vi.fn((_name: string, cb: any) => {
        renderCallback = cb
      }),
      renderTpl: vi.fn((options: any) => ({ ...options })),
    }))
    vi.doMock('./config', () => ({
      pluginName: 'test-plugin',
      pluginVersion: '1.0.0',
      getConfig: vi.fn(() => ({})),
      HMR_KEY: 'test-hmr',
    }))
    vi.doMock('./utils', () => ({
      formatBytes: vi.fn((bytes: number) => `${bytes} B`),
      getScreenshotByteSize: vi.fn(() => 1024),
    }))

    await import('./index')
  })

  it('应该注册渲染器', () => {
    expect(renderCallback).toBeTruthy()
  })

  describe('普通截图 (无 multiPage)', () => {
    it('multiPage 未设置时应调用 screenshot', async () => {
      const options = { file: 'test.html', encoding: 'base64' }
      await renderCallback!(options)

      expect(mockScreenshot).toHaveBeenCalledTimes(1)
      expect(mockScreenshotViewport).not.toHaveBeenCalled()
    })

    it('multiPage 为 false 时应调用 screenshot', async () => {
      const options = { file: 'test.html', encoding: 'base64', multiPage: false }
      await renderCallback!(options)

      expect(mockScreenshot).toHaveBeenCalledTimes(1)
      expect(mockScreenshotViewport).not.toHaveBeenCalled()
    })

    it('multiPage 为 0 时应调用 screenshot', async () => {
      const options = { file: 'test.html', encoding: 'base64', multiPage: 0 }
      await renderCallback!(options)

      expect(mockScreenshot).toHaveBeenCalledTimes(1)
      expect(mockScreenshotViewport).not.toHaveBeenCalled()
    })

    it('multiPage 为负数时应调用 screenshot', async () => {
      const options = { file: 'test.html', encoding: 'base64', multiPage: -100 }
      await renderCallback!(options)

      expect(mockScreenshot).toHaveBeenCalledTimes(1)
      expect(mockScreenshotViewport).not.toHaveBeenCalled()
    })
  })

  describe('分片截图 (multiPage)', () => {
    it('multiPage 为 true 时应调用 screenshotViewport', async () => {
      mockRun.mockResolvedValue(['img1', 'img2'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: true }
      const result = await renderCallback!(options)

      expect(mockScreenshotViewport).toHaveBeenCalledTimes(1)
      expect(mockScreenshot).not.toHaveBeenCalled()
      expect(result).toEqual(['img1', 'img2'])
    })

    it('multiPage 为 true 时 viewportHeight 应为 0 (使用默认值)', async () => {
      mockRun.mockResolvedValue(['img1'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: true }
      await renderCallback!(options)

      const callArgs = mockScreenshotViewport.mock.calls[0][0]
      expect(callArgs.viewportHeight).toBe(0)
    })

    it('multiPage 为数字时应调用 screenshotViewport 并设置 viewportHeight', async () => {
      mockRun.mockResolvedValue(['img1', 'img2', 'img3'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: 800 }
      const result = await renderCallback!(options)

      expect(mockScreenshotViewport).toHaveBeenCalledTimes(1)
      expect(mockScreenshot).not.toHaveBeenCalled()

      const callArgs = mockScreenshotViewport.mock.calls[0][0]
      expect(callArgs.viewportHeight).toBe(800)
      expect(result).toEqual(['img1', 'img2', 'img3'])
    })

    it('multiPage 为 1 时也应调用 screenshotViewport', async () => {
      mockRun.mockResolvedValue(['img1'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: 1 }
      await renderCallback!(options)

      expect(mockScreenshotViewport).toHaveBeenCalledTimes(1)
      expect(mockScreenshot).not.toHaveBeenCalled()

      const callArgs = mockScreenshotViewport.mock.calls[0][0]
      expect(callArgs.viewportHeight).toBe(1)
    })

    it('multiPage 为大数值时也应正确传递 viewportHeight', async () => {
      mockRun.mockResolvedValue(['img1'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: 5000 }
      await renderCallback!(options)

      const callArgs = mockScreenshotViewport.mock.calls[0][0]
      expect(callArgs.viewportHeight).toBe(5000)
    })
  })

  describe('参数透传', () => {
    it('应该将 encoding 设置为 base64', async () => {
      const options = { file: 'test.html' } as any
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.encoding).toBe('base64')
    })

    it('screenshotViewport 应透传其他参数', async () => {
      mockRun.mockResolvedValue(['img1'])
      const options = {
        file: 'test.html',
        encoding: 'base64',
        multiPage: 2000,
        selector: '#app',
        type: 'png',
        quality: 80,
      }
      await renderCallback!(options)

      const callArgs = mockScreenshotViewport.mock.calls[0][0]
      expect(callArgs.file).toBe('test.html')
      expect(callArgs.selector).toBe('#app')
      expect(callArgs.type).toBe('png')
      expect(callArgs.quality).toBe(80)
      expect(callArgs.viewportHeight).toBe(2000)
    })

    it('screenshot 应透传其他参数', async () => {
      const options = {
        file: 'test.html',
        encoding: 'base64',
        selector: 'body',
        type: 'jpeg',
        quality: 90,
      }
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.file).toBe('test.html')
      expect(callArgs.selector).toBe('body')
      expect(callArgs.type).toBe('jpeg')
      expect(callArgs.quality).toBe(90)
    })
  })

  describe('Linux 超时修复', () => {
    const originalPlatform = process.platform

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    it('在 Linux 上 pageGotoParams.timeout 为 0 时应设置为 30000', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      const options = { file: 'test.html', encoding: 'base64', pageGotoParams: { timeout: 0 } }
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.pageGotoParams.timeout).toBe(30000)
    })

    it('在 Linux 上 pageGotoParams.timeout 为负数时应设置为 30000', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      const options = { file: 'test.html', encoding: 'base64', pageGotoParams: { timeout: -1 } }
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.pageGotoParams.timeout).toBe(30000)
    })

    it('在 Linux 上 pageGotoParams.timeout 为正数时不应修改', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      const options = { file: 'test.html', encoding: 'base64', pageGotoParams: { timeout: 5000 } }
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.pageGotoParams.timeout).toBe(5000)
    })

    it('在非 Linux 上 pageGotoParams.timeout 为 0 时不应修改', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      const options = { file: 'test.html', encoding: 'base64', pageGotoParams: { timeout: 0 } }
      await renderCallback!(options)

      const callArgs = mockScreenshot.mock.calls[0][0]
      expect(callArgs.pageGotoParams.timeout).toBe(0)
    })

    it('无 pageGotoParams 时不应报错', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      const options = { file: 'test.html', encoding: 'base64' }
      await renderCallback!(options)

      expect(mockScreenshot).toHaveBeenCalledTimes(1)
    })
  })

  describe('返回值', () => {
    it('普通截图应返回单个结果', async () => {
      mockRun.mockResolvedValue('single-image-base64')
      const options = { file: 'test.html', encoding: 'base64' }
      const result = await renderCallback!(options)

      expect(result).toBe('single-image-base64')
    })

    it('分片截图应返回数组', async () => {
      mockRun.mockResolvedValue(['img1', 'img2'])
      const options = { file: 'test.html', encoding: 'base64', multiPage: true }
      const result = await renderCallback!(options)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })
  })
})
