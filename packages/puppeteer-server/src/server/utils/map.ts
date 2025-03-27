interface UploadFileMap {
  /** 文件路径 */
  filePath: string
  /** 文件类型 */
  contentType: string
  /** 文件url */
  url: string
}

/**
 * 路径映射信息
 */
interface PathMap {
  /** 客户端是否Windows系统 */
  isWindows: boolean
  /** 原始目录 */
  dir: string
  /** 模拟路径 */
  mock: string
  /** 原始文件路径 */
  original: string
  /** 请求标识 */
  echo: string
}

/**
 * 上传文件映射
 * @description 用于存储上传文件的映射关系 echo -> { filePath, contentType, url }
 */
export const uploadFileMap = new Map<string, UploadFileMap>()

/**
 * 文件路径映射
 * @description 用于存储文件路径的映射关系
 */
export const filePathMap = new Map<string, PathMap>()

/**
 * 清理映射
 * @param echo 请求标识
 */
export const clearMaps = (echo: string) => {
  uploadFileMap.delete(echo)
  // 查找并删除filePathMap中所有对应的echo条目
  for (const [key, value] of filePathMap.entries()) {
    if (value.echo === echo) {
      filePathMap.delete(key)
    }
  }
}
