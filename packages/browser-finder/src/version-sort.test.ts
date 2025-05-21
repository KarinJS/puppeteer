import { compareVersions } from './index'
import { BrowserInfo, BrowserType, BrowserSource, ReleaseChannel } from './types'

/**
 * 测试版本号排序功能
 */
async function testVersionSort () {
  console.log('测试版本号排序:')

  // 创建测试数据
  const versions = [
    '100.0.4896.127',
    '114.0.5735.199',
    '115.0.5790.170',
    '116.0.5845.96',
    undefined,
    '99.0.4844.51',
    '116.0.5845.110',
    '116.0.5845.96',
    '116',
    '116.0.5845'
  ]

  // 打乱顺序
  const shuffled = [...versions].sort(() => Math.random() - 0.5)

  console.log('原始顺序:', shuffled)

  // 排序
  const sorted = [...shuffled].sort(compareVersions)

  console.log('排序后:', sorted)

  // 预期结果 (从新到旧)
  const expected = [
    '116.0.5845.110', // 最新
    '116.0.5845.96',  // 相同版本会保留
    '116.0.5845.96',
    '116.0.5845',     // 部分版本号
    '116',            // 只有主版本号
    '115.0.5790.170',
    '114.0.5735.199',
    '100.0.4896.127',
    '99.0.4844.51',   // 最旧
    undefined         // 未知版本排在最后
  ]

  console.log('预期顺序:', expected)

  // 验证结果
  let isCorrect = true
  for (let i = 0; i < expected.length; i++) {
    if (sorted[i] !== expected[i]) {
      isCorrect = false
      console.log(`位置 ${i} 不匹配: 期望 ${expected[i]}, 实际 ${sorted[i]}`)
    }
  }

  console.log('排序正确:', isCorrect ? '✅ 是' : '❌ 否')

  // 测试浏览器对象排序
  const browsers: BrowserInfo[] = shuffled.map((version, index) => ({
    type: BrowserType.CHROME,
    executablePath: `/path/to/chrome${index}`,
    version,
    source: BrowserSource.DEFAULT_PATH,
    channel: ReleaseChannel.STABLE
  }))

  const sortedBrowsers = [...browsers].sort((a, b) => compareVersions(a.version, b.version))

  console.log('\n浏览器对象排序结果:')
  sortedBrowsers.forEach(browser => {
    console.log(`版本: ${browser.version || '未知'}, 路径: ${browser.executablePath}`)
  })
}

// 执行测试
testVersionSort().catch(console.error)
