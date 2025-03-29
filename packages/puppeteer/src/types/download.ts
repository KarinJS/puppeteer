/**
 * 下载文件的返回结果
 */
export interface DownloadResult {
  /** 是否成功 */
  success: boolean
  /** 下载的文件路径 */
  filePath?: string
  /** 错误信息 */
  error?: Error
  /** HTTP状态码 */
  statusCode?: number
  /** 内容长度 */
  contentLength?: number
}

/**
 * 下载参数选项
 */
export interface DownloadOptions {
  /** 超时时间，默认30秒 */
  timeout?: number
  /** 是否覆盖已存在的文件 */
  overwrite?: boolean
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 进度回调函数 */
  onProgress?: (downloaded: number, total: number) => void
  /** 是否静默下载（不输出日志） */
  silent?: boolean
}
