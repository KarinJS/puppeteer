import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEN_MINUTES = 10 * 60 * 1000

/**
 * 传入html字符串 返回html文件路径
 * @param html html字符串
 * @param name 文件名
 * @returns 文件路径
 */
export const createHtmlFile = (html: string, name?: string) => {
  const tmpDir = path.resolve(__dirname, '../tmp_html')
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  const filename = name || (Math.random().toString(36).slice(2, 10) + '_' + Date.now() + '.html')
  const filePath = path.join(tmpDir, filename)
  fs.writeFileSync(filePath, html, 'utf8')
  return `file://${filePath}`
}

/**
 * 每10分钟清理一次tmp_html目录
 */
(() => {
  const tmpDir = path.resolve(__dirname, '../tmp_html')
  if (!fs.existsSync(tmpDir)) return
  const files = fs.readdirSync(tmpDir)
  const now = Date.now()
  files.forEach(file => {
    if (!file.endsWith('.html')) return
    const filePath = path.join(tmpDir, file)
    try {
      const stat = fs.statSync(filePath)
      if (now - stat.mtimeMs > TEN_MINUTES) {
        fs.unlinkSync(filePath)
      }
    } catch { }
  })
})()
