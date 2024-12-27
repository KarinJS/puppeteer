# @karinjs/puppeteer-core

## 描述

轻量·高效·易用的 Puppeteer 截图、视频生成工具。

## 安装

```bash
npm install @karinjs/puppeteer-core
```

## 使用方法

```javascript
import fs from 'fs'
import Puppeteer from '@karinjs/puppeteer-core'

// 使用示例
const chrome = new Puppeteer()

await chrome.init()
/** 计算耗时 */
console.time('截图耗时')
const image = await chrome.screenshot({
  file: 'https://baidu.com/',
  fullPage: true,
  pageGotoParams: {
    waitUntil: 'networkidle2',
  },
  type: 'png',
  setViewport: {
    deviceScaleFactor: 3,
  },
})
console.timeEnd('截图耗时')

fs.writeFileSync('image.png', image)

process.exit(0)

```

## 许可证

本项目使用 [MIT License](https://opensource.org/licenses/MIT) 许可协议。详见 `LICENSE` 文件。

## 使用的第三方库

本项目使用了以下开源库：

- **puppeteer-core**: 用于浏览器自动化操作，使用了 [Apache License 2.0](https://github.com/puppeteer/puppeteer/blob/main/LICENSE) 许可协议。

## 贡献

欢迎贡献代码和建议！
