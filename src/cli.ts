#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { program } from 'commander'
import { fileURLToPath } from 'node:url'
import { exec as execAsync, spawn, fork } from 'node:child_process'
import type { ExecOptions } from 'node:child_process'

const basename = 'pm2.json'
const pm2File = path.join(process.cwd(), basename)

/** 前台启动 */
const start = async () => {
  fork(process.cwd() + './index.js')
}

/** pm2运行 */
const pm2 = async () => {
  await init()
  await exec(`pm2 start ${basename}`)
  console.log('[pm2] 启动成功')
  console.log('[pm2] 重启服务: npx k rs')
  console.log('[pm2] 查看日志: npx k log')
  console.log('[pm2] 停止服务: npx k stop')
  console.log('[pm2] 查看监控: pm2 monit')
  console.log('[pm2] 查看列表: pm2 list')
  process.exit(0)
  // const str = data.toString().split('\n')

  // /** 提取每行的第一个ID */
  // const ids = str
  //   .map(line => {
  //     const parts = line.split('│').map(part => part.trim())
  //     return parts[1]
  //   })
  //   .map(Number)
  //   .filter(id => !isNaN(id))

  // const maxId = Math.max(...ids)
  // console.log('maxId:', maxId)
}

/** pm2停止 */
const stop = async () => {
  await exec(`pm2 del ${basename}`)
  console.log('[pm2] 停止成功')
  process.exit()
}

/** pm2重启 */
const restart = async () => {
  await exec(`pm2 restart ${basename}`)
  console.log('[pm2] 重启成功')
  process.exit()
}

/** pm2日志 */
const log = async () => {
  const cfg = config()
  const name = cfg.apps[0].name
  const lines = cfg.lines + ''
  const prefix = process.platform === 'win32' ? 'pm2.cmd' : 'pm2'
  spawn(prefix, ['logs', name, '--lines', lines], { stdio: 'inherit', shell: true })
}

/** pm2配置 */
const config = () => {
  let cfg: {
    lines: number,
    apps: {
      name: string,
      script: string,
      autorestart: boolean,
      max_restarts: number,
      max_memory_restart: string,
      restart_delay: number,
      merge_logs: boolean,
      error_file: string,
      out_file: string
    }[]
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

  try {
    cfg = JSON.parse(fs.readFileSync(pm2File, 'utf-8'))
  } catch {
    cfg = defaultCfg
  }

  if (!cfg) cfg = defaultCfg
  return cfg
}

/**
 * 初始化pm2
 */
const init = async () => {
  const version = await exec('pm2 -v')
  if (version.status) return

  const pm2 = await exec('npm install -g pm2')
  if (pm2.status) return
  throw pm2.error
}

/**
 * 执行命令
 * @param cmd 命令
 * @param options 选项
 */
const exec = (cmd: string, options: ExecOptions = { cwd: process.cwd(), env: process.env }): Promise<{
  status: boolean
  error: Error | null
  stdout: string
  stderr: string
}> => {
  return new Promise((resolve) => {
    execAsync(cmd, options, (error, stdout, stderr) => {
      const status = !error
      resolve({ error, stdout, stderr, status })
    })
  })
}

const pkg = fileURLToPath(new URL('../package.json', import.meta.url))
const version = JSON.parse(fs.readFileSync(pkg, 'utf-8')).version

program.version(version, '-v, --version', '显示版本号')
program.command('.').description('前台启动').action(start)
program.command('start').description('前台启动').action(start)
program.command('init').description('初始化').action(init)
program.command('pm2').description('[pm2] 后台运行').action(pm2)
program.command('stop').description('[pm2] 停止后台运行').action(stop)
program.command('rs').description('[pm2] 重启后台进程').action(restart)
program.command('log').description('[pm2] 查看日志').action(log)
program.parse(process.argv)
