import path from 'node:path'
import { snapka } from '@snapka/puppeteer'
import { logger, registerRender, renderTpl, karin, type Snapka } from 'node-karin'
import { pluginName, pluginVersion, getConfig, HMR_KEY, resolveVersion } from './config'
import { formatBytes, getScreenshotByteSize } from './utils'

const main = async () => {
  logger.info(`[${pluginName}] 正在加载配置...`)
  const config = getConfig()
  logger.info(`[${pluginName}] 配置加载完成: protocol=${config.protocol} headless=${config.headless} maxPages=${config.maxOpenPages}`)

  if (config.download?.version) {
    try {
      logger.info(`[${pluginName}] 开始解析浏览器版本: ${config.download.version}`)
      const resolvedVersion = await resolveVersion(config.download.version)
      if (resolvedVersion !== config.download.version) {
        logger.info(`[${pluginName}] 浏览器版本已解析: ${config.download.version} -> ${resolvedVersion}`)
        config.download.version = resolvedVersion
      }
    } catch (err) {
      logger.info(`[${pluginName}] 版本解析失败，将使用配置的版本: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  logger.info(`[${pluginName}] 正在启动浏览器... (browser=${config.download?.browser ?? 'unknown'} version=${config.download?.version ?? 'unknown'})`)
  const launchStart = Date.now()
  const browser = await snapka.launch(config)
  logger.info(`[${pluginName}] 浏览器启动完成 (${Date.now() - launchStart}ms)`)

  karin.on(HMR_KEY, async () => {
    logger.info(`[${pluginName}] 检测到配置热更新，正在重启浏览器...`)
    await browser.restart()
    logger.info(`[${pluginName}] 浏览器重启完成`)
  })

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
