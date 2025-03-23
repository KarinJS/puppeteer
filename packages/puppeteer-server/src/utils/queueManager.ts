/**
 * 队列项接口
 */
export interface QueueItem<T> {
  value: T
  resolve: () => void
}

/**
 * 创建队列管理器的配置项
 */
export interface CreateQueueManagerOptions<T> {
  /**
   * 获取当前数据的函数
   */
  getData: () => T
  /**
   * 保存数据的函数
   */
  saveData: (data: T) => void
  /**
   * 处理队列项的函数
   * @param data 当前数据
   * @param item 队列项
   * @returns 是否需要保存数据
   */
  processItem: (data: T, item: any) => boolean
}

/**
 * 队列管理器接口
 */
export interface QueueManager<T> {
  /**
   * 添加项到队列
   */
  add: (value: T) => Promise<void>
}

/**
 * 创建队列管理器
 * @param options 配置项
 * @returns 队列管理器
 */
export function createQueueManager<T, I> (options: CreateQueueManagerOptions<T>): QueueManager<I> {
  const { getData, saveData, processItem } = options
  let isProcessing = false
  const queue: QueueItem<I>[] = []

  /**
   * 处理队列
   */
  async function process (): Promise<void> {
    if (isProcessing || queue.length === 0) return

    isProcessing = true

    try {
      // 获取最新的数据
      const data = getData()
      let hasChanges = false

      // 处理队列中的所有项
      while (queue.length > 0) {
        const { value, resolve } = queue.shift()!
        const needSave = processItem(data, value)
        if (needSave) {
          hasChanges = true
        }
        resolve()
      }

      // 只在有变更时保存数据
      if (hasChanges) {
        saveData(data)
      }
    } catch (error) {
      console.error('处理队列时出错:', error)
    } finally {
      isProcessing = false

      // 检查是否有新的队列项需要处理
      if (queue.length > 0) {
        process()
      }
    }
  }

  return {
    add (value: I): Promise<void> {
      return new Promise<void>((resolve) => {
        queue.push({ value, resolve })
        process()
      })
    }
  }
}
