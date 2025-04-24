import type { ScreenshotOptions } from '../../types/screenshot'
import type { ScreenshotOptions as ScreenshotOptionsCore } from 'puppeteer-core'

/**
 * 标准化截图参数
 * @param data 截图参数
 */
export const getScreenshotOptions = (
  data: ScreenshotOptions
): ScreenshotOptionsCore => {
  const options = {
    path: data.path,
    type: data.type || 'jpeg',
    quality: data.quality || (90 as number | undefined),
    fullPage: data.fullPage || false,
    optimizeForSpeed: data.optimizeForSpeed || false,
    encoding: data.encoding || 'binary',
    omitBackground: data.omitBackground || false,
    captureBeyondViewport: data.captureBeyondViewport || false,
  }

  /** PNG格式不支持quality选项 */
  if (options.quality && data.type === 'png') {
    options.quality = undefined
  }

  return options
}
