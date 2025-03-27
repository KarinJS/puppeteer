import fs from 'node:fs'
import crypto from 'node:crypto'
import { CacheQueueManager } from './queue'
import { cacheDir, cacheDirName, cacheFile } from '../utils/dir'

export interface CacheItem {
  /** 资源url */
  url: string
  /** 资源hash md5 */
  hash: string
  /**
   * 资源类型 目前仅支持这些
   * - image
   * - font
   * - stylesheet
   * - document
   * - script
   */
  type: string
  /**
   * 文件名称 用于静态资源访问
   * - 格式: ${md5}.${type}
   * - 例如: 123456.image
   */
  name: string
  /**
   * 资源缓存路径
   * - 格式: .cache/${name}
   * - 例如: .cache/123456.image
   * - 使用: 需要自行拼接成绝对路径
   */
  path: string
}

/** 缓存队列管理器实例 */
const cacheQueueManager = new CacheQueueManager(cacheFile)

/**
 * 新增一个缓存到列表
 * 使用队列机制避免高并发下的文件写入冲突
 */
export const newCacheFile = (value: CacheItem): Promise<void> => {
  const md5 = crypto.createHash('md5').update(value.url).digest('hex')
  value.url = md5
  value.path = `${cacheDirName}/${value.name}`
  return cacheQueueManager.add(value)
}

/**
 * 获取缓存文件列表
 */
const getCacheList = (): Record<string, CacheItem> => {
  if (!fs.existsSync(cacheFile)) {
    fs.mkdirSync(cacheDir, { recursive: true })
    fs.writeFileSync(cacheFile, '{}')
    return {}
  }
  return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
}

/**
 * 获取缓存文件路径
 * @param url - 资源url
 * @param type - 资源类型
 * @returns 是否存在缓存
 */
export const getCache = (url: string, type: string) => {
  const list = getCacheList()
  const md5 = crypto.createHash('md5').update(url).digest('hex')
  const cache = list[md5]
  if (!cache) return null
  if (cache.type !== type) return null
  if (fs.existsSync(cache.path)) {
    return cache.path
  }

  return null
}
