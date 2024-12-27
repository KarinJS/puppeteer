import { Page } from 'puppeteer-core'
import { Render } from './core'

interface PageInfo {
  /** 页面对象 */
  page: Page
  /** 状态：idle 空闲，busy 忙碌 */
  status: 'idle' | 'busy'
  /** 最后使用时间 */
  lastUsed: number
  /** 空闲定时器 */
  timer?: NodeJS.Timeout
}

export class PagePool {
  private pool: Map<string, PageInfo> = new Map()
  private maxSize: number
  private idleTimeout: number = 60000 // 1分钟
  private render: Render

  constructor (render: Render, maxPages?: number) {
    this.render = render
    this.maxSize = maxPages || 10
    this.initFirstPage()
  }

  /**
   * 初始化第一个页面
   */
  private async initFirstPage () {
    await this.createNewPage()
  }

  /**
   * 生成一个随机ID
   * @returns 随机ID
   */
  private generateId (): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * 创建一个新的页面
   */
  private async createNewPage (): Promise<string> {
    const page = await this.render.browser.newPage()
    const id = this.generateId()

    this.pool.set(id, {
      page,
      status: 'idle',
      lastUsed: Date.now()
    })

    return id
  }

  /**
   * 启动空闲定时器
   * @param id 页面ID
   * @param timeout 超时时间
   */
  private startIdleTimer (id: string) {
    const pageInfo = this.pool.get(id)
    if (!pageInfo) return

    // 清除之前的定时器
    if (pageInfo.timer) {
      clearTimeout(pageInfo.timer)
    }

    // 设置新的定时器
    pageInfo.timer = setTimeout(async () => {
      const info = this.pool.get(id)
      if (info && info.status === 'idle') {
        await info.page.close().catch(() => { })
        this.pool.delete(id)
      }
    }, this.idleTimeout)
  }

  /**
   * 创建一个新的页面
   */
  async createPage (): Promise<Page> {
    const id = await this.createNewPage()
    const info = this.pool.get(id)!
    info.status = 'busy'
    return info.page
  }

  /**
   * 获取一个页面
   */
  async acquirePage (): Promise<Page> {
    // 查找空闲页面
    for (const [, info] of this.pool.entries()) {
      if (info.status === 'idle') {
        info.status = 'busy'
        info.lastUsed = Date.now()
        if (info.timer) {
          clearTimeout(info.timer)
        }
        return info.page
      }
    }

    // 如果没有空闲页面且未达到最大限制，创建新页面
    if (this.pool.size < this.maxSize) {
      const id = await this.createNewPage()
      const info = this.pool.get(id)!
      info.status = 'busy'
      return info.page
    }

    // 如果达到最大限制，等待某个页面空闲
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        for (const [, info] of this.pool.entries()) {
          if (info.status === 'idle') {
            clearInterval(checkInterval)
            info.status = 'busy'
            info.lastUsed = Date.now()
            if (info.timer) {
              clearTimeout(info.timer)
            }
            resolve(info.page)
            return
          }
        }
      }, 100)
    })
  }

  /**
   * 释放一个页面
   */
  async releasePage (page: Page) {
    for (const [id, info] of this.pool.entries()) {
      if (info.page === page) {
        info.status = 'idle'
        info.lastUsed = Date.now()
        this.startIdleTimer(id)
        break
      }
    }
  }

  /**
   * 关闭所有页面
   */
  async closeAll () {
    for (const [, info] of this.pool.entries()) {
      if (info.timer) {
        clearTimeout(info.timer)
      }
      await info.page.close().catch(() => { })
    }
    this.pool.clear()
  }

  /**
   * 从池中移除指定页面
   */
  async removePage (page: Page) {
    for (const [id, info] of this.pool.entries()) {
      if (info.page === page) {
        if (info.timer) {
          clearTimeout(info.timer)
        }
        // 移除所有事件监听器
        page.removeAllListeners()
        // 关闭页面
        await info.page.close().catch(() => { })
        this.pool.delete(id)
        break
      }
    }
  }
}
