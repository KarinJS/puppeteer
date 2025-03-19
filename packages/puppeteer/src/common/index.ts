import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import type { DownloadOptions, DownloadResult } from '../types/download'

/**
 * 谷歌源
 */
export const GOOGLE = 'https://storage.googleapis.com/chrome-for-testing-public'

/**
 * 阿里云源
 */
export const NPMMIRROR = 'https://cdn.npmmirror.com/binaries/chrome-for-testing'

/**
 * 当前系统是否为Windows
 */
export const isWindows = os.platform() === 'win32'

/**
 * 构建日志
 * @param message - 日志消息
 * @returns 日志文本
 */
export const createLog = (message: string) => {
  return `[@karinjs/@karinjs/puppeteer-core] ${message}`
}

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

/**
 * 获取当前系统
 */
export const platform = () => {
  if (process.platform === 'linux') {
    return 'linux64'
  }

  if (process.platform === 'darwin') {
    const platform = os.arch() === 'arm64' ? 'mac-arm64' : 'mac-x64'
    return platform
  }

  if (process.platform === 'win32') {
    const platform = os.arch() === 'x64' ? 'win64' : 'win32'
    return platform
  }
  throw new Error(createLog(`不支持的系统: ${process.platform}`))
}

/**
 * 检查是否存在HTTP代理
 * @returns 代理URL或null
 */
export const getProxyUrl = (): string | null => {
  if (process.env.NO_PROXY) return null
  return process.env.HTTPS_PROXY || process.env.https_proxy || null
}

/**
 * 获取请求选项，自动处理代理
 * @param url - 目标URL
 * @param options - 基础请求选项
 * @returns 处理后的请求选项
 */
export const getRequestOptions = (
  url: string,
  options: https.RequestOptions = {}
): https.RequestOptions => {
  const proxyUrl = getProxyUrl()
  const urlObj = new URL(url)

  /** 不存在代理 */
  if (!proxyUrl) {
    return {
      ...options,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
      path: urlObj.pathname + urlObj.search,
      protocol: urlObj.protocol
    }
  }

  const proxyUrlObj = new URL(proxyUrl)
  const proxyOptions: https.RequestOptions = {
    ...options,
    host: proxyUrlObj.hostname,
    port: proxyUrlObj.port || '443',
    path: url, // 完整URL作为路径
    headers: {
      ...(options.headers || {}),
      Host: urlObj.host
    }
  }

  /** 如果代理需要认证 */
  if (proxyUrlObj.username && proxyUrlObj.password) {
    const auth = `${proxyUrlObj.username}:${proxyUrlObj.password}`
    proxyOptions.headers = {
      ...proxyOptions.headers,
      'Proxy-Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
    }
  }

  return proxyOptions
}

/**
 * 传入urls 使用promise.race 返回最快结果
 * @param urls - 请求地址列表
 * @returns 最快结果
 */
export const ping = async (urls: string[]): Promise<string> => {
  /** 存储所有请求对象，便于后续取消 */
  const requests: http.ClientRequest[] = []

  /**
   * 用于取消所有其他请求的函数
   * @param except - 例外请求
   */
  const cancelAllRequests = (except?: http.ClientRequest) => {
    for (const req of requests) {
      if (req !== except && !req.destroyed) {
        req.destroy()
      }
    }
  }

  /** 创建所有请求的Promise */
  const requestPromises = urls.map(url => {
    return new Promise<string>((resolve, reject) => {
      try {
        /** 获取适合当前环境的请求选项 */
        const options = getRequestOptions(url, {
          method: 'HEAD',
          timeout: 10000
        })

        /** 创建请求 */
        const request = https.request(options, (res) => {
          cancelAllRequests(request)
          resolve(url)
        })

        request.on('error', (err) => {
          reject(err)
        })

        request.on('timeout', () => {
          request.destroy()
          reject(new Error(createLog(`请求超时: ${url}`)))
        })

        /** 存储请求对象 */
        requests.push(request)
        /** 发送请求 */
        request.end()
      } catch (err) {
        reject(err)
      }
    })
  })

  try {
    /** 竞争最快成功的请求和超时 */
    const result = await Promise.race(requestPromises)

    return result
  } catch (error) {
    /** 可能是单个请求错误，还需检查是否所有请求都失败 */
    const results = await Promise.all(requestPromises.map(p => p.catch(e => e)))
    /** 查找任何成功的结果 */
    const successResult: string | undefined = results.find(r => !(r instanceof Error))
    if (successResult) return successResult
    /** 所有请求都失败了 */
    throw new Error(createLog('所有URL请求失败'))
  } finally {
    cancelAllRequests()
  }
}

/**
 * 下载文件的纯函数
 * @param url - 下载地址
 * @param savePath - 保存路径
 * @param options - 下载选项
 * @returns 下载结果
 */
export const download = async (
  url: string,
  savePath: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> => {
  const defaultOptions = {
    timeout: 30000,
    overwrite: false,
    headers: {},
    onProgress: undefined
  }

  const opts = { ...defaultOptions, ...options }

  /**
   * 准备保存目录
   */
  const prepareDirectory = (): boolean => {
    try {
      const dirname = path.dirname(savePath)
      mkdirs(dirname)

      /** 检查文件是否已存在 */
      if (!opts.overwrite && fs.existsSync(savePath)) {
        return false
      }
      return true
    } catch (error: any) {
      throw new Error(createLog(`创建目录失败: ${error?.message}`))
    }
  }

  /**
   * 处理HTTP重定向
   */
  const handleRedirect = async (response: http.IncomingMessage): Promise<DownloadResult> => {
    const redirectUrl = response.headers.location

    if (!redirectUrl) {
      throw new Error(createLog('重定向缺少Location头'))
    }

    // 处理相对URL
    const finalRedirectUrl = redirectUrl.startsWith('http')
      ? redirectUrl
      : new URL(redirectUrl, url).toString()

    // 递归下载重定向地址
    return await download(finalRedirectUrl, savePath, opts)
  }

  /**
   * 执行下载请求
   */
  const executeRequest = async (): Promise<DownloadResult> => {
    // 创建请求选项
    const requestOptions = getRequestOptions(url, {
      method: 'GET',
      timeout: opts.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...opts.headers
      }
    })

    /** 选择合适的HTTP/HTTPS模块 */
    const requester = url.startsWith('https:') ? https : http

    return new Promise<DownloadResult>((resolve, reject) => {
      const request = requester.request(requestOptions, async (response) => {
        const statusCode = response.statusCode || 0

        /** 处理重定向 */
        if ([301, 302, 307, 308].includes(statusCode)) {
          try {
            const result = await handleRedirect(response)
            resolve(result)
          } catch (error) {
            reject(error)
          }
          return
        }

        /** 处理错误状态码 */
        if (statusCode >= 400) {
          reject(new Error(createLog(`HTTP错误: ${statusCode}`)))
          return
        }

        /** 获取内容长度 */
        const contentLength = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedBytes = 0

        /** 创建文件写入流 */
        const fileStream = fs.createWriteStream(savePath)

        /** 设置错误处理 */
        fileStream.on('error', (err: Error) => {
          reject(new Error(createLog(`写入文件失败: ${err.message}`)))
        })

        /** 监听下载完成 */
        fileStream.on('finish', () => {
          fileStream.close()
          resolve({
            success: true,
            filePath: savePath,
            statusCode,
            contentLength
          })
        })

        /** 监听下载进度 */
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length
          if (opts.onProgress && contentLength > 0) {
            opts.onProgress(downloadedBytes, contentLength)
          }
        })

        /** 管道连接响应流和文件流 */
        response.pipe(fileStream)
      })

      /** 处理请求错误 */
      request.on('error', (error: Error) => {
        reject(new Error(createLog(`请求错误: ${error.message}`)))
      })

      /** 处理请求超时 */
      request.on('timeout', () => {
        request.destroy()
        reject(new Error(createLog(`请求超时: ${url}`)))
      })

      /** 发送请求 */
      request.end()
    })
  }

  try {
    /** 准备保存目录 */
    if (!prepareDirectory()) {
      return {
        success: false,
        error: new Error(createLog(`文件已存在: ${savePath}`))
      }
    }

    /** 执行下载 */
    return await executeRequest()
  } catch (error) {
    try {
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath)
    } catch { }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(createLog(error?.toString?.() || ''))
    }
  }
}

/**
 * 调试日志
 * @param args - 日志参数
 */
export const debug = process.env.NODE_ENV === 'development'
  ? (...args: any[]) => console.log(...args)
  : () => { }
