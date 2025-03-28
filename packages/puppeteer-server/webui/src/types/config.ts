/**
 * 浏览器配置
 */
export interface BrowserConfig {
  downloadBrowser: 'chrome' | 'chrome-headless-shell'
  debug: boolean
  maxPages: number
  idleTime: number
  hmr: boolean
  headless: boolean
  executablePath: string | null
  userDataDir: string
  protocol: 'cdp' | 'webDriverBiDi'
  args: string[]
  defaultViewport: {
    width: number
    height: number
  }
}

/**
 * HTTP服务配置
 */
export interface HttpConfig {
  host: string
  port: number
  token: string | null
  limit: string
  screenshot: boolean
  upload: number
}

/**
 * WebSocket服务器配置
 */
export interface WsServerConfig {
  enable: boolean
  path: string
  token: string | null
  timeout: number | null
}

/**
 * WebSocket客户端配置
 */
export interface WsClientConfig {
  enable: boolean
  url: string
  heartbeatTime: number | null
  reconnectionTime: number | null
  authorization: string | null
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark'
}

/**
 * 环境变量
 */
export interface EnvVariable {
  key: string
  value: string | null
}

/**
 * 完整配置
 */
export interface Config {
  browser: BrowserConfig
  http: HttpConfig
  ws_server: WsServerConfig
  ws_client: WsClientConfig[]
  logger: LoggerConfig
  env: EnvVariable[]
}
