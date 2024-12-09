import { config } from '@/utils'
import { Puppeteer } from '@karinjs/puppeteer-core'
/**
 * 浏览器实例
 */
export const puppeteer = await new Puppeteer({
  args: config.args,
  browserCount: config.browserCount,
  chrome: config.headless ? 'chrome-headless-shell' : 'chrome',
}).init()
