import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { newCacheFile } from '../../cache'
import { cacheDir } from '../../utils/dir'
import { Status } from '../utils/webSocket'
import { uploadFileMap } from '../utils/map'
import { eventEmitter } from '../../utils/event'
import { createUploadFileEventKey } from '../utils/key'
import { createSuccessResponse, createBadRequestResponse } from '../utils/response'

import type { RequestHandler } from 'express'

/**
 * 计算文件MD5
 * @param filePath 文件路径
 * @returns MD5哈希值
 */
const calculateFileMd5 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)

    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

/**
 * 上传静态资源
 */
export const uploadHandler: RequestHandler = async (req, res) => {
  const { file, echo, file_name: fileName } = req.body

  try {
    if (!file || !echo || !file.startsWith('base64://')) {
      createBadRequestResponse(res, '未上传文件或上传失败')
      return
    }

    /** 获取上传配置 */
    const options = uploadFileMap.get(echo)
    if (!options) {
      createBadRequestResponse(res, '无效的请求标识')
      return
    }

    /** 保存临时文件 */
    const tempFilePath = path.join(cacheDir, `${Date.now()}-${echo}-${fileName || 'upload'}`)
    fs.writeFileSync(tempFilePath, Buffer.from(file.replace('base64://', ''), 'base64'))

    /** 计算MD5并重命名 */
    const md5 = await calculateFileMd5(tempFilePath)
    const filename = `${md5}.${options.contentType}`
    const newFilePath = path.join(cacheDir, filename)

    /** 如果文件已存在，直接使用 */
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(tempFilePath)
    } else {
      fs.renameSync(tempFilePath, newFilePath)
    }

    /** 发送上传成功事件 */
    const key = createUploadFileEventKey(echo)
    eventEmitter.emit(key, newFilePath)

    /** 返回成功响应 */
    createSuccessResponse(res, { status: Status.OK, md5 }, '成功')

    /** 更新缓存 */
    newCacheFile({
      url: options.url,
      hash: md5,
      type: options.contentType,
      name: filename,
      path: filename
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    createBadRequestResponse(res, `上传失败: ${errorMessage}`)
  }
}
