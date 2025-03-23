import http from 'node:http'
import express, { Router } from 'express'
import type { Express } from 'express'

/**
 * 应用实例
 */
export const app: Express = express()

/**
 * 路由实例
 */
export const router: Router = Router()

/**
 * 服务实例
 */
export const server: http.Server = http.createServer(app)

/**
 * 初始化
 * @param port 端口
 * @param hostname 主机名
 */
export const init = (port: number, hostname: string) => {
  server.listen(port, hostname, () => {
    logger.info(`express启动成功 正在监听: http://${hostname}:${port}`)
  })
}
