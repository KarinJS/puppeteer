import { app } from '../express'
import { common, logger, auth } from '@/utils'
import { screenshot } from '@/puppeteer'
import { httpErrRes, httpSuccRes } from '@/utils/response'

app.get('/puppeteer/', async (req, res) => {
  logger.info(`[HTTP][get][收到请求]: ${req.ip} ${JSON.stringify(req.query)}`)
  /** 鉴权 get请求秘钥在参数中 */
  if (!auth('get', req.ip, req.query.token as string)) {
    logger.error(`[HTTP][get][鉴权失败]: ${req.ip} ${req.query.token}`)
  }

  const file = String(req.query.file)
  if (!file) return res.status(400).send({ status: 400, message: 'path is required' })
  if (!file.startsWith('file://') && !file.startsWith('http')) {
    return res.status(400).send({ status: 400, message: '此接口仅接受file://开头的本地绝对路径或者http连接' })
  }

  try {
    const start = Date.now()
    const data = await screenshot({
      file,
      type: 'png',
      pageGotoParams: {
        waitUntil: 'networkidle0'
      },
      setViewport: {
        deviceScaleFactor: 3
      }
    })

    httpSuccRes(res, data, 'binary', false)
    return common.log(data, file, start)
  } catch (error: any) {
    console.error(error)
    res.status(500).send({ status: 500, message: '内部错误', error: error.message })
  }
})

app.post('/puppeteer', async (req, res) => {
  logger.info(`[HTTP][post][收到请求]: ${req.ip} ${JSON.stringify(req.body)}`)
  if (!req.body?.file) return res.status(400).send({ status: 400, message: '无效的file' })
  // /** 非http的情况下只允许本机IP进行访问此接口 */
  // if (!req.body.file.startsWith('http') && req.ip !== '::1' && req.ip !== '127.0.0.1') {
  //   logger.error(`[HTTP][post][来源IP校验失败]: ${req.ip}`)
  //   return res.status(403).send({ status: 403, message: 'Forbidden' })
  // }

  /** 鉴权 */
  if (!auth('post', req.ip, req.headers.authorization)) {
    return res.status(401).send({ status: 401, message: '鉴权失败' })
  }

  try {
    const start = Date.now()
    const data = await screenshot(req.body)

    httpSuccRes(res, data, req.body.encoding, req.body.multiPage)
    return common.log(data, req.body.file, start)
  } catch (error: any) {
    console.error(error)
    httpErrRes(res, error)
  }
})
