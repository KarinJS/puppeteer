import { main } from '../src/main/index' // 在正式编写这里无需这里

import fs from 'node:fs'
import crypto from 'node:crypto'
import EventEmitter from 'node:events'
import { WebSocketServer, type WebSocket } from 'ws'

/** echo 用于传递唯一标识符 */
let index = 0
const event = new EventEmitter()

/**
 * 运行
 * @param port - 端口
 * @param host - 主机
 */
async function run (port: number, host: string) {
  await main() // 在正式编写这里无需这里
  const server = new WebSocketServer({ port, host })

  // 监听新连接
  server.on('connection', (socket, requst) => {
    // 鉴权
    if (!auth(requst.headers.authorization)) {
      // 发一个鉴权错误给客户端
      socket.send(JSON.stringify({
        type: 'request',
        action: 'auth',
        params: {
          status: 'failed',
          message: 'auth failed'
        }
      }))

      // 关闭连接
      socket.close()
      return
    }

    socket.on('error', (error) => {
      console.error(error)
    })

    socket.on('close', () => {
      console.log(`ws server closed: ${requst.url}`)
    })

    socket.on('message', async (message) => {
      const raw = message.toString()
      const options = JSON.parse(raw) || {}
      if (options.type === 'response' && options.echo) {
        event.emit(options.echo, options)
        return
      }

      console.error(`[WebSocket][server] 未知消息: ${raw}`)
    })

    // 监听控制台
    listenConsole(socket)
    console.log(`ws server connected: ${requst.url} 请在控制台输入截图地址开始测试吧`)
  })
}

/**
 * 鉴权方法
 * @param authorization - 头部的鉴权密钥
 * @description authorization的值为 `Bearer ${sha256(token)}`
 * @example
 * // 头部参数 这部分固定的
 * ```json
 *{
 *  "x-client-name": "puppeteer-server",
 *  "x-client-version": "1.0.0",
 *  "authorization": `Bearer token`
 * }
 * ```
 */
function auth (authorization?: string) {
  /** 假设我们的ws鉴权token是puppeteer */
  const serverToken = 'puppeteer'

  /** 这里其实可以进一步校验`name`、`version` */
  if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    console.error('[WebSocket][server] 鉴权失败: authorization参数错误')
    return false
  }

  /** 对我们自己的token进行加密计算 */
  const serverHash = `Bearer ${crypto.createHash('sha256').update(serverToken).digest('hex')}`
  if (serverHash !== authorization) {
    console.error(`[WebSocket][server] 鉴权失败: token错误 ${authorization}`)
    return false
  }

  /** 一样的说明通过啦 */
  return true
}

/**
 * 封装一个发送消息的方法
 */
async function sendRequest<T> (
  socket: WebSocket,
  action: string,
  params: T,
  timeout: number = 30 * 1000
): Promise<any> {
  /** 生成唯一标识符 */
  const echo = ++index + ''
  /** 固定参数 */
  const type = 'request'

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      event.off(echo, result)
      reject(new Error(`[WebSocket][client] 请求超时: ${timeout}ms`))
    }, timeout)

    const result = (data: any) => { // 懒得写类型了 你自己写吧
      clearTimeout(timer)
      if (data.status === 'ok') {
        resolve(data.data) // 我们直接返回截图结果
      } else {
        reject(new Error(`[WebSocket][client] 请求失败: ${data.message}`, { cause: data }))
      }
    }

    // 注意别用on 不然会一直挂在后台...
    event.once(echo, result)
    socket.send(JSON.stringify({ type, action, params, echo }))
  })
}

/**
 * 监听控制台
 */
async function listenConsole (socket: WebSocket) {
  process.stdin.on('data', async (data) => {
    const message = data.toString().trim()
    if (!message) {
      console.log('请输入正确的截图地址 支持file:// http://')
      return
    }

    if (message === 'exit') {
      process.exit(0)
    }

    try {
      /**
       * 需要特别声明的是 binary格式的返回值为Uint8Array 而不是以前版本的Buffer
       */
      const result = await sendRequest(socket, 'screenshot', {
        file: message,
        type: 'png', // 截图类型 `jpeg` | `png` | `webp`
        quality: 100, // 截图质量 type为png时无效`(不要传)` 0-100
        retry: 1, // 重试次数 可以不给
        file_name: 'test.html', // 可以不给
        encoding: 'base64', // 截图后的图片编码 `binary` | `base64`
        pageGotoParams: {
          waitUntil: 'networkidle0' // 等待网络请求为0时才算加载完毕
        }
        // 这里的更多参数请自己看README.md
      })

      // sendRequest函数返回的是截图结果，如果中途出现错误 会直接抛出错误 所以能走到这里说明一定是成功的
      fs.writeFileSync('test.png', Buffer.from(result, 'base64'))
      // 如果你是`binary` 这里则是 fs.writeFileSync('test.png', Buffer.from(result))
      console.log('截图成功')
    } catch (error) {
      console.error(error)
    }
  })
}

// 这里是入口 启动成功之后你就可以打开webui来配置链接了
run(3333, '0.0.0.0')
