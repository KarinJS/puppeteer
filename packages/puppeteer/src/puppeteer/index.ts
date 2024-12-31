import path from 'node:path'
import { config } from '@/utils'
import { vueToHtml } from '@/ssr'
import { Puppeteer } from '@karinjs/puppeteer-core'
import type { ScreenshotOptions } from './types'

/**
 * 浏览器实例
 */
export const puppeteer = await new Puppeteer({
  ...config,
  chrome: config.browser === 'chrome-headless-shell'
    ? 'chrome-headless-shell'
    : 'chrome',
}).init()

/**
 * 截图
 * @param options 截图参数
 */
export const screenshot = async (options: ScreenshotOptions) => {
  options.srcFile = options.file

  // 检查是否为.vue组件
  if (options.components === 'vue' || path.extname(options.file) === '.vue') {
    options.file = await vueToHtml(options.file, options.data || {})
    options.selector = '#app'
    delete options.data
  }

  return puppeteer.screenshot(options)
}
