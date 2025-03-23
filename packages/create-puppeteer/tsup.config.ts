import { defineConfig } from 'tsup'
import { options } from '../../tsup.base'

/**
 * @description `tsup` configuration options
 */
export default defineConfig({
  ...options(),
  noExternal: ['decompress'],
  entry: ['src/index.ts'],
  splitting: false,
  dts: false,
  external: [
    // Vue compiler-sfc使用的所有模板引擎依赖
    'velocityjs', 'dustjs-linkedin', 'atpl', 'liquor', 'twig', 'ejs', 'eco', 'jazz',
    'jqtpl', 'hamljs', 'hamlet', 'whiskers', 'haml-coffee', 'hogan.js', 'templayed',
    'handlebars', 'underscore', 'walrus', 'mustache', 'just', 'ect', 'mote', 'toffee',
    'dot', 'bracket-template', 'ractive', 'htmling', 'babel-core', 'plates',
    'react-dom/server', 'react', 'vash', 'slm', 'marko', 'teacup/lib/express',
    'coffee-script', 'squirrelly', 'twing'
  ]
})
