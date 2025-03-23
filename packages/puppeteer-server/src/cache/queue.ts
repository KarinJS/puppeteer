import fs from 'node:fs'
import type { CacheItem } from './index'

/**
 * 缓存队列项
 */
interface QueueItem {
  value: CacheItem
  resolve: () => void
}

/**
 * 缓存队列管理器
 */
export class CacheQueueManager {
  private isProcessing = false
  private queue: QueueItem[] = []
  private cacheFile: string

  constructor (cacheFile: string) {
    this.cacheFile = cacheFile
  }

  /**
   * 获取缓存文件列表
   */
  private getCacheList (): Record<string, CacheItem> {
    return JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'))
  }

  /**
   * 处理缓存队列
   */
  private async process (): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    try {
      // 获取最新的缓存列表
      const list = this.getCacheList()
      let hasChanges = false

      // 处理队列中的所有项
      while (this.queue.length > 0) {
        const { value, resolve } = this.queue.shift()!
        list[value.url] = value
        hasChanges = true
        resolve()
      }

      // 只在有变更时写入文件
      if (hasChanges) {
        fs.writeFileSync(this.cacheFile, JSON.stringify(list, null, 2))
      }
    } catch (error) {
      console.error('处理缓存队列时出错:', error)
    } finally {
      this.isProcessing = false

      // 检查是否有新的队列项需要处理
      if (this.queue.length > 0) {
        this.process()
      }
    }
  }

  /**
   * 添加缓存项到队列
   * @param value - 缓存项
   * @returns Promise - 当缓存项成功加入缓存文件后解析
   */
  public add (value: CacheItem): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({ value, resolve })
      this.process()
    })
  }
}
