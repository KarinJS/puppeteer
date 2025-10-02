#!/usr/bin/env node

/**
 * 命令行入口函数
 */
const main = async () => {
  try {
    const main = './dist/index.mjs'
    const { browserOptions } = await import(main)
    console.log('正在初始化浏览器...')
    const options = await browserOptions({}, true)
    console.log('浏览器初始化成功！')
    console.log('浏览器可执行路径:', options.executablePath)
  } catch (error) {
    console.error('浏览器初始化失败:', error)
    process.exit(1)
  }
}

main()
