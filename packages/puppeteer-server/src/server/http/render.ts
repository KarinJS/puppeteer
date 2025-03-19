import { app } from '../express'
import { auth, common, logger } from '@/utils'
import { screenshot } from '@/puppeteer'
import { dealTpl } from './template'
import { httpErrRes, httpSuccRes } from '@/utils/response'
import { ScreenshotOptions } from '@/puppeteer/types'

app.post('/render', async (req, res) => {
  logger.info(`[HTTP][post][收到请求]: ${req.ip} ${JSON.stringify(req.body)}`)
  if (!req.body?.file) return res.status(400).send({ status: 400, message: '无效的file' })

  /** 鉴权 */
  if (!auth('post', req.ip, req.headers.authorization)) {
    return res.status(401).send({ status: 401, message: '鉴权失败' })
  }

  try {
    const options = req.body as ScreenshotOptions
    options.srcFile = options.file

    const file = dealTpl(options.file, options.data || {})
    if (!file) return res.status(400).send({ status: 400, message: '无效的file' })
    options.file = file
    delete options.data

    const start = Date.now()
    const data = await screenshot(options)
    httpSuccRes(res, data, options.encoding, options.multiPage)

    return common.log(data, options.srcFile, start)
  } catch (error: any) {
    console.error(error)
    httpErrRes(res, error)
  }
})
