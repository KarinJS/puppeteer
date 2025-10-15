import { builtinModules } from 'node:module'
import type { Options } from 'tsup'

/**
 * @description `tsup` configuration options
 */
export const options = (external: Options['external'] = []): Options => ({
  entry: [], // 入口文件
  format: 'cjs', // 输出格式
  target: 'node18', // 目标环境
  splitting: true, // 是否拆分文件
  sourcemap: false, // 是否生成 sourcemap
  clean: true, // 是否清理输出目录
  dts: {
    resolve: true,
    compilerOptions: {
      removeComments: false, // 是否删除注释
      noUnusedLocals: false, // 是否删除未使用的局部变量
      noUnusedParameters: false, // 是否删除未使用的参数
      preserveConstEnums: true, // 是否保留常量枚举
      stripInternal: false, // 是否删除内部注释
      skipLibCheck: true, // 是否跳过库检查
      preserveSymlinks: false, // 是否保留符号链接
      types: ['@types/node']
    }
  }, // 是否生成 .d.ts 文件
  outDir: 'dist', // 输出目录
  treeshake: true, // 树摇优化
  minify: false, // 压缩代码
  removeNodeProtocol: false, // 是否删除 node: 协议
  ignoreWatch: [], // 忽略监视
  shims: true,
  external: [...builtinModules, ...builtinModules.map((node) => `node:${node}`), ...external],
  noExternal: [],
})
