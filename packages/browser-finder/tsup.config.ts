import { defineConfig } from 'tsup'
import { builtinModules } from 'node:module'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  format: ['esm'],
  target: 'node18',
  entry: ['src/index.ts'],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  sourcemap: false,
  external: [
    ...builtinModules,
    ...builtinModules.map((node) => `node:${node}`),
  ]
})
