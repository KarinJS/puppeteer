import express from 'express'
import { router } from '../app'
import { hex } from './hex'
import { ping } from './ping'
import { renderRouter, screenshotRouter } from './render'
import { uploadHandler } from './upload'
import { authMiddleware } from '../auth/middleware'
import { getConfigRouter, setConfigRouter } from '../config'
import { login } from '../web'

/**
 * 初始化路由
 */
export const initRouter = (limit: string) => {
  router.use(express.json({ limit }))
  router.use(express.urlencoded({ extended: true }))
  router.use(authMiddleware)
  router.get('/hex/:token', hex)
  router.get('/ping', ping)

  router.get('/render', renderRouter)
  router.post('/render', renderRouter)
  router.get('/screenshot', screenshotRouter)
  router.post('/screenshot', screenshotRouter)
  router.post('/upload', uploadHandler)

  router.get('/config/get', getConfigRouter)
  router.post('/config/set', setConfigRouter)

  router.get('/login', login)
}
