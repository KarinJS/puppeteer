import { findInstalledBrowsers, findDefaultBrowser, findBrowser } from './index'
import { BrowserType, ReleaseChannel } from './types'
import { ChromeFinder } from './browsers/chrome'
import { EdgeFinder } from './browsers/edge'
import { BraveFinder } from './browsers/brave'

/**
 * 测试浏览器查找功能
 */
async function main () {
  console.log('查找所有浏览器:')
  const allBrowsers = findInstalledBrowsers()
  console.log(JSON.stringify(allBrowsers, null, 2))

  console.log('\n查找默认浏览器:')
  const defaultBrowser = findDefaultBrowser()
  console.log(JSON.stringify(defaultBrowser, null, 2))

  console.log('\n查找Chrome浏览器:')
  const chromeBrowser = findBrowser(BrowserType.CHROME)
  console.log(JSON.stringify(chromeBrowser, null, 2))

  console.log('\n查找Chrome Beta浏览器:')
  const chromeBetaBrowser = findBrowser(BrowserType.CHROME, ReleaseChannel.BETA)
  console.log(JSON.stringify(chromeBetaBrowser, null, 2))

  console.log('\n查找Edge浏览器:')
  const edgeBrowser = findBrowser(BrowserType.EDGE)
  console.log(JSON.stringify(edgeBrowser, null, 2))

  console.log('\n查找Brave浏览器:')
  const braveBrowser = findBrowser(BrowserType.BRAVE)
  console.log(JSON.stringify(braveBrowser, null, 2))

  console.log('\n直接使用浏览器查找器:')
  console.log('Chrome查找器:')
  const chromeFinder = new ChromeFinder()
  const chromeResults = chromeFinder.find()
  console.log(JSON.stringify(chromeResults, null, 2))

  console.log('\nEdge查找器:')
  const edgeFinder = new EdgeFinder()
  const edgeResults = edgeFinder.find()
  console.log(JSON.stringify(edgeResults, null, 2))

  console.log('\nBrave查找器:')
  const braveFinder = new BraveFinder()
  const braveResults = braveFinder.find()
  console.log(JSON.stringify(braveResults, null, 2))
}

// 执行测试
main().catch(console.error)
