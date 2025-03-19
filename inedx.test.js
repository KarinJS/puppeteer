import { launch } from './index.cjs'
import { writeFile } from 'node:fs/promises'

async function main () {
  const puppeteer = await launch({ debug: true, protocol: 'webDriverBiDi' })
  puppeteer.screenshot({
    file: 'file://D:/karin/puppeteer/test/index.test.html',
    encoding: 'base64',
    fullPage: true,
  }).then(async (result) => {
    if (result.status) {
      await writeFile('D:/karin/puppeteer/temp/screenshot-webDriverBiDi-1.png', Buffer.from(result.data, 'base64'))
    } else {
      console.error('[错误] 截图失败:', result.data)
    }
  })
}

main()
