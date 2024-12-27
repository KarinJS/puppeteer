import { auth } from '@/utils'
import { app } from '../express'
import { Request, Response } from 'express'

const decodeToken = (token: string): string => decodeURIComponent(token || '') || ''

const handleAuth = async (req: Request, res: Response, token: string) => {
  if (!token) {
    return res.status(400).send({ status: 400, message: '无效的token' })
  }

  const method = req.method.toLowerCase() as 'get' | 'post'
  if (auth(method, req.ip, token)) {
    res.status(200).send({ status: 200, message: 'ok' })
  } else {
    res.status(401).send({ status: 401, message: 'fail' })
  }
}

app.get('/auth', async (req, res) => {
  const token = decodeToken(req.headers.authorization as string || '')
  await handleAuth(req, res, token)
})

app.get('/auth/:token', async (req, res) => {
  const token = decodeToken(req.params.token || (req.headers.authorization as string) || '')
  await handleAuth(req, res, token)
})

app.post('/auth', async (req, res) => {
  const token = decodeToken(req.body.token)
  await handleAuth(req, res, token)
})
