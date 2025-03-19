import WebSocket from 'ws'
import crypto from 'crypto'
import { Action } from '@/types/client'
import { screenshot } from '@/puppeteer'
import { common, config, logger } from '@/utils'
import { wsErrRes, wsSuccRes } from '@/utils/response'

/**
 * ws客户端
 * @param url 连接地址
 * @param token 鉴权秘钥
 */
export const Client = (url: string, token: string) => {
  let init = false
  /** 是否已经发起重连 如果发起则不再发起 */
  let reconnect = false
  const client = new WebSocket(url, {
    headers: {
      authorization: crypto.createHash('md5').update(`Bearer ${token}`).digest('hex')
    }
  })

  client.on('open', () => {
    init = true
    logger.mark(`[WebSocket][client][连接成功]: ${url}`)
    /** 每10秒发送一次ping */
    setInterval(() => client.ping(), 10000)
  })

  client.on('message', async (event) => {
    const raw = event.toString()
    logger.info(`[WebSocket][client][收到消息]: ${raw}`)
    const { echo, action, data } = JSON.parse(raw)

    switch (action) {
      case Action.render: {
        try {
          const start = Date.now()
          const result = await screenshot(data)

          wsSuccRes(client, echo, result, data.encoding, data.multiPage)
          return common.log(result, data.file, start)
        } catch (error) {
          logger.error(`[WebSocket][client][截图失败]: ${error}`)
          return wsErrRes(client, echo, error)
        }
      }
      case Action.close:
        return logger.warn(`[WebSocket][client][服务端主动关闭连接]: ${url} message: ${data.message}`)
      default:
        return wsErrRes(client, echo, { message: '未知的请求类型' })
    }
  })

  client.on('close', () => {
    setTimeout(() => {
      if (reconnect) return
      logger.warn(`[WebSocket][client][连接关闭]: 5秒后将进行重连 ${url}`)
      reconnect = true
      client.removeAllListeners()
      Client(url, token)
    }, 5000)
  })

  client.on('error', (err) => {
    if (init) {
      logger.error(`[WebSocket][client][发生错误]: ${err}`)
    }
  })

  /** 5秒之后检查 如果没有连接上 则停止并重连 */
  setTimeout(() => {
    if (!init) {
      if (reconnect) return
      reconnect = true
      logger.error(`[WebSocket][client][连接无响应]: 5秒后将进行重连 ${url}`)
      client.removeAllListeners()
      Client(url, token)
    }
  }, 5000)
}

if (config.ws.enable) config.ws.list.forEach(({ url, token }) => Client(url, token))
