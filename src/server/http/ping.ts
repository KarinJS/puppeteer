import { app } from '../express'

app.get('/ping', (req, res) => {
  res.status(200).send({ status: 200, message: '我一直都相信你的存在啊~' })
})
