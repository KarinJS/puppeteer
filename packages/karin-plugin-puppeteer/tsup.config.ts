import { defineConfig } from 'tsup'
import { options } from '../../tsup.base'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  ...options(['@karinjs/puppeteer', 'node-karin']),
  entry: ['src/index.ts', 'src/web.config.ts'],
  format: 'esm',
})
