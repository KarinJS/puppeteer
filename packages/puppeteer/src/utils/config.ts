import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export const file = path.join(process.cwd(), 'config.json')
export const logsDir = path.join(process.cwd(), 'logs/logger')

if (!fs.existsSync(path.dirname(logsDir))) fs.mkdirSync(path.dirname(logsDir), { recursive: true })

/** 如果不存在则创建 */
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({
    logLevel: 'info',
    headless: false,
    debug: false,
    maxPages: 15,
    http: {
      host: '0.0.0.0',
      port: 7005,
      token: '123456'
    },
    ws: {
      enable: true,
      token: '123456',
      path: '/ws',
      list: [
        {
          url: 'ws://127.0.0.1:7000/puppeteer',
          token: '123456'
        }
      ]
    },
    /** 浏览器启动数量 */
    browserCount: 1,
    /** 启动时 传递给浏览器的参数 */
    args: [
      '--enable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-zygote',
      '--disable-extensions',
      '--disable-dev-shm-usage',
    ]
  }, null, 2))
}

export const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf-8'))

export const config = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
  /** 日志级别 */
  logLevel: 'trace' | 'debug' | 'info' | 'mark' | 'warn' | 'error' | 'fatal'
  /** 是否启用纯无头 */
  headless: boolean
  /** debug模式 */
  debug: boolean
  /** 同时可存在多少个标签页进行工作 */
  maxPages: number
  /** 服务配置 */
  http: {
    /** 监听地址 */
    host: string
    /** 监听端口 */
    port: number
    /** 鉴权秘钥 */
    token: string
  }
  /** WebSocket配置 */
  ws: {
    /** 是否启用 */
    enable: boolean
    /** 鉴权秘钥 */
    token: string,
    /** WebSocket路径 */
    path: string
    /** karinWebSocket API连接列表(反向连接) */
    list: {
      /** WebSocket地址 */
      url: string
      /** 鉴权秘钥 */
      token: string
    }[]
  }
  /** 浏览器启动数量 */
  browserCount: number
  /** 启动时 传递给浏览器的参数 */
  args: string[]
}
