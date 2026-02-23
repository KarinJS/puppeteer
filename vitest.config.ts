import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      'node-karin': path.resolve(import.meta.dirname, 'src/__mocks__/node-karin.ts'),
      'node-karin/root': path.resolve(import.meta.dirname, 'src/__mocks__/node-karin-root.ts'),
    },
  },
})
