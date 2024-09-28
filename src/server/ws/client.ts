import WebSocket from 'ws'
import crypto from 'crypto'
import { common, config, logger } from '@/utils'
import { Action } from '@/types/client'
import { puppeteer } from '@/puppeteer'

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
      authorization: crypto.createHash('sha256').update(`Bearer ${token}`).digest('hex')
    }
  })

  const send = (echo: string, data: any, status = true) => client.send(JSON.stringify({ echo, type: 'response', status: status ? 'ok' : 'error', data }))

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
          const result = await puppeteer.screenshot(data)
          send(echo, result)
          return common.log(result, data.file, start)
        } catch (error) {
          logger.error(`[WebSocket][client][截图失败]: ${error}`)
          return send(echo, { error }, false)
        }
      }
      default:
        return send(echo, { error: '未知的action' })
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
