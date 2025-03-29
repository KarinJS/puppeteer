import { defineConfig } from 'tsup'
import { options } from '../../tsup.base'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  ...options(['@karinjs/puppeteer-core']),
  noExternal: ['decompress'],
  entry: ['src/index.ts', 'src/puppeteer-core.ts'],
})
