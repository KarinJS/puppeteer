import path from 'path'
import { logger } from './logger'
import { count } from './count'

export const common = {
  log: (result: Buffer | Buffer[], file: string, start: number) => {
    count.count++
    let length = 0
    if (Array.isArray(result)) {
      length = result.reduce((acc, cur) => acc + cur.length, 0)
    } else {
      length = result.length
    }
    const kb = (length / 1024).toFixed(2) + 'KB'
    logger.mark(`[图片生成][${path.basename(file)}][${count.count}次] ${kb} ${Date.now() - start}ms`)
  }
}
