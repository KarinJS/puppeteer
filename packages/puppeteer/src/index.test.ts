import fs from 'node:fs'
import { launch } from './index'
import path from 'node:path'

// 测试用例配置
interface TestCase {
  name: string
  options: any
  validate?: (result: any) => boolean
}

// 检查命令行参数
const isAutoMode = process.argv.includes('--auto')

async function main () {
  process.env.NODE_ENV = 'development'
  const puppeteer = await launch({ debug: true })

  const cwd = path.resolve(__dirname, '../../..')
  const tmp = path.resolve(cwd, 'tmp')
  const test = path.resolve(cwd, 'test')
  fs.mkdirSync(tmp, { recursive: true })
  fs.mkdirSync(test, { recursive: true })

  // 测试HTML文件路径
  const file = path.resolve(test, 'test.html')

  // 如果测试HTML文件不存在，创建一个简单的HTML文件
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Puppeteer 测试页面</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Puppeteer 自动化测试</h1>
          <div id="container">
            <p>这是一个用于测试的HTML页面</p>
            <div id="timestamp"></div>
          </div>
          <script>
            document.getElementById('timestamp').textContent = '生成时间: ' + new Date().toLocaleString();
          </script>
        </body>
      </html>
    `)
  }

  // 创建截图函数
  const screenshot = async (options = {}) => {
    console.time('截图耗时')
    const result = await puppeteer.screenshot({
      file,
      encoding: 'binary',
      type: 'png',
      multiPage: false,
      pageGotoParams: {
        waitUntil: 'networkidle0'
      },
      ...options
    })

    console.timeEnd('截图耗时')
    if (!result.status) {
      throw new Error(result.data.message)
    }

    const imagePath = path.resolve(tmp, 'image.png')
    fs.writeFileSync(imagePath, Buffer.from(result.data as unknown as string))
    console.log(`截图已保存至: ${imagePath}`)
    return result
  }

  // 如果是自动化模式，执行自动化测试
  if (isAutoMode) {
    // 测试用例集合
    const testCases: TestCase[] = [
      {
        name: '基本截图功能测试',
        options: {
          file,
          encoding: 'binary',
          type: 'png',
          multiPage: false,
          pageGotoParams: {
            waitUntil: 'networkidle0'
          }
        },
        validate: (result) => result.status === true
      },
      {
        name: '全页面截图测试',
        options: {
          file,
          encoding: 'binary',
          type: 'png',
          fullPage: true,
          pageGotoParams: {
            waitUntil: 'networkidle0'
          }
        },
        validate: (result) => result.status === true
      },
      {
        name: '指定元素截图测试',
        options: {
          file,
          encoding: 'binary',
          type: 'png',
          selector: '#container',
          pageGotoParams: {
            waitUntil: 'networkidle0'
          }
        },
        validate: (result) => result.status === true
      }
    ]

    // 运行所有测试用例
    console.log('开始执行自动化测试...\n')
    let passed = 0
    let failed = 0

    for (const testCase of testCases) {
      try {
        console.log(`执行测试: ${testCase.name}`)
        console.time(`${testCase.name} 耗时`)

        const result = await puppeteer.screenshot(testCase.options)

        console.timeEnd(`${testCase.name} 耗时`)

        // 保存截图结果
        if (result.status) {
          const imagePath = path.resolve(tmp, `${testCase.name.replace(/\s+/g, '_')}.png`)
          fs.writeFileSync(imagePath, Buffer.from(result.data as unknown as string))
          console.log(`截图已保存至: ${imagePath}`)
        }

        // 验证结果
        const isValid = testCase.validate ? testCase.validate(result) : result.status

        if (isValid) {
          console.log(`✅ 测试通过: ${testCase.name}\n`)
          passed++
        } else {
          console.log(`❌ 测试失败: ${testCase.name}`)
          console.log(`错误信息: ${result.status ? '未知错误' : result.data.message}\n`)
          failed++
        }
      } catch (error) {
        console.log(`❌ 测试异常: ${testCase.name}`)
        console.log(`错误信息: ${error instanceof Error ? error.message : String(error)}\n`)
        failed++
      }
    }

    // 测试HMR配置
    try {
      console.log('执行测试: HMR配置测试')
      await puppeteer.hmrConfig({ debug: false, hmr: true })
      console.log('✅ HMR配置测试通过\n')
      passed++
    } catch (error) {
      console.log('❌ HMR配置测试失败')
      console.log(`错误信息: ${error instanceof Error ? error.message : String(error)}\n`)
      failed++
    }

    // 输出测试结果摘要
    console.log('测试完成!')
    console.log(`总计: ${testCases.length + 1} 个测试`)
    console.log(`通过: ${passed} 个`)
    console.log(`失败: ${failed} 个`)

    // 关闭浏览器
    if (!puppeteer.config.debug) {
      await puppeteer.close()
    }

    // 根据测试结果设置进程退出码
    process.exit(failed > 0 ? 1 : 0)
  } else {
    // 交互式模式 - 保留原有功能
    console.log('进入交互式测试模式')
    console.log('输入命令:')
    console.log('  p - 执行基本截图')
    console.log('  fullPage - 执行全页面截图')
    console.log('  element - 执行元素截图')
    console.log('  hmr - 更新HMR配置 (debug=false)')
    console.log('  hmr1 - 更新HMR配置 (debug=true)')
    console.log('  exit - 退出测试')

    // 执行一次初始截图
    await screenshot()

    // 监听控制台输入
    process.stdin.on('data', async (data) => {
      const value = data.toString().trim()

      if (value === 'p') {
        await screenshot()
      } else if (value === 'fullPage') {
        await screenshot({ fullPage: true })
      } else if (value === 'element') {
        await screenshot({ selector: '#container' })
      } else if (value === 'hmr') {
        await puppeteer.hmrConfig({ debug: false, hmr: true })
        console.log('已更新HMR配置: debug=false, hmr=true')
      } else if (value === 'hmr1') {
        await puppeteer.hmrConfig({ debug: true, hmr: true })
        console.log('已更新HMR配置: debug=true, hmr=true')
      } else if (value === 'exit') {
        console.log('退出测试')
        if (!puppeteer.config.debug) {
          await puppeteer.close()
        }
        process.exit(0)
      } else {
        console.log('未知命令，请重新输入')
      }
    })
  }
}

main().catch(error => {
  console.error('测试执行出错:', error)
  process.exit(1)
})
