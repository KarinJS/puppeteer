import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createSuccessResponse } from '../utils/response'

/**
 * 初始化web服务
 */
export const initWeb = (app: express.Application) => {
  let dir: string

  if (fs.existsSync(path.resolve(__dirname, '../public'))) {
    dir = path.resolve(__dirname, '../public')
  } else {
    dir = path.resolve(__dirname, '../../../public')
  }

  app.use(express.static(dir))
  app.get('/web', (_req, res) => {
    res.sendFile(path.resolve(dir, 'login.html'))
  })

  // /** 全部重定向到index.html */
  // app.all('/*', (_req, res) => {
  //   res.redirect('/web')
  // })
}

/**
 * 登录接口
 * @description 其实就是验证一下token...
 */
export const login: express.RequestHandler = (_req, res) => {
  createSuccessResponse(res, { data: '登录成功' })
}
