import { config } from '@/utils'
import { init } from './express'

export * from './express'
export * from './ws/client'
export * from './ws/server'
export * from './api/auth'
export * from './api/ping'
export * from './api/static'
export * from './http/server'
export * from './api/hex'
export * from './http/render'

init(config.http.port, config.http.host)
