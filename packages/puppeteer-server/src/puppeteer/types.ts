import type { screenshot } from '@karinjs/puppeteer-core'

/**
 * 截图参数
 */
export interface ScreenshotOptions extends screenshot {
  /** 组件类型 默认`html` */
  components?: 'vue' | 'html'
  /** 组件数据 */
  data?: Record<string, any>
  /** 源file 此参数为内部使用 传参无效 */
  srcFile?: string
}
