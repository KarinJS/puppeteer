import fs from 'node:fs'
import path from 'node:path'

/**
 * 递归创建目录
 * @param dirname - 目录路径
 */
export const mkdirs = (dirname: string) => {
  if (fs.existsSync(dirname)) return true
  if (mkdirs(path.dirname(dirname))) {
    fs.mkdirSync(dirname)
    return true
  }
}
