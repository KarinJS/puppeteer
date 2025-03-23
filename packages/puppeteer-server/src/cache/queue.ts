import fs from 'node:fs'
import type { CacheItem } from './index'
import { createQueueManager, QueueManager } from '../utils/queueManager'

/**
 * 缓存队列管理器
 */
export class CacheQueueManager {
  private queueManager: QueueManager<CacheItem>
  private cacheFile: string

  constructor (cacheFile: string) {
    this.cacheFile = cacheFile

    this.queueManager = createQueueManager<Record<string, CacheItem>, CacheItem>({
      getData: () => this.getCacheList(),
      saveData: (data) => {
        fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2))
      },
      processItem: (data, item) => {
        data[item.url] = item
        return true
      }
    })
  }

  /**
   * 获取缓存文件列表
   */
  private getCacheList (): Record<string, CacheItem> {
    return JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'))
  }

  /**
   * 添加缓存项到队列
   * @param value - 缓存项
   * @returns Promise - 当缓存项成功加入缓存文件后解析
   */
  public add (value: CacheItem): Promise<void> {
    return this.queueManager.add(value)
  }
}
