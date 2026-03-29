import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// node-karin 和 node-karin/root 已经在 vitest.config.ts 中通过 alias 被 mock

describe('config', () => {
  const tmpDir = path.resolve(import.meta.dirname, '../../.tmp-test-config')
  let configModule: typeof import('./index')

  beforeEach(async () => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    fs.mkdirSync(tmpDir, { recursive: true })

    // 重新 mock basePath 指向临时目录
    vi.doMock('node-karin/root', () => ({
      basePath: tmpDir,
    }))

    vi.resetModules()
    configModule = await import('./index')
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    vi.restoreAllMocks()
  })

  it('应该导出插件名称和版本', () => {
    expect(configModule.pluginName).toBeTruthy()
    expect(configModule.pluginVersion).toBeTruthy()
    expect(configModule.pluginName).toContain('karinjs')
  })

  it('应该导出 HMR_KEY', () => {
    expect(configModule.HMR_KEY).toBe('karin-plugin-puppeteer-hmr')
  })

  it('应该导出环境变量名称常量', () => {
    expect(configModule.ENV_CHROME_MIRROR).toBe('PUPPETEER_CHROME_MIRROR')
    expect(configModule.ENV_DOWNLOAD_BASE_URL).toBe('PUPPETEER_DOWNLOAD_BASE_URL')
  })

  it('应该导出默认版本解析 API 列表', () => {
    expect(configModule.VERSION_API_URLS).toBeInstanceOf(Array)
    expect(configModule.VERSION_API_URLS.length).toBeGreaterThan(0)
    expect(configModule.VERSION_API_URLS).toContain('https://mirror.karinjs.com')
    expect(configModule.VERSION_API_URLS).toContain('https://googlechromelabs.github.io')
  })

  it('getConfig 应该返回包含默认值的配置', () => {
    const config = configModule.getConfig()
    expect(config.protocol).toBe('cdp')
    expect(config.headless).toBe('shell')
    expect(config.debug).toBe(false)
    expect(config.findBrowser).toBe(true)
    expect(config.maxOpenPages).toBe(10)
    expect(config.pageMode).toBe('reuse')
    expect(config.pageIdleTimeout).toBe(60000)
    expect(config.defaultViewport).toEqual({ width: 800, height: 600 })
    expect(config.download).toEqual({
      enable: true,
      browser: 'chrome-headless-shell',
      version: 'latest',
    })
    expect(config.args).toBeInstanceOf(Array)
    expect(config.args!.length).toBeGreaterThan(0)
  })

  it('getConfig 应该使用 PUPPETEER_DOWNLOAD_BASE_URL 环境变量覆盖 download.baseUrl', () => {
    process.env.PUPPETEER_DOWNLOAD_BASE_URL = 'https://custom-mirror.example.com'
    try {
      const config = configModule.getConfig()
      expect(config.download?.baseUrl).toBe('https://custom-mirror.example.com')
    } finally {
      delete process.env.PUPPETEER_DOWNLOAD_BASE_URL
    }
  })

  it('getConfig 在未设置环境变量时不应覆盖 download.baseUrl', () => {
    delete process.env.PUPPETEER_DOWNLOAD_BASE_URL
    const config = configModule.getConfig()
    expect(config.download?.baseUrl).toBeUndefined()
  })

  it('saveConfig 应该保存并可重新读取配置', async () => {
    const { karin } = await import('node-karin')

    const newConfig = {
      ...configModule.getConfig(),
      maxOpenPages: 20,
      debug: true,
    }

    configModule.saveConfig(newConfig)

    const loaded = configModule.getConfig()
    expect(loaded.maxOpenPages).toBe(20)
    expect(loaded.debug).toBe(true)
    expect(karin.emit).toHaveBeenCalledWith(configModule.HMR_KEY, newConfig)
  })

  it('saveConfig 应该在配置 JSON 中正确持久化', () => {
    configModule.saveConfig({
      ...configModule.getConfig(),
      slowMo: 500,
    })

    const raw = fs.readFileSync(configModule.configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.slowMo).toBe(500)
  })
})

describe('resolveVersionFromMirror', () => {
  let configModule: typeof import('./index')
  const tmpDir = path.resolve(import.meta.dirname, '../../.tmp-test-resolve')

  beforeEach(async () => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    fs.mkdirSync(tmpDir, { recursive: true })

    vi.doMock('node-karin/root', () => ({
      basePath: tmpDir,
    }))

    vi.resetModules()
    configModule = await import('./index')
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    vi.restoreAllMocks()
  })

  it('应该直接返回具体版本号（不是通道名称）', async () => {
    const result = await configModule.resolveVersionFromMirror('120.0.6099.109', 'https://mirror.example.com')
    expect(result).toBe('120.0.6099.109')
  })

  it('应该直接返回未知的版本字符串', async () => {
    const result = await configModule.resolveVersionFromMirror('120', 'https://mirror.example.com')
    expect(result).toBe('120')
  })

  it('应该从镜像解析 stable 通道版本', async () => {
    const mockResponse = {
      channels: {
        Stable: { version: '120.0.6099.109' },
        Beta: { version: '121.0.6100.0' },
        Dev: { version: '122.0.6200.0' },
        Canary: { version: '123.0.6300.0' },
      }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const result = await configModule.resolveVersionFromMirror('stable', 'https://mirror.example.com')
    expect(result).toBe('120.0.6099.109')
    expect(fetch).toHaveBeenCalledWith('https://mirror.example.com/chrome-for-testing/last-known-good-versions.json')
  })

  it('应该从镜像解析 latest 通道版本（映射到 Canary）', async () => {
    const mockResponse = {
      channels: {
        Canary: { version: '123.0.6300.0' },
      }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const result = await configModule.resolveVersionFromMirror('latest', 'https://mirror.example.com')
    expect(result).toBe('123.0.6300.0')
  })

  it('应该从镜像解析 beta 通道版本', async () => {
    const mockResponse = {
      channels: {
        Beta: { version: '121.0.6100.0' },
      }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const result = await configModule.resolveVersionFromMirror('beta', 'https://mirror.example.com')
    expect(result).toBe('121.0.6100.0')
  })

  it('应该去除镜像 URL 末尾的斜杠', async () => {
    const mockResponse = {
      channels: { Stable: { version: '120.0.6099.109' } }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    await configModule.resolveVersionFromMirror('stable', 'https://mirror.example.com/')
    expect(fetch).toHaveBeenCalledWith('https://mirror.example.com/chrome-for-testing/last-known-good-versions.json')
  })

  it('镜像返回非 200 状态码时应抛出错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }))

    await expect(
      configModule.resolveVersionFromMirror('stable', 'https://mirror.example.com')
    ).rejects.toThrow('Failed to fetch version info from mirror')
  })

  it('镜像响应中缺少通道信息时应抛出错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ channels: {} }),
    }))

    await expect(
      configModule.resolveVersionFromMirror('stable', 'https://mirror.example.com')
    ).rejects.toThrow('Channel "Stable" not found in mirror response')
  })
})

describe('resolveVersion', () => {
  let configModule: typeof import('./index')
  const tmpDir = path.resolve(import.meta.dirname, '../../.tmp-test-version')

  beforeEach(async () => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    fs.mkdirSync(tmpDir, { recursive: true })

    vi.doMock('node-karin/root', () => ({
      basePath: tmpDir,
    }))

    vi.resetModules()
    configModule = await import('./index')
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
    delete process.env.PUPPETEER_CHROME_MIRROR
    vi.restoreAllMocks()
  })

  it('具体版本号应直接返回，不发起请求', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const result = await configModule.resolveVersion('120.0.6099.109')
    expect(result).toBe('120.0.6099.109')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('设置环境变量时应直接使用该镜像，不走探针', async () => {
    process.env.PUPPETEER_CHROME_MIRROR = 'https://my-mirror.example.com'
    const mockResponse = {
      channels: { Stable: { version: '120.0.6099.109' } }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const result = await configModule.resolveVersion('stable')
    expect(result).toBe('120.0.6099.109')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('https://my-mirror.example.com/chrome-for-testing/last-known-good-versions.json')
  })

  it('未设置环境变量时应使用探针竞速多个 API', async () => {
    delete process.env.PUPPETEER_CHROME_MIRROR
    const mockResponse = {
      channels: { Stable: { version: '120.0.6099.109' } }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const result = await configModule.resolveVersion('stable')
    expect(result).toBe('120.0.6099.109')
  })

  it('探针中第一个失败时应使用第二个的结果', async () => {
    delete process.env.PUPPETEER_CHROME_MIRROR
    const mockResponse = {
      channels: { Stable: { version: '120.0.6099.109' } }
    }

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 500, statusText: 'Error' })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    }))

    const result = await configModule.resolveVersion('stable')
    expect(result).toBe('120.0.6099.109')
  })

  it('所有探针都失败时应抛出 AggregateError', async () => {
    delete process.env.PUPPETEER_CHROME_MIRROR

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }))

    await expect(configModule.resolveVersion('stable')).rejects.toThrow()
  })
})
