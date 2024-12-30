import path from 'node:path'
import { config } from '@/utils'
import { Puppeteer, screenshot as Screenshot } from '@karinjs/puppeteer-core'
import { vueToHtml } from '@/ssr'

/**
 * 浏览器实例
 */
export const puppeteer = await new Puppeteer({
  ...config,
  chrome: config.headless ? 'chrome-headless-shell' : 'chrome',
}).init()

/**
 * 截图
 * @param options 截图参数
 */
export const screenshot = async (options: Screenshot & { data?: Record<string, any> }) => {
  // 检查是否为.vue组件
  if (path.extname(options.file) === '.vue') {
    options.file = await vueToHtml(options.file, options.data || {})
    options.selector = '#app'
    delete options.data
  }

  return puppeteer.screenshot(options)
}
