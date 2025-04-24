import { defineConfig } from 'tsup'
import { builtinModules } from 'node:module'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  format: 'esm',
  target: 'node18',
  entry: ['src/index.ts'],
  outDir: '../puppeteer-types/dist',
  dts: { resolve: true, only: true },
  external: [
    ...builtinModules,
    ...builtinModules.map((node) => `node:${node}`),
  ]
})
