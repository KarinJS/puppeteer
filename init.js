#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const file = path.join(process.cwd(), 'package.json')
/** 获取当前文件的路径 */
const filePath = fileURLToPath(import.meta.url)

/** 如果不处于npm包环境 不修改 */
if (filePath.includes('node_modules')) {
  const main = './' + path.relative(process.cwd(), path.join(path.dirname(filePath), './lib/index.js'))
  const pkg = JSON.parse(fs.readFileSync(file, 'utf-8'))
  pkg.type = 'module'
  pkg.main = main
  pkg.types = main.replace(/js$/, 'd.ts')
  if (!pkg.scripts) pkg.scripts = {}
  pkg.scripts.start = 'node ' + main
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2))
}
