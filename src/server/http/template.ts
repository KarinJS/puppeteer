import fs from 'node:fs'
import path from 'node:path'
import template from 'art-template'
import { logger } from '@/utils'

const htmlPath = `${process.cwd()}/data/html`
const list: Record<string, string> = {}
const watcher = new Map<string, fs.FSWatcher>()
if (!fs.existsSync(htmlPath)) fs.mkdirSync(htmlPath, { recursive: true })
const sep = path.sep === '/' ? /^file:\/\// : /^file:[/]{2,3}/g

export const dealTpl = (file: string, data: Record<string, any>) => {
  const tplFile = file.replace(sep, '')
  /** 取文件名称 不包含后缀 */
  const name = path.basename(tplFile, path.extname(tplFile))
  const filePath = `${htmlPath}/${name}:${Date.now()}.html`

  /** 读取html模板 */
  if (!list[tplFile]) {
    fs.writeFileSync(filePath, fs.readFileSync(tplFile, 'utf8'))

    try {
      list[tplFile] = fs.readFileSync(tplFile, 'utf8')
    } catch (error) {
      logger.error(`加载html错误：${tplFile}`)
      return ''
    }
    watch(tplFile)
  }

  /** 替换模板 */
  const tmpHtml = template.render(list[tplFile], data)

  /** 保存模板 */
  fs.writeFileSync(filePath, tmpHtml)
  logger.debug(`[图片生成][使用模板] ${filePath}`)

  return `file://${filePath}`
}

/**
 * 检测文件变化
 * @param file 如果文件有变动则删除缓存
 */
const watch = (file: string) => {
  if (watcher.has(file)) return

  const watch = fs.watch(file, (event) => {
    if (event === 'change') {
      logger.debug(`[模板][文件修改] ${file}`)
      delete list[file]
    }
  })

  watcher.set(file, watch)
}
