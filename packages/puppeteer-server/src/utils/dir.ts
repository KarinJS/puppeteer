import path from 'node:path'

/** 缓存目录名称 */
export const cacheDirName = '.cache'
/** 缓存文件列表名称 */
export const cacheFileName = 'cache.json'
/** 基本目录名称 */
export const baseDirName = 'data'

/** 基本目录 */
export const baseDir = path.join(process.cwd(), baseDirName)

/** 缓存目录 */
export const cacheDir = path.join(baseDir, cacheDirName)
/** 缓存文件列表 */
export const cacheFile = path.join(cacheDir, cacheFileName)

/** 配置文件 */
export const configFile = path.join(baseDir, 'config.json')
/** 调用次数 */
export const countFile = path.join(baseDir, 'count.json')

/** 日志文件目录 */
export const logFilename = `${baseDirName}/logs/logger`
