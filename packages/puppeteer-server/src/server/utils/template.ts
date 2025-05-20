import fs from 'node:fs'
import path from 'node:path'
import template from 'art-template'
import { vueToHtml } from '../../component/vue3'
import { createHtmlFile } from '../../temp'
import type { RenderOptions } from '../router/render'

/**
 * 渲染模板
 * @param options 渲染选项
 */
export const renderTemplate = async (options: RenderOptions) => {
  if (!options.file_type) options.file_type = 'auto'

  let html: string

  if (options.file_type === 'auto') {
    if (!options.file.startsWith('file://') || path.extname(options.file) !== '.html') {
      throw new Error('文件类型错误，此接口仅支持file://协议的html文件')
    }
    html = fs.readFileSync(options.file.replace('file://', ''), 'utf8')
    html = template.render(html, options.data)
  } else if (options.file_type === 'htmlString') {
    html = template.render(options.file, options.data)
  } else if (options.file_type === 'vue3') {
    const component = fs.readFileSync(options.file, 'utf8')
    html = await vueToHtml(component, options.data || {})
  } else if (options.file_type === 'vueString') {
    html = await vueToHtml(options.file, options.data || {})
  } else {
    throw new Error(`不支持的文件类型: ${options.file_type}`)
  }

  return createHtmlFile(html, options.file_name)
}
