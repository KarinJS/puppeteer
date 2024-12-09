#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const findProjectRoot = (startDir) => {
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
/** 处于postinstall脚本环境 无法修改package.json */
if (process.env.INIT_CWD) {
  fs.writeFileSync(path.join(projectRoot, 'index.js'), `import('@karinjs/puppeteer')\n`)
  console.log('初始化完成，请使用【node .】启动~')
} else {
  const file = process.cwd() + '/package.json'
  /** 获取当前文件的路径 */
  const filePath = fileURLToPath(import.meta.url)

  /** 如果不处于npm包环境 不修改 */
  if (filePath.includes('node_modules')) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf-8'))
    pkg.type = 'module'
    if (!pkg.scripts) pkg.scripts = {}
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2))
  }

  console.log('初始化完成，请使用【node .】启动~')
  console.log('tips: 全部功能请使用【npx k】查看')
}
