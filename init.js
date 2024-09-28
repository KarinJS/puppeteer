#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function findProjectRoot (startDir) {
  let dir = startDir
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return startDir
}

const projectRoot = process.env.INIT_CWD || findProjectRoot(process.cwd())
const file = path.join(projectRoot, 'package.json')
/** 获取当前文件的路径 */
const filePath = fileURLToPath(import.meta.url)

/** 如果不处于npm包环境 不修改 */
if (filePath.includes('node_modules')) {
  const main = './' + path.relative(projectRoot, path.join(path.dirname(filePath), './lib/index.js')).replace(/\\/g, '/')
  const pkg = JSON.parse(fs.readFileSync(file, 'utf-8'))
  pkg.type = 'module'
  pkg.main = main
  pkg.types = main.replace(/js$/, 'd.ts')
  if (!pkg.scripts) pkg.scripts = {}
  pkg.scripts.start = 'node ' + main
  /** 延迟1秒写入 */
  setTimeout(() => {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2))
  }, 1000)
  fs.writeFileSync(path.join(projectRoot, 'index.js'), `import('@karinjs/puppeteer')`)
  console.log('初始化完成，请使用【node .】启动~')
}
