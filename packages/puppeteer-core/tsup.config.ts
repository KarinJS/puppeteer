import { defineConfig } from 'tsup'
import { options } from '../../tsup.base'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  ...options(),
  noExternal: ['decompress'],
  entry: ['src/index.ts'],
})
