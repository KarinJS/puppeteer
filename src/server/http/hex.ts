import crypto from 'crypto'
import { app } from '../express'

app.get('/hex/:token', async (req, res) => {
  const { token } = req.params
  const bearer = crypto.createHash('sha256').update(`Bearer ${token}`).digest('hex')
  res.send(bearer)
})
