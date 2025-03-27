#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { Command } from 'commander'
import * as readline from 'readline'

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 询问用户输入
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

/**
 * 复制模板文件夹到目标位置
 */
const copyTemplateFiles = (templateDir: string, targetDir: string): void => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files) {
    const srcFile = path.join(templateDir, file)
    const destFile = path.join(targetDir, file)
    const stat = fs.statSync(srcFile)

    if (stat.isDirectory()) {
      copyTemplateFiles(srcFile, destFile)
    } else {
      fs.copyFileSync(srcFile, destFile)
    }
  }
}

/**
 * 检查pm2是否已安装
 */
const isPm2Installed = (): boolean => {
  try {
    execSync('pm2 --version', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

/**
 * 安装pm2
 */
const installPm2 = (): boolean => {
  console.log('正在全局安装pm2...')
  try {
    execSync('npm install -g pm2', { stdio: 'inherit' })
    console.log('✅ pm2安装成功')
    return true
  } catch (error) {
    console.error('❌ pm2安装失败，请手动安装: npm install -g pm2')
    return false
  }
}

/**
 * 执行主程序
 */
async function main () {
  console.log('👋 欢迎使用 @karinjs/puppeteer-server 脚手架工具')
  console.log('===============================================')

  // 1. 询问项目名称
  let projectName = ''
  let validProjectName = false
  const defaultProjectName = 'snapka-puppeteer'

  while (!validProjectName) {
    projectName = await question(`请输入项目名称 (默认: ${defaultProjectName}): `)

    // 如果用户直接按回车，使用默认名称
    if (!projectName.trim()) {
      projectName = defaultProjectName
    }

    const projectPath = path.resolve(process.cwd(), projectName)

    // 检查目录是否已存在且不为空
    if (fs.existsSync(projectPath)) {
      const contents = fs.readdirSync(projectPath)
      if (contents.length > 0) {
        console.error(`❌ 目录 ${projectName} 已存在且不为空，请重新输入`)
        continue
      }
    }

    validProjectName = true
  }

  const projectPath = path.resolve(process.cwd(), projectName)

  // 复制模板文件
  // 获取模板目录的路径（向上级目录查找）
  const templateDir = path.join(__dirname, '../', 'template')
  console.log(`📁 正在创建项目: ${projectName}`)
  copyTemplateFiles(templateDir, projectPath)

  // 2. 检查pm2是否已安装
  if (!isPm2Installed()) {
    console.log('⚠️ 未检测到全局安装的pm2')
    const installPm2Answer = await question('是否安装pm2？(y/N): ')

    if (installPm2Answer.toLowerCase() === 'y') {
      installPm2()
    } else {
      console.log('⚠️ 请注意: 没有pm2将无法使用后台运行功能')
    }
  }

  // 3. 安装依赖
  console.log('📦 正在安装依赖...')
  try {
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' })
    console.log('✅ 依赖安装完成')
  } catch (error) {
    console.error('⚠️ 依赖安装失败，请手动进入项目目录执行 npm install')
  }

  // 打印提示信息
  console.log('\n🎉 项目创建成功！')
  console.log('\n开始使用:')
  console.log(`cd ${projectName}`)
  console.log('npm run app    # 前台运行')
  console.log('npm run start  # 后台运行')
  console.log('\n更多命令请查看 README.md')

  rl.close()
}

// 创建命令行程序
const program = new Command()

program
  .name('create-puppeteer')
  .description('创建基于@karinjs/puppeteer-server的项目')
  .version('1.0.0')
  .action(() => {
    main().catch(error => {
      console.error('❌ 出错了:', error)
      rl.close()
      process.exit(1)
    })
  })

// 解析命令行参数
program.parse(process.argv)
