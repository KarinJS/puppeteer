import type { Page } from 'puppeteer-core'

/**
 * 设置视窗大小
 * @param page 页面实例
 * @param width 视窗宽度
 * @param height 视窗高度
 * @param deviceScaleFactor 设备像素比
 */
export const setViewport = async (
  page: Page,
  width?: number,
  height?: number,
  deviceScaleFactor?: number
) => {
  if (!width && !height && !deviceScaleFactor) return
  const setViewport = {
    width: Math.round(width || 800),
    height: Math.round(height || 600),
    deviceScaleFactor: Math.round(deviceScaleFactor || 1),
  }
  await page.setViewport(setViewport)
}
