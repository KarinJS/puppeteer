import http from 'http'
import express from 'express'
import { logger } from '@/utils'

export const app: express.Application = express()
export const server = http.createServer(app)
/** 解析JSON */
app.use(express.json({ limit: '50mb' }))
/** 解析URL编码 */
app.use(express.urlencoded({ extended: true }))
export const init = (port: number, hostname: string) => {
  server.listen(port, hostname, () => {
    logger.info(`[HTTP] express启动成功 正在监听: http://${hostname}:${port}`)
  })
}
