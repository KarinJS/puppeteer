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

const defaultCfg = {
  lines: 1000,
  apps: [
    {
      name: 'karin-puppeteer',
      script: 'index.js',
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '1G',
      restart_delay: 2000,
      merge_logs: true,
      error_file: 'logs/pm2Error.log',
      out_file: 'logs/pm2Out.log'
    }
  ]
}

const projectRoot = process.env.INIT_CWD || findProjectRoot(process.cwd())
const pm2File = path.join(projectRoot, 'pm2.json')

if (!fs.existsSync(pm2File)) {
  fs.writeFileSync(pm2File, JSON.stringify(defaultCfg, null, 2))
}

/** 处于postinstall脚本环境 无法修改package.json */
if (process.env.INIT_CWD) {
  fs.writeFileSync(path.join(projectRoot, 'index.js'), 'import(\'@karinjs/puppeteer\')\n')
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
