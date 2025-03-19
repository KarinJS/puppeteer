import express from 'express'
import { app } from '../express'
import { common } from '@karinjs/puppeteer-core'
import { auth } from '@/utils'

app.use(express.json())
app.use('/static', express.raw({
  type: 'application/octet-stream',
  limit: '30mb'
}))

app.post('/static', (req, res) => {
  try {
    if (!auth('post', req.ip, req.headers.authorization)) {
      throw new Error('鉴权失败')
    }

    if (!req?.body?.echo || !req?.body?.file || typeof req?.body?.status !== 'boolean') {
      throw new Error('无效的请求')
    }

    const echo = req?.body.echo
    if (req?.body?.file?.type === 'Buffer') {
      common.emit(echo, {
        status: req?.body.status,
        data: Buffer.from(req.body.file)
      })
    } else {
      throw new Error('接收到的数据不是Buffer类型')
    }
  } catch (error) {
    console.error('处理静态文件时出错:', error)
    res.status(500).send((error as Error).message)
    return
  }
  res.status(200).end()
})
