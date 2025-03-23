import lodash from 'lodash'
import { getConfig, updateConfig } from '../../utils/config'
import { createSuccessResponse, createBadRequestResponse } from '../utils/response'
import type { RequestHandler } from 'express'

/**
 * 获取配置
 */
export const getConfigRouter: RequestHandler = (_, res) => {
  const config = getConfig()
  createSuccessResponse(res, config, '获取配置成功')
}

/**
 * 更新配置
 */
export const setConfigRouter: RequestHandler = (req, res) => {
  const config = getConfig()
  const newConfig = {
    ...req.body,
    env: {}
  }
  req.body?.env.forEach((item: { key: string, value: string }) => {
    if (item.value === 'null') {
      newConfig.env[item.key] = null
    } else {
      newConfig.env[item.key] = item.value
    }
  })

  /** 如果一致则不更新 */
  if (lodash.isEqual(config, newConfig)) {
    createBadRequestResponse(res, '配置未发生变化')
    return
  }

  updateConfig(config, { ...config, ...newConfig })
  createSuccessResponse(res, newConfig, '更新配置成功')
}
