import path from 'node:path'
import { launch, type LaunchOptions } from '@karinjs/puppeteer'
import { logger, registerRender, renderTpl, karin, type Snapka } from 'node-karin'
import { pluginName, pluginVersion, getConfig, HMR_KEY } from './config'

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
    logger.info(`[${name}][${path.basename(data.file)}] 截图完成 耗时: ${logger.green(Date.now() - time + '')} ms`)
    return result.data as any
  })

  logger.info(`${logger.violet(`[插件:${pluginVersion}]`)} ${logger.green(pluginName)} 初始化完成~`)
}

main()
