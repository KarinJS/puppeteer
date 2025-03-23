import path from 'path'
import { getCount } from '../cache/count'

export const common = {
  // `result` 是 base64 字符串或者 Uint8Array 类型的图片数据
  log: (result: string | Uint8Array | (string | Uint8Array)[], file: string, start: number) => {
    let length = 0

    if (Array.isArray(result)) {
      result.forEach((item) => {
        length += typeof item === 'string' ? Buffer.byteLength(item, 'base64') : item.byteLength
      })
    } else {
      length = typeof result === 'string' ? Buffer.byteLength(result, 'base64') : result.byteLength
    }

    const kb = (length / 1024).toFixed(2) + 'KB'
    let name = path.basename(file)
    if (!file.startsWith('http') || !file.startsWith('file')) {
      name = 'str.html'
    }
    logger.mark(`[图片生成][${name}][${getCount.count.count}次] ${kb} ${Date.now() - start}ms`)
  }
}
