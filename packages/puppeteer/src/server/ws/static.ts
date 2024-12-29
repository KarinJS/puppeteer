import { randomUUID } from 'node:crypto'

const cache = new Map<string, string>()

/**
 * 缓存html路径 返回一个唯一html路径
 * @param file html路径
 */
export const cacheHtml = (file: string) => {
  const uuid = randomUUID()

  // 生成虚拟路径 判断是windows还是linux
  const html = process.platform === 'win32' ? `file:///C:/uuid/${uuid}.html` : `file:///root/uuid/${uuid}.html`
  cache.set(html, file)
  return html
}

/**
 * 获取html路径
 * @param html html路径的唯一标识
 */
export const getHtml = (html: string): string => {
  return cache.get(html) || ''
}

/**
 * 删除html路径
 * @param html html路径的唯一标识
 */
export const delHtml = (html: string) => {
  cache.delete(html)
}