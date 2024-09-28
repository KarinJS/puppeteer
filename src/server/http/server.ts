import crypto from 'crypto'
import { app } from '../express'
import { common, config, logger } from '@/utils'
import { puppeteer } from '@/puppeteer'

const bearer = crypto.createHash('sha256').update(`Bearer ${config.http.token}`).digest('hex')

app.get('/puppeteer/', async (req, res) => {
  logger.info(`[HTTP][get][收到请求]: ${req.ip} ${JSON.stringify(req.query)}`)
  /** 鉴权 get请求秘钥在参数中 */
  const auth = req.query.auth
  if (auth !== bearer) {
    logger.error(`[HTTP][get][鉴权失败]: ${req.ip} ${auth}`)
    return res.status(401).send({ status: 401, message: '鉴权失败' })
  }

  const file = String(req.query.file)
  if (!file) return res.status(400).send({ status: 400, message: 'path is required' })
  if (!file.startsWith('file://') && !file.startsWith('http')) return res.status(400).send({ status: 400, message: '此接口仅接受file://开头的本地绝对路径或者http连接' })

  try {
    const start = Date.now()
    const buffer = await puppeteer.screenshot({
      file,
      type: 'png',
      pageGotoParams: {
        waitUntil: 'networkidle2'
      },
      setViewport: {
        deviceScaleFactor: 3
      }
    })
    res.setHeader('Content-Type', 'image/png')
    res.send(buffer)
    return common.log(buffer, file, start)
  } catch (error: any) {
    console.error(error)
    res.status(500).send({ status: 500, message: '内部错误', error: error.message })
  }
})

app.post('/puppeteer', async (req, res) => {
  logger.info(`[HTTP][post][收到请求]: ${req.ip} ${JSON.stringify(req.body)}`)
  if (!req.body?.file) return res.status(400).send({ status: 400, message: '无效的file' })
  /** 非http的情况下只允许本机IP进行访问此接口 */
  if (!req.body.file.startsWith('http') && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    logger.error(`[HTTP][post][来源IP校验失败]: ${req.ip}`)
    return res.status(403).send({ status: 403, message: 'Forbidden' })
  }

  /** 鉴权 */
  const authorization = req.headers.authorization
  if (authorization !== bearer) {
    logger.error(`[HTTP][post][鉴权失败]: ${req.ip} ${authorization}`)
    return res.status(401).send({ status: 401, message: '鉴权失败' })
  }

  try {
    const start = Date.now()
    const buffer = await puppeteer.screenshot(req.body)
    res.setHeader('Content-Type', 'image/png')
    res.send(buffer)
    return common.log(buffer, req.body.file, start)
  } catch (error: any) {
    console.error(error)
    res.status(500).send({ status: 500, message: '内部错误', error: error.message })
  }
})
