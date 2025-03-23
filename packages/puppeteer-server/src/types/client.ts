/**
 * 创建ws客户端配置
 */
export interface CreateWebSocketOptions {
  /** 链接地址 */
  url: string,
  /** 心跳时间 单位: 毫秒 */
  heartbeatTime: number,
  /** 重连时间 单位: 毫秒 */
  reconnectionTime: number,
  /** 鉴权密钥 - 明文 */
  authorization?: string
}

/**
 * 要求客户端上传文件请求参数
 */
export interface UploadFileRequestParams {
  /** 文件类型 */
  type: string,
  /** 文件路径 */
  path: string,
  /** 请求唯一标识符 */
  echo: string
}

/**
 * 要求客户端上传文件响应参数
 */
export interface UploadFileResponseParams {
  /** 请求唯一标识符 */
  echo: string,
  /** 文件哈希 md5 */
  hash: string,
}
