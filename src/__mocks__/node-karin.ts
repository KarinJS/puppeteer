import { vi } from 'vitest'

export const karin = {
  emit: vi.fn(),
  on: vi.fn(),
}

export const logger = {
  info: vi.fn(),
  green: (s: string) => s,
  violet: (s: string) => s,
}

export const registerRender = vi.fn()
export const renderTpl = vi.fn()

export type Snapka = any
export type ComponentConfig = any
export type GetConfigResponse = { info: any }

export const components = {
  switch: { create: vi.fn() },
  radio: { group: vi.fn(), create: vi.fn() },
  input: { string: vi.fn(), number: vi.fn(), group: vi.fn() },
  divider: { create: vi.fn() },
}
