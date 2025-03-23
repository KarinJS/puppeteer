interface UploadFileMap {
  /** 文件路径 */
  filePath: string
  /** 文件类型 */
  contentType: string
  /** 文件url */
  url: string
}

/**
 * 上传文件映射
 * @description 用于存储上传文件的映射关系 echo -> { filePath, contentType, url }
 */
export const uploadFileMap = new Map<string, UploadFileMap>()
