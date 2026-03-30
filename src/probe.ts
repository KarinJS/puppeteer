import { logger } from 'node-karin'

export interface ProbeOptions<T> {
  /** 探针请求的 URL 列表 */
  urls: string[]
  /** 每个探针之间的延迟（毫秒），默认 300 */
  staggerDelay?: number
  /** 单个请求的超时时间（毫秒），默认 3000 */
  timeout?: number
  /** 发起请求的函数 */
  request: (url: string, signal: AbortSignal) => Promise<T>
  /** 日志标签 */
  tag: string
}

export interface ProbeResult<T> {
  /** 最快成功的结果 */
  result: T
  /** 最快成功的 URL */
  url: string
  /** 总耗时（毫秒） */
  elapsed: number
}

/**
 * 可中断的延迟
 *
 * signal 被 abort 时立即 reject，用于取消尚未启动的探针
 */
const abortableDelay = (ms: number, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * 通用探针竞速工具
 *
 * 同时向多个 URL 发起请求，首个 URL 立即请求，后续 URL 按 staggerDelay 延迟逐个启动。
 * 每个请求都有独立的超时控制（默认 10s），超时视为失败。
 * 任一成功后通过 AbortController 取消剩余请求和定时器。
 * 只有所有 URL 都失败或超时时才抛出错误。
 *
 * @returns 最快成功的结果、对应的 URL 和耗时
 */
export const probeRace = async <T>(options: ProbeOptions<T>): Promise<ProbeResult<T>> => {
  const { urls, staggerDelay = 300, timeout = 3000, request, tag } = options
  const controller = new AbortController()
  const startTime = Date.now()

  if (!urls || urls.length === 0) {
    logger.info(`[${tag}] 探针竞速失败：urls 不能为空`)
    throw new Error('探针竞速失败：urls 不能为空')
  }
  logger.info(`[${tag}] 探针竞速开始，候选节点: ${urls.join(' | ')}`)

  const probePromises = urls.map(async (url, index) => {
    if (index > 0) {
      await abortableDelay(staggerDelay * index, controller.signal)
    }

    const probeStart = Date.now()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(timeout)])
    const result = await request(url, signal)
    const probeElapsed = Date.now() - probeStart
    logger.info(`[${tag}] 探针 #${index + 1} 成功: ${url} (${probeElapsed}ms)`)
    return { result, url }
  })

  try {
    const { result, url } = await Promise.any(probePromises)
    const elapsed = Date.now() - startTime
    controller.abort()
    logger.info(`[${tag}] 探针竞速完成，最快节点: ${url} (总耗时 ${elapsed}ms)`)
    return { result, url, elapsed }
  } catch {
    const elapsed = Date.now() - startTime
    logger.info(`[${tag}] 探针竞速失败，所有节点均不可用 (${elapsed}ms)`)
    throw new Error(`所有探针均不可用 (${elapsed}ms): ${urls.join(', ')}`)
  }
}
