import { app } from '../express'
import { sha256 } from '@/utils/hash'

app.get('/hex/:token', async (req, res) => {
  const { token } = req.params
  const bearer = sha256(token)
  res.send(bearer)
})
