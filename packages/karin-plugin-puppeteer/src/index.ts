import path from 'node:path'
import { snapka } from '@snapka/puppeteer'
import { logger, registerRender, renderTpl, karin, type Snapka } from 'node-karin'
import { pluginName, pluginVersion, getConfig, HMR_KEY } from './config'

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  if (!bytes || bytes < 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? Math.round(value) : value.toFixed(2)} ${units[i]}`
}

const getScreenshotByteSize = (payload: unknown, encoding?: string): number | null => {
  try {
    if (payload == null) return null
    const enc = (encoding || '').toLowerCase()

    if (Array.isArray(payload)) {
      let total = 0
      for (const item of payload) {
        const size = getScreenshotByteSize(item, enc)
        if (typeof size === 'number') total += size
      }
      return total
    }

    if (typeof payload === 'string') {
      return enc === 'base64' ? Buffer.from(payload, 'base64').length : Buffer.byteLength(payload)
    }
    if (Buffer.isBuffer(payload)) return payload.length
    if (payload instanceof Uint8Array) return payload.byteLength
    if (payload instanceof ArrayBuffer) return payload.byteLength

    const anyPayload = payload as any
    if (typeof anyPayload.data === 'string') {
      return enc === 'base64' ? Buffer.from(anyPayload.data, 'base64').length : Buffer.byteLength(anyPayload.data)
    }
    if (Buffer.isBuffer(anyPayload.buffer)) return anyPayload.buffer.length
    if (anyPayload.buffer instanceof ArrayBuffer) return anyPayload.buffer.byteLength
    if (typeof anyPayload.byteLength === 'number') return anyPayload.byteLength
    if (typeof anyPayload.length === 'number') return anyPayload.length

    return null
  } catch {
    return null
  }
}

const main = async () => {
  const config = getConfig()
  const browser = await snapka.launch(config)
  karin.on(HMR_KEY, async () => {
    await browser.restart()
  })

  const name = '@karinjs/plugin-puppeteer'
  registerRender(name, async (options: Snapka) => {
    options.encoding = 'base64'
    const data = renderTpl(options)
    data.encoding = options.encoding

    const time = Date.now()
    const { run } = await browser.screenshot(data as any)
    const result = await run()

    const fileName = typeof data?.file === 'string' ? path.basename(data.file) : 'unknown'

    const sizeBytes = getScreenshotByteSize(result, options.encoding)
    const sizeStr = typeof sizeBytes === 'number' ? `大小: ${logger.green(formatBytes(sizeBytes))} ` : ''

    logger.info(
      `[${name}][${fileName}] 截图完成 ${sizeStr}耗时: ${logger.green(Date.now() - time + '')} ms`
    )

    return result as any
  })

  logger.info(`${logger.violet(`[插件:${pluginVersion}]`)} ${logger.green(pluginName)} 初始化完成~`)
}

main()

export * from '@snapka/puppeteer'
