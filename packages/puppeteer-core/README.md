# @karinjs/puppeteer-core

## 项目简介

这是一个使用tsup对[puppeteer-core](https://github.com/puppeteer/puppeteer)进行二次打包的精简版本，主要目的是大幅压缩包体积，提高安装和部署效率。

需要注意的是，这个包只有`cjs`，如需`esm`请自行`git clone`，编辑`tsup.config.ts`即可。

## 特点

- **超小体积**: 仅有2.82MB，相比官方puppeteer-core的34MB减少了约90%
- **功能一致**: 保留了puppeteer-core的核心功能
- **类型支持**: 完整的TypeScript类型定义
- **更快安装**: 大幅减少安装时间和磁盘占用

## 版本

- 当前版本: 2.0.0 -> 24.4.0

## 对比数据

| 包名                    | 体积   |
| ----------------------- | ------ |
| puppeteer-core (官方)   | 34MB   |
| @karinjs/puppeteer-core | 2.82MB |

> 数据来源: [pkg-size.dev/puppeteer-core](https://pkg-size.dev/puppeteer-core)

## 安装

```bash
npm install @karinjs/puppeteer-core
```

或者使用yarn:

```bash
yarn add @karinjs/puppeteer-core
```

或者使用pnpm:

```bash
pnpm add @karinjs/puppeteer-core
```

### 别名安装

如果您想要直接替换原有的puppeteer-core，可以使用别名安装:

```bash
# npm
npm install puppeteer-core@npm:@karinjs/puppeteer-core

# yarn
yarn add puppeteer-core@npm:@karinjs/puppeteer-core

# pnpm
pnpm add puppeteer-core@npm:@karinjs/puppeteer-core
```

## 使用方法

与原版puppeteer-core用法完全相同：

```javascript
import puppeteer from '@karinjs/puppeteer-core';

// 连接到已有的Chrome实例
const browser = await puppeteer.connect({
  browserURL: 'http://localhost:9222'
});

// 使用Puppeteer的API
const page = await browser.newPage();
await page.goto('https://example.com');
// ...
```

## 开发

如果您需要进行开发或获得更好的类型推导体验，需要安装以下开发依赖：

```bash
# npm
npm install -D devtools-protocol typed-query-selector

# yarn
yarn add -D devtools-protocol typed-query-selector

# pnpm
pnpm add -D devtools-protocol typed-query-selector
```

这些依赖只用于类型推导，不会影响运行时功能。

## 注意事项

- 此包只包含puppeteer-core的核心功能，不会自动下载或管理浏览器
- 需要自行安装和配置Chrome/Chromium浏览器
- 如需自动下载浏览器功能，请考虑使用完整版`@karinjs/puppeteer`

## 限制

由于使用了压缩打包，相比原仓库少了以下入口:

```json
"exports": {
  ".": {
    "types": "./lib/types.d.ts",
    "import": "./lib/esm/puppeteer/puppeteer-core.js",
    "require": "./lib/cjs/puppeteer/puppeteer-core.js"
  },
  "./internal/*": {
    "import": "./lib/esm/puppeteer/*",
    "require": "./lib/cjs/puppeteer/*"
  },
  "./*": {
    "import": "./*",
    "require": "./*"
  }
}
```

目前只提供了一个主入口。如果您需要更多导出入口，欢迎提交PR。由于作者自身并不需要这些额外入口，所以暂未添加。

## 许可证

与原仓库相同，为[Apache-2.0](https://github.com/puppeteer/puppeteer/blob/main/LICENSE)
