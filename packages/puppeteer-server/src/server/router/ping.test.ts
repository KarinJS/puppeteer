import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ping } from './ping'
import { createSuccessResponse } from '../utils/response'

// 模拟依赖
vi.mock('../utils/response', () => ({
  createSuccessResponse: vi.fn()
}))

describe('Ping路由测试', () => {
  let req: any
  let res: any

  beforeEach(() => {
    vi.clearAllMocks()
    req = {}
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })

  it('应该返回ping的响应', () => {
    // 调用ping路由处理函数
    ping(req, res, () => { })

    // 验证createSuccessResponse是否被正确调用
    expect(createSuccessResponse).toHaveBeenCalledWith(
      res,
      { ping: 'pong' },
      '永远相信美好的事情即将发生'
    )
  })
})
