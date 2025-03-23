/**
 * 创建文件上传事件响应key
 * @description 客户端通过post上传完成后 接口处理完按成后需要发布此事件
 * @param echo - 请求echo
 * @returns 文件上传事件完成响应key
 */
export const createUploadFileEventKey = (echo: string) => {
  return `uploadFile:${echo}`
}
