import crypto from 'crypto'
import type WebSocket from 'ws'
import { server } from '../express'
import { WebSocketServer } from 'ws'
import { puppeteer } from '@/puppeteer'
import { common, config, logger } from '@/utils'
import { Action } from '@/types/client'
import { lookup } from 'mime-types'
import Puppeteer from '@karinjs/puppeteer-core'
import path from 'path'

/**
 * WebSocket实例缓存
 */
const wsMap = new Map<string, WebSocket>()

export const Server = () => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (server, request) => {
    const send = (echo: string, data: any, status = true) => server.send(JSON.stringify({ echo, type: 'response', status: status ? 'ok' : 'error', data }))

    /** 检查path */
    if (request.url !== config.ws.path) {
      logger.error(`[WebSocket][server][路径错误]: ${request.socket.remoteAddress}`)
      send('auth', { error: '错误的path' }, false)
      return server.close()
    }

    const SendApi = (file: string, type: string, url: string): Promise<Buffer> => {
      const echo = crypto.randomUUID({ disableEntropyCache: true })
      const action = Action.static
      const data = { file, type, url }
      const params = JSON.stringify({ echo, action, data })
      return new Promise((resolve) => {
        server.send(params)
        server.once(echo, ({ data, status }) => {
          if (status === 'error') {
            logger.error(`[WebSocket][server][静态资源请求失败]: ${url}`)
            return resolve(Buffer.from(''))
          }
          resolve(data)
        })
      })
    }

    const setRequestInterception: Parameters<Puppeteer['screenshot']>[0]['setRequestInterception'] = async (request, data) => {
      const type = request.resourceType()

      const typeMap = {
        image: 'image/png',
        font: 'font/woff2',
        stylesheet: 'text/css',
        document: 'text/html',
        script: 'text/javascript',
      } as const

      const file = path.dirname(data.file).replace('file://', '')
      const handleRequest = async (type: keyof typeof typeMap) => {
        const actionPath = request.url()

        /** http */
        if (actionPath.startsWith('http')) return request.continue()

        const body = await SendApi(file, type, actionPath)
        const contentType = lookup(actionPath) || typeMap[type]
        request.respond({ status: 200, contentType, body })
      }

      switch (type) {
        case 'image':
        case 'font':
        case 'stylesheet':
        case 'document':
        case 'script':
          return await handleRequest(type)
        default:
          return request.continue()
      }
    }

    /** 鉴权 */
    const bearer = crypto.createHash('md5').update(`Bearer ${config.ws.token}`).digest('hex')
    const authorization = crypto.createHash('md5').update(`Bearer ${request.headers.authorization}`).digest('hex')
    if (authorization !== bearer) {
      logger.error(`[WebSocket][server][鉴权失败]: ${request.socket.remoteAddress} ${request.headers.authorization}`)
      send('auth', { error: '鉴权失败' }, false)
      return server.close()
    }

    /** 缓存 */
    const id = crypto.randomBytes(16).toString('hex')
    wsMap.set(id, server)

    setInterval(() => server.ping(), 10000)
    logger.mark(`[WebSocket][server][连接成功]: ${request.socket.remoteAddress}`)

    server.on('message', async (event) => {
      const raw = event.toString()
      logger.info(`[WebSocket][server][收到消息][ip: ${request.socket.remoteAddress}]: ${raw}`)
      const { echo, action, data, status } = JSON.parse(raw)

      switch (action) {
        /** 截图 */
        case Action.render: {
          try {
            /** 强制性等待 */
            data.pageGotoParams = data.pageGotoParams || {}
            data.pageGotoParams.waitUntil = 'networkidle2'

            const start = Date.now()
            const result = await puppeteer.screenshot({ ...data, setRequestInterception })
            send(echo, result)
            return common.log(result, data.file, start)
          } catch (error) {
            return send(echo, { error }, false)
          }
        }
        /** 静态资源响应 */
        case Action.static: {
          if (status === 'error') throw new Error(data)
          server.emit(echo, { data: Buffer.from(data), status })
          return
        }
        default:
          return send(echo, { error: '未知的action' })
      }
    })

    server.on('close', () => {
      logger.warn(`[WebSocket][server][连接关闭]: ${request.socket.remoteAddress}`)
      server.removeAllListeners()
      wsMap.delete(id)
    })

    server.on('error', (err) => logger.error(`[WebSocket][server][发生错误]: ${err}`))
  })

  logger.info(`[WebSocket][server][启动成功] 正在监听: ws://127.0.0.1:${config.http.port}${config.ws.path}`)
}

if (config.ws.enable) Server()
