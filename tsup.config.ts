import { builtinModules } from 'node:module'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/web.config.ts'],
  format: 'esm',
  target: 'node18',
  splitting: true,
  sourcemap: false,
  clean: true,
  dts: {
    resolve: true,
    compilerOptions: {
      removeComments: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      preserveConstEnums: true,
      stripInternal: false,
      skipLibCheck: true,
      preserveSymlinks: false,
      types: ['@types/node'],
    },
  },
  outDir: 'dist',
  treeshake: true,
  minify: false,
  removeNodeProtocol: false,
  shims: true,
  external: [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
    '@snapka/puppeteer',
    'node-karin',
  ],
})
