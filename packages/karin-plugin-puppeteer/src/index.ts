import path from 'node:path'
import { launch, type LaunchOptions } from '@karinjs/puppeteer'
import { logger, registerRender, renderTpl, karin, type Snapka } from 'node-karin'
import { pluginName, pluginVersion, getConfig, HMR_KEY } from './config'

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  if (!bytes || bytes < 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? Math.round(value) : value.toFixed(2)} ${units[i]}`
}

const getScreenshotByteSize = (payload: unknown, encoding?: string): number | undefined => {
  try {
    if (!payload) return undefined
    const enc = (encoding || '').toLowerCase()
    if (typeof payload === 'string') {
      return enc === 'base64' ? Buffer.from(payload, 'base64').length : Buffer.byteLength(payload)
    }
    if (Buffer.isBuffer(payload)) return payload.length
    const anyPayload = payload as any
    if (typeof anyPayload.data === 'string') {
      return enc === 'base64' ? Buffer.from(anyPayload.data, 'base64').length : Buffer.byteLength(anyPayload.data)
    }
    if (Buffer.isBuffer(anyPayload.buffer)) return anyPayload.buffer.length
    if (typeof anyPayload.byteLength === 'number') return anyPayload.byteLength
    return undefined
  } catch {
    return undefined
  }
}

const main = async () => {
  const config = getConfig()
  const browser = await launch(config)
  karin.on(HMR_KEY, (cfg: LaunchOptions) => browser.hmrConfig(cfg))

  const name = '@karinjs/plugin-puppeteer'
  registerRender(name, async (options: Snapka) => {
    options.encoding = 'base64'
    const data = renderTpl(options)
    const time = Date.now()
    const result = await browser.screenshot(data)

    const sizeBytes = getScreenshotByteSize(result.data, options.encoding)
    const sizeStr = sizeBytes != null ? `大小: ${logger.green(formatBytes(sizeBytes))} ` : ''
    logger.info(
      `[${name}][${path.basename(data.file)}] 截图完成 ${sizeStr}耗时: ${logger.green(Date.now() - time + '')} ms`
    )

    if (!result.status) {
      throw new Error(result.data.message || '截图失败', { cause: result.data })
    }
    return result.data as any
  })

  logger.info(`${logger.violet(`[插件:${pluginVersion}]`)} ${logger.green(pluginName)} 初始化完成~`)
}

main()

export { }
