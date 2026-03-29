import path from 'node:path'
import { snapka } from '@snapka/puppeteer'
import { logger, registerRender, renderTpl, karin, type Snapka } from 'node-karin'
import { pluginName, pluginVersion, getConfig, HMR_KEY, resolveVersion } from './config'
import { formatBytes, getScreenshotByteSize } from './utils'

const main = async () => {
  const config = getConfig()

  if (config.download?.version) {
    try {
      const resolvedVersion = await resolveVersion(config.download.version)
      if (resolvedVersion !== config.download.version) {
        logger.info(`[${pluginName}] 解析浏览器版本: ${config.download.version} -> ${resolvedVersion}`)
        config.download.version = resolvedVersion
      }
    } catch (err) {
      logger.info(`[${pluginName}] 版本解析失败，使用默认方式: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const browser = await snapka.launch(config)
  karin.on(HMR_KEY, async () => await browser.restart())

  const name = '@karinjs/plugin-puppeteer'
  registerRender(name, async (options: Snapka) => {
    options.encoding = 'base64'
    const data = renderTpl(options)
    data.encoding = options.encoding

    if (process.platform === 'linux' && typeof data.pageGotoParams?.timeout === 'number' && data.pageGotoParams.timeout <= 0) {
      data.pageGotoParams.timeout = 30000
    }

    const time = Date.now()
    const useMultiPage = data.multiPage === true || (typeof data.multiPage === 'number' && data.multiPage > 0)
    const { run } = useMultiPage
      ? await browser.screenshotViewport({
        ...data,
        viewportHeight: typeof data.multiPage === 'number' ? data.multiPage : 0,
      } as any)
      : await browser.screenshot(data as any)
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
