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
