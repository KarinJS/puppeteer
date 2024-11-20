import { type Puppeteer } from '@karinjs/puppeteer-core'
import { type RenderResult, type screenshot } from '@karinjs/puppeteer-core/lib/puppeteer/core'

/**
 * ws交互Api
 */
export const enum Action {
  /** 渲染 */
  render = 'render',
  /** 主动请求发起方发送静态资源 */
  static = 'static',
  /** 返回响应给请求方 */
  response = 'response',
  /** 服务端主动关闭连接 */
  close = 'close',
}

/**
 * 每个API对应的请求参数和响应类型
 */
export interface ApiMap {
  [Action.render]: {
    params: Parameters<Puppeteer['screenshot']>[0],
    result: RenderResult<screenshot>,
  },
  [Action.static]: {
    params: { file: string, url: string },
    result: Buffer,
  },
}
