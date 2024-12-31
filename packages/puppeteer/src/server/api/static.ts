import express from 'express'
import { app } from '../express'
import { common } from '@karinjs/puppeteer-core'

app.use('/static', express.raw({
  type: 'application/octet-stream',
  limit: '30mb'
}))

app.post('/static', (req, res) => {
  try {
    const uuid = req.headers.uuid as string
    if (!uuid || typeof uuid !== 'string') return
    const status = req.headers.status as string

    if (req?.body?.file?.type === 'Buffer') {
      common.emit(uuid, {
        status: typeof status === 'boolean' ? status : true,
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
