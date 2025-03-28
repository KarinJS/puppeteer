import axios from 'axios'
import type { Config } from '../types/config'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 清除认证信息
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      // 跳转到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * 获取配置
 */
export const getConfig = async (): Promise<Config> => {
  const response = await api.get('/config/get')
  return response.data.data
}

/**
 * 更新配置
 */
export const updateConfig = async (config: Config): Promise<void> => {
  await api.post('/config/set', config)
}
