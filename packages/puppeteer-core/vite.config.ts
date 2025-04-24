import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      formats: ['es'],
      fileName: (_, name) => `${name}.mjs`,
      entry: ['src/index.ts'],
    },
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((mod) => `node:${mod}`),
        'bufferutil',
        'utf-8-validate',
      ],
      output: {
        inlineDynamicImports: true,
      },
      cache: false,
    },
    minify: 'terser',
    commonjsOptions: {
      include: [
        /node_modules/
      ],
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
    },
  },
})
