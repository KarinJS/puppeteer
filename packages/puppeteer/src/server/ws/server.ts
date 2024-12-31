import path from 'node:path'
import crypto from 'node:crypto'
import type WebSocket from 'ws'
import { server } from '../express'
import { WebSocketServer } from 'ws'
import { screenshot } from '@/puppeteer'
import { Action } from '@/types/client'
import { lookup } from 'mime-types'
import { auth, common, config, logger } from '@/utils'
import { wsErrRes, wsSuccRes } from '@/utils/response'
import { cacheHtml, delHtml, getHtml } from './static'
import Puppeteer, { common as Common } from '@karinjs/puppeteer-core'

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
    /**
     * 客户端来源
     * - `local`: 本地
     * - `remote`: 远程
     */
    const origin: 'local' | 'remote' = request.headers?.['x-client-origin'] as 'local' | 'remote' || (request.headers.host?.includes('127.0.0.1') ? 'local' : 'remote')

    if (!auth('ws', request.socket.remoteAddress, authorization)) {
      logger.error(`[WebSocket][server][鉴权失败]: ${request.socket.remoteAddress}`)
      wsErrRes(server, 'auth', { message: '鉴权失败' })
      return server.close()
    }

    const SendApi = (file: string, type: string, url: string) => {
      const echo = crypto.randomUUID({ disableEntropyCache: true })
      const action = Action.static
      const data = { file, type, url }
      const params = JSON.stringify({ echo, action, data })
      server.send(params)
      return echo
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

      /**
       * 如果是远程请求 这里是虚拟路径
       * - `linux`: `file:///root/uuid`
       * - `windows`: `file:///C:/uuid`
       */
      const requestFile = data.file
      /**
       * 请求的文件
       * - 如果是构建的虚拟路径则替换为真实路径
       * - 这里存在虚拟路径的原因是跨平台下，`linux`不能访问`windows`的文件路径
       */
      const file = requestFile.startsWith('file:///C:/uuid') || requestFile.startsWith('file:///root/uuid')
        ? getHtml(data.file) // 获取html真实路径
        : path.dirname(data.file).replace('file://', '') // 真实路径

      const handleRequest = async (type: keyof typeof typeMap) => {
        /** 命中文件进行替换 */
        const actionPath = request.url() === requestFile ? file : request.url()

        /** http */
        if (actionPath.startsWith('http')) return request.continue()

        const echo = SendApi(requestFile, type, actionPath)
        const contentType = lookup(actionPath) || typeMap[type]

        const { status, data } = await new Promise<{
          status: boolean,
          data: Buffer
        }>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('请求超时'))
          }, 20000)

          Common.once(echo, ({ status, data }) => {
            clearTimeout(timer)
            resolve({ status, data })
          })
        })

        if (!status) {
          logger.error(`[WebSocket][server][请求失败]: ${requestFile}`)
          return request.respond({ status: 404, contentType: 'text/plain', body: 'Not Found' })
        }

        request.respond({ status: 200, contentType, body: data })
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
    const render = (origin === 'local')
      /** 本地ip */
      ? async (data: any) => {
        const result = await screenshot(data)
        return result
      }
      /** 强制性等待并且劫持请求通过ws进行交互 */
      : async (data: any) => {
        const html = cacheHtml(data.file)
        data.file = html
        data.pageGotoParams = data.pageGotoParams || {}
        data.pageGotoParams.waitUntil = 'networkidle2'
        const result = await screenshot({ ...data, setRequestInterception })
        delHtml(html)
        return result
      }

    server.on('message', async (event) => {
      const raw = event.toString()
      const { echo, action, data } = JSON.parse(raw)
      if (action !== Action.static) {
        logger.info(`[WebSocket][server][收到消息][ip: ${request.socket.remoteAddress}]: ${raw}`)
      }

      switch (action) {
        /** 截图 */
        case Action.render: {
          try {
            const start = Date.now()
            data.srcFile = data.file

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
        // /** 静态资源响应 */
        // case Action.static: {
        //   if (status === 'error') throw new Error(data)
        //   server.emit(echo, { data: Buffer.from(data), status })
        //   return
        // }
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
