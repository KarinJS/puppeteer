import fs from 'node:fs'
import crypto from 'node:crypto'
import { app } from '../express'
import { common, config, logger } from '@/utils'
import { puppeteer } from '@/puppeteer'
import { dealTpl } from './template'

const bearer = crypto.createHash('md5').update(`Bearer ${config.http.token}`).digest('hex')

app.post('/render', async (req, res) => {
  logger.info(`[HTTP][post][收到请求]: ${req.ip} ${JSON.stringify(req.body)}`)
  if (!req.body?.file) return res.status(400).send({ status: 400, message: '无效的file' })
  // /** 非http的情况下只允许本机IP进行访问此接口 */
  // if (!req.body.file.startsWith('http') && req.ip !== '::1' && req.ip !== '127.0.0.1') {
  //   logger.error(`[HTTP][post][来源IP校验失败]: ${req.ip}`)
  //   return res.status(403).send({ status: 403, message: 'Forbidden' })
  // }

  /** 鉴权 */
  const authorization = crypto.createHash('md5').update(`Bearer ${req.headers.authorization}`).digest('hex')
  if (authorization !== bearer) {
    logger.error(`[HTTP][post][鉴权失败]: ${req.ip} ${req.headers.authorization}`)
    return res.status(401).send({ status: 401, message: '鉴权失败' })
  }

  try {
    const file = dealTpl(req.body.file, req.body.data)
    if (!file) return res.status(400).send({ status: 400, message: '无效的file' })
    req.body.file = file
    delete req.body.data

    const start = Date.now()
    const buffer = await puppeteer.screenshot(req.body)
    res.setHeader('Content-Type', 'image/png')
    res.send(buffer)
    /** 5秒之后删除模板 */
    setTimeout(() => {
      try {
        fs.existsSync(file.replace(/^file:\/\//, '')) && fs.unlinkSync(file.replace(/^file:\/\//, ''))
      } catch (error) {
        logger.error(`[删除模板失败]: ${file}`)
      }
    }, 5000)

    return common.log(buffer, req.body.file, start)
  } catch (error: any) {
    console.error(error)
    res.status(500).send({ status: 500, message: '内部错误', error: error.message })
  }
})
