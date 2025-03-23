import { launch } from '@karinjs/puppeteer'
import type { LaunchOptions } from '@karinjs/puppeteer'

/**
 * 浏览器实例
 */
export let puppeteer: Awaited<ReturnType<typeof launch>>

/**
 * 创建浏览器实例
 * @param config 浏览器配置
 */
export const createPuppeteer = async (config: LaunchOptions = {}) => {
  puppeteer = await launch(config)
}

/**
 * 更新浏览器配置
 */
export const hmrConfig = async (config: LaunchOptions = {}) => {
  puppeteer.hmrConfig(config)
}
