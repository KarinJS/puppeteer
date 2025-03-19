import fs from 'node:fs'
import launch from './index'
import path from 'node:path'

async function main () {
  const puppeteer = await launch()

  const cwd = path.resolve(__dirname, '../../..')
  const tmp = path.resolve(cwd, 'tmp')
  const test = path.resolve(cwd, 'test')
  fs.mkdirSync(tmp, { recursive: true })
  fs.mkdirSync(test, { recursive: true })

  const file = path.resolve(test, 'test.html')
  const image = path.resolve(tmp, 'image.png')

  const screenshot = async () => {
    /** 计算耗时 */
    console.time('截图耗时')
    const result = await puppeteer.screenshot({
      file,
      encoding: 'binary',
      type: 'png',
      multiPage: false
    })

    console.timeEnd('截图耗时')
    if (!result.status) {
      throw new Error(result.data.message)
    }

    fs.writeFileSync(image, Buffer.from(result.data))
    process.exit(0)
  }

  await screenshot()
}

main()
