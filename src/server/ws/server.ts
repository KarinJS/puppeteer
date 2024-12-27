import path from 'node:path'
import crypto from 'node:crypto'
import type WebSocket from 'ws'
import { server } from '../express'
import { WebSocketServer } from 'ws'
import { screenshot } from '@/puppeteer'
import { Action } from '@/types/client'
import { lookup } from 'mime-types'
import Puppeteer from '@karinjs/puppeteer-core'
import { auth, common, config, logger } from '@/utils'
import { wsErrRes, wsSuccRes } from '@/utils/response'

/**
 * WebSocket实例缓存
 */
const wsMap = new Map<string, WebSocket>()

export const Server = () => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (server, request) => {
    /** 检查path */
    if (request.url !== config.ws.path) {
      logger.error(`[WebSocket][server][路径错误]: ${request.socket.remoteAddress}`)
      wsErrRes(server, 'auth', { message: '错误的path' })
      return server.close()
    }

    /** 鉴权 */
    const authorization = request.headers.authorization
    if (!auth('ws', request.socket.remoteAddress, authorization)) {
      logger.error(`[WebSocket][server][鉴权失败]: ${request.socket.remoteAddress}`)
      wsErrRes(server, 'auth', { message: '鉴权失败' })
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

    /** 缓存 */
    const id = crypto.randomBytes(16).toString('hex')
    wsMap.set(id, server)

    setInterval(() => server.ping(), 10000)
    logger.mark(`[WebSocket][server][连接成功]: ${request.socket.remoteAddress}`)

    // 判断是否为127.0.0.1的ip
    const render = (request.socket.remoteAddress === '::1' || request.socket.remoteAddress === '127.0.0.1')
      /** 本地ip */
      ? async (data: any) => {
        const result = await screenshot(data)
        return result
      }
      /** 强制性等待并且劫持请求通过ws进行交互 */
      : async (data: any) => {
        data.pageGotoParams = data.pageGotoParams || {}
        data.pageGotoParams.waitUntil = 'networkidle2'
        const result = await screenshot({ ...data, setRequestInterception })
        return result
      }

    server.on('message', async (event) => {
      const raw = event.toString()
      const { echo, action, data, status } = JSON.parse(raw)
      if (action !== Action.static) {
        logger.info(`[WebSocket][server][收到消息][ip: ${request.socket.remoteAddress}]: ${raw}`)
      }

      switch (action) {
        /** 截图 */
        case Action.render: {
          try {
            const start = Date.now()
            /** http */
            if (data.file.startsWith('http')) {
              const result = await screenshot(data)
              wsSuccRes(server, echo, result, data.encoding, data.multiPage)
              return common.log(result, data.file, start)
            }

            const result = await render(data)
            wsSuccRes(server, echo, result, data.encoding, data.multiPage)
            return common.log(result, data.file, start)
          } catch (error) {
            return wsErrRes(server, echo, error)
          }
        }
        /** 静态资源响应 */
        case Action.static: {
          if (status === 'error') throw new Error(data)
          server.emit(echo, { data: Buffer.from(data), status })
          return
        }
        default:
          return wsErrRes(server, echo, { message: '未知的请求类型' })
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
