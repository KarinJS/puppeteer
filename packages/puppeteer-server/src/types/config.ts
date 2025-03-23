import type { LaunchOptions } from '@karinjs/puppeteer'

/**
 * 配置文件类型
 */
export interface Config {
  /** 浏览器配置 */
  browser: LaunchOptions
  /** http配置 */
  http: {
    /** 主机 */
    host: string
    /** 端口 */
    port: number
    /** webui密钥 */
    token?: string
    /** json中间件限制 默认`50mb` */
    limit: string
    /** 上传文件大小限制 默认`50mb` */
    upload?: number
    /** 启用截图相关的api 关闭后仅支持webui */
    screenshot: boolean
  },
  /** ws_server配置 */
  ws_server: {
    /** 是否启用 */
    enable: boolean
    /** 路径 默认`/` */
    path: string
    /** 请求超时事件 */
    timeout?: number
    /** 密钥 */
    token?: string
  },
  ws_client: {
    /** 是否启用 */
    enable: boolean
    /** 链接地址 */
    url: string
    /** 心跳时间 单位: 毫秒 默认`30 * 1000` */
    heartbeatTime?: number
    /** 重连时间 单位: 毫秒 默认`5 * 1000` */
    reconnectionTime?: number
    /** 鉴权密钥 - 明文 */
    authorization?: string
  }[],
  logger: {
    /** 日志级别 */
    level: string
  },
  /** 环境变量 */
  env: Record<string, string | undefined | null>
}

/**
 * 调用次数配置文件类型
 */
export interface CountConfig {
  /** 截图次数 */
  count: number
  /** 启动次数 */
  start: number
  /** 生成视频次数 */
  video: number
  /** ws_client 连接次数 */
  ws_client: number
  /** ws_server 连接次数 */
  ws_server: number
  /** http调用次数 仅统计截图相关 */
  http: number
  /** 上传文件次数 */
  upload: number
}
