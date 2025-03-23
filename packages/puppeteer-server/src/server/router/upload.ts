import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { Status } from '../utils/webSocket'
import { uploadFileMap } from '../utils/map'
import { eventEmitter } from '@/utils/event'
import { cacheDir, newCacheFile } from '@/cache'
import { createUploadFileEventKey } from '../utils/key'
import { createSuccessResponse, createBadRequestResponse } from '../utils/response'

import type { RequestHandler } from 'express'

/**
 * 文件大小限制
 */
export const fileSize = 10 * 1024 * 1024

/**
 * 上传文件中间件
 */
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(cacheDir, { recursive: true })
      cb(null, cacheDir)
    },
    filename: (_req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname || ''))
    }
  }),
  fileFilter: (req, _file, callback) => {
    const echo = req.headers.echo as string
    if (!echo) {
      callback(new Error('缺少echo参数'))
      return
    }

    const map = uploadFileMap.get(echo)
    if (!map) {
      callback(new Error('非法请求'))
      return
    }

    callback(null, true)
  },
  limits: {
    fileSize
  }
})

/**
 * 上传静态资源
 */
export const uploadHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      createBadRequestResponse(res, '未上传文件或上传失败')
      return
    }

    const { path: filePath, size, mimetype } = req.file

    // 计算文件MD5值
    const md5 = await calculateFileMd5(filePath)
    const echo = req.headers.echo as string
    const options = uploadFileMap.get(echo)!
    /** 文件名称 */
    const filename = `${md5}.${options.contentType}`
    /** 重命名文件 */
    const newFilePath = path.join(cacheDir, filename)
    fs.renameSync(filePath, newFilePath)

    /** 传递上传文件成功 */
    const key = createUploadFileEventKey(echo)
    eventEmitter.emit(key, newFilePath)

    /** 返回成功 */
    createSuccessResponse(res, { status: Status.OK, md5, size, mimetype }, '成功')

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

/**
 * 计算文件MD5
 * @param filePath 文件路径
 * @returns MD5哈希值
 */
function calculateFileMd5 (filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)

    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}
