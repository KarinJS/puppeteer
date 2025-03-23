import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createResponse,
  createSuccessResponse,
  createUnauthorizedResponse,
  createAccessTokenExpiredResponse,
  createRefreshTokenExpiredResponse,
  createNotFoundResponse,
  createServerErrorResponse,
  createBadRequestResponse,
  createPayloadTooLargeResponse,
  createMethodNotAllowedResponse,
  createForbiddenResponse,
  HTTPStatusCode
} from './response'

// 模拟全局logger
vi.stubGlobal('logger', {
  debug: vi.fn()
})

describe('Response工具测试', () => {
  let res: any

  beforeEach(() => {
    vi.clearAllMocks()
    // 创建模拟响应对象
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })

  describe('createResponse', () => {
    it('应该创建带有状态码、数据和消息的响应', () => {
      const code = HTTPStatusCode.OK
      const data = { test: 'data' }
      const message = 'test message'

      createResponse(res, code, data, message)

      expect(res.status).toHaveBeenCalledWith(code)
      expect(res.json).toHaveBeenCalledWith({
        code,
        data,
        message
      })
      expect(logger.debug).toHaveBeenCalled()
    })

    it('应该使用默认消息', () => {
      const code = HTTPStatusCode.OK
      const data = { test: 'data' }

      createResponse(res, code, data)

      expect(res.status).toHaveBeenCalledWith(code)
      expect(res.json).toHaveBeenCalledWith({
        code,
        data,
        message: ''
      })
    })
  })

  describe('createSuccessResponse', () => {
    it('应该创建成功响应', () => {
      const data = { test: 'data' }
      const message = 'test success'

      createSuccessResponse(res, data, message)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.OK)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.OK,
        data,
        message
      })
    })

    it('应该使用默认成功消息', () => {
      const data = { test: 'data' }

      createSuccessResponse(res, data)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.OK)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.OK,
        data,
        message: '成功'
      })
    })
  })

  describe('错误响应函数', () => {
    it('应该创建未授权响应', () => {
      createUnauthorizedResponse(res, '自定义未授权消息')

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.Unauthorized)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.Unauthorized,
        data: null,
        message: '自定义未授权消息'
      })
    })

    it('应该创建访问令牌过期响应', () => {
      createAccessTokenExpiredResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.AccessTokenExpired)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.AccessTokenExpired,
        data: null,
        message: '访问令牌已过期'
      })
    })

    it('应该创建刷新令牌过期响应', () => {
      createRefreshTokenExpiredResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.RefreshTokenExpired)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.RefreshTokenExpired,
        data: null,
        message: '刷新令牌已过期'
      })
    })

    it('应该创建未找到响应', () => {
      createNotFoundResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.NotFound)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.NotFound,
        data: null,
        message: '未找到'
      })
    })

    it('应该创建服务器错误响应', () => {
      createServerErrorResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.InternalServerError)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.InternalServerError,
        data: null,
        message: '服务器错误'
      })
    })

    it('应该创建参数错误响应', () => {
      createBadRequestResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.BadRequest)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.BadRequest,
        data: null,
        message: '参数错误'
      })
    })

    it('应该创建请求过大响应', () => {
      createPayloadTooLargeResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.PayloadTooLarge)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.PayloadTooLarge,
        data: null,
        message: '请求体过大'
      })
    })

    it('应该创建方法不允许响应', () => {
      createMethodNotAllowedResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.MethodNotAllowed)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.MethodNotAllowed,
        data: null,
        message: '方法不允许'
      })
    })

    it('应该创建禁止访问响应', () => {
      createForbiddenResponse(res)

      expect(res.status).toHaveBeenCalledWith(HTTPStatusCode.Forbidden)
      expect(res.json).toHaveBeenCalledWith({
        code: HTTPStatusCode.Forbidden,
        data: null,
        message: '禁止访问'
      })
    })
  })
})
