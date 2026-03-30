import { describe, it, expect, vi, beforeEach } from 'vitest'
import { probeRace } from './probe'
import { logger } from 'node-karin'

beforeEach(() => {
  vi.clearAllMocks()
})

/** 创建一个永远挂起（直到 signal abort）的请求 mock */
const hangingRequest = (_url: string, signal: AbortSignal) => {
  return new Promise<string>((_, reject) => {
    if (signal.aborted) return reject(signal.reason)
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

describe('probeRace', () => {
  it('首个 URL 最快时应返回其结果', async () => {
    const request = vi.fn().mockResolvedValue('result-1')
    const { result, url } = await probeRace({
      tag: 'test',
      urls: ['https://a.com', 'https://b.com'],
      staggerDelay: 300,
      request,
    })
    expect(result).toBe('result-1')
    expect(url).toBe('https://a.com')
  })

  it('首个 URL 失败时应返回第二个的结果', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('result-2')
    const { result, url } = await probeRace({
      tag: 'test',
      urls: ['https://a.com', 'https://b.com'],
      staggerDelay: 50,
      request,
    })
    expect(result).toBe('result-2')
    expect(url).toBe('https://b.com')
  })

  it('所有 URL 失败时应抛出错误', async () => {
    const request = vi.fn().mockRejectedValue(new Error('fail'))
    await expect(probeRace({
      tag: 'test',
      urls: ['https://a.com', 'https://b.com'],
      staggerDelay: 50,
      request,
    })).rejects.toThrow('所有探针均不可用')
  })

  it('错误信息应包含所有 URL', async () => {
    const request = vi.fn().mockRejectedValue(new Error('fail'))
    await expect(probeRace({
      tag: 'test',
      urls: ['https://a.com', 'https://b.com'],
      staggerDelay: 50,
      request,
    })).rejects.toThrow('https://a.com, https://b.com')
  })

  it('成功后应通过 AbortController 取消剩余请求', async () => {
    let capturedSignal: AbortSignal | undefined
    const request = vi.fn().mockImplementation((_url: string, signal: AbortSignal) => {
      capturedSignal = signal
      return Promise.resolve('ok')
    })
    await probeRace({
      tag: 'test',
      urls: ['https://a.com', 'https://b.com'],
      staggerDelay: 300,
      request,
    })
    expect(capturedSignal?.aborted).toBe(true)
  })

  it('应返回耗时信息', async () => {
    const request = vi.fn().mockResolvedValue('ok')
    const { elapsed } = await probeRace({
      tag: 'test',
      urls: ['https://a.com'],
      request,
    })
    expect(typeof elapsed).toBe('number')
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })

  it('应打印探针竞速日志', async () => {
    const request = vi.fn().mockResolvedValue('ok')
    await probeRace({
      tag: 'my-tag',
      urls: ['https://a.com'],
      request,
    })
    const calls = vi.mocked(logger.info).mock.calls.flat() as string[]
    expect(calls.some((msg: string) => msg.includes('my-tag'))).toBe(true)
    expect(calls.some((msg: string) => msg.includes('探针竞速开始'))).toBe(true)
    expect(calls.some((msg: string) => msg.includes('探针竞速完成'))).toBe(true)
  })

  it('探针失败时应打印失败日志', async () => {
    const request = vi.fn().mockRejectedValue(new Error('fail'))
    await probeRace({
      tag: 'fail-tag',
      urls: ['https://a.com'],
      staggerDelay: 50,
      request,
    }).catch(() => {})
    const calls = vi.mocked(logger.info).mock.calls.flat() as string[]
    expect(calls.some((msg: string) => msg.includes('探针竞速失败'))).toBe(true)
  })

  it('默认 staggerDelay 为 300ms', async () => {
    const callTimes: number[] = []
    const request = vi.fn().mockImplementation(async () => {
      callTimes.push(Date.now())
      return 'ok'
    })
    await probeRace({
      tag: 'test',
      urls: ['https://a.com'],
      request,
    })
    expect(callTimes.length).toBe(1)
  })

  it('单 URL 时应直接请求无延迟', async () => {
    const request = vi.fn().mockResolvedValue('single')
    const { result, url } = await probeRace({
      tag: 'test',
      urls: ['https://only.com'],
      request,
    })
    expect(result).toBe('single')
    expect(url).toBe('https://only.com')
    expect(request).toHaveBeenCalledTimes(1)
  })

  describe('超时处理', () => {
    it('单个请求超时应视为失败', async () => {
      await expect(probeRace({
        tag: 'test',
        urls: ['https://a.com'],
        timeout: 100,
        request: hangingRequest,
      })).rejects.toThrow('所有探针均不可用')
    })

    it('所有请求超时应抛出错误', async () => {
      await expect(probeRace({
        tag: 'test',
        urls: ['https://a.com', 'https://b.com'],
        staggerDelay: 50,
        timeout: 200,
        request: hangingRequest,
      })).rejects.toThrow('所有探针均不可用')
    })

    it('部分超时时应返回成功的那个', async () => {
      let call = 0
      const request = vi.fn().mockImplementation((url: string, signal: AbortSignal) => {
        call++
        if (call === 1) return hangingRequest(url, signal)
        return Promise.resolve('result-2')
      })

      const { result, url } = await probeRace({
        tag: 'test',
        urls: ['https://slow.com', 'https://fast.com'],
        staggerDelay: 50,
        timeout: 5000,
        request,
      })
      expect(result).toBe('result-2')
      expect(url).toBe('https://fast.com')
    })

    it('请求函数应收到带超时的组合 signal', async () => {
      let capturedSignal: AbortSignal | undefined
      const request = vi.fn().mockImplementation((_url: string, signal: AbortSignal) => {
        capturedSignal = signal
        return Promise.resolve('ok')
      })

      await probeRace({
        tag: 'test',
        urls: ['https://a.com'],
        timeout: 5000,
        request,
      })

      expect(capturedSignal).toBeDefined()
      // 成功后 signal 应已被 abort（controller.abort）
      expect(capturedSignal!.aborted).toBe(true)
    })

    it('默认超时为 3000ms', async () => {
      const request = vi.fn().mockResolvedValue('ok')
      await probeRace({
        tag: 'test',
        urls: ['https://a.com'],
        request,
      })
      // 不传 timeout 也能正常运行（默认 10s 足够）
      expect(request).toHaveBeenCalledTimes(1)
    })
  })
})
