import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { findCachedBrowsers, type BrowserInfo } from './index'

/**
 * 简单的测试函数
 */
async function testFindCachedBrowsers (): Promise<void> {
  console.log('🔍 开始测试 findCachedBrowsers 函数...')
  console.log('')

  // 显示当前平台信息
  console.log(`当前平台: ${os.platform()} ${os.arch()}`)

  // 显示缓存目录
  const homeDir = os.homedir()
  const defaultCacheDir = path.join(homeDir, '.cache', 'puppeteer')
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || defaultCacheDir
  console.log(`缓存目录: ${cacheDir}`)
  console.log('')

  // 检查缓存目录是否存在
  if (!fs.existsSync(cacheDir)) {
    console.log('❌ 缓存目录不存在，无法进行测试')
    console.log('💡 你可以尝试运行 Puppeteer 下载一些浏览器，或者创建测试目录结构')
    return
  }

  console.log('✅ 缓存目录存在')

  // 列出缓存目录内容
  try {
    const contents = fs.readdirSync(cacheDir)
    console.log('📁 缓存目录内容:', contents.join(', '))
    console.log('')
  } catch (error) {
    console.log('⚠️  无法读取缓存目录内容:', error)
  }

  // 执行主要功能测试
  try {
    const startTime = Date.now()
    const browsers = await findCachedBrowsers(true) // 包含系统浏览器
    const endTime = Date.now()

    console.log(`⏱️  扫描耗时: ${endTime - startTime}ms`)
    console.log('')

    if (browsers.length === 0) {
      console.log('📭 未找到任何缓存的浏览器')
      console.log('💡 这可能是因为:')
      console.log('   - Puppeteer 还没有下载任何浏览器')
      console.log('   - 浏览器安装在不同的目录')
      console.log('   - 环境变量设置不正确')
    } else {
      console.log(`🎉 找到 ${browsers.length} 个浏览器（按版本排序，新版本优先）:`)
      console.log('')

      browsers.forEach((browser: BrowserInfo, index: number) => {
        console.log(`${index + 1}. ${browser.type}`)
        console.log(`   📍 版本: ${browser.version}`)
        console.log(`   🏷️  通道: ${browser.channel}`)
        console.log(`   📂 路径: ${browser.executablePath}`)
        console.log('')
      })

      // 统计信息
      const typeCount = browsers.reduce((acc, browser) => {
        acc[browser.type] = (acc[browser.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('📊 统计信息:')
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 个`)
      })

      // 版本分布
      console.log('')
      console.log('📈 版本分布（按版本排序）:')
      const versionGroups = browsers.reduce((acc, browser) => {
        if (!acc[browser.version]) {
          acc[browser.version] = []
        }
        acc[browser.version].push(browser.type)
        return acc
      }, {} as Record<string, string[]>)

      Object.entries(versionGroups).forEach(([version, types]) => {
        console.log(`   ${version}: ${types.join(', ')}`)
      })
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 如果直接运行此文件，则执行测试
testFindCachedBrowsers().catch(console.error)

export { testFindCachedBrowsers }
