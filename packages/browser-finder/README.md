# @karinjs/browser-finder

一个用于查找系统中已安装浏览器的工具库。

## 安装

```bash
npm install @karinjs/browser-finder
# 或
yarn add @karinjs/browser-finder
# 或
pnpm add @karinjs/browser-finder
```

## 功能

- 查找系统中已安装的所有浏览器
- 按照优先级查找默认浏览器
- 查找特定类型的浏览器（Chrome、Edge、Brave等）
- 支持不同发布渠道（稳定版、测试版、开发版、金丝雀版）
- 支持 Windows、macOS 和 Linux 系统
- 从多种来源查找浏览器：
  - 固定安装路径
  - 注册表（仅Windows）
  - 环境变量PATH
  - Puppeteer缓存
  - Playwright缓存

## 使用方法

### 查找所有已安装的浏览器

```typescript
import { findInstalledBrowsers } from '@karinjs/browser-finder';

const browsers = findInstalledBrowsers();
console.log(browsers);
```

### 查找默认浏览器

```typescript
import { findDefaultBrowser } from '@karinjs/browser-finder';

const browser = findDefaultBrowser();
console.log(browser);
```

### 查找特定类型的浏览器

```typescript
import { findBrowser, BrowserType } from '@karinjs/browser-finder';

const chromeBrowser = findBrowser(BrowserType.CHROME);
console.log(chromeBrowser);

const edgeBrowser = findBrowser(BrowserType.EDGE);
console.log(edgeBrowser);

const braveBrowser = findBrowser(BrowserType.BRAVE);
console.log(braveBrowser);
```

### 查找特定渠道的浏览器

```typescript
import { findBrowser, BrowserType, ReleaseChannel } from '@karinjs/browser-finder';

// 查找Chrome Beta版本
const chromeBetaBrowser = findBrowser(BrowserType.CHROME, ReleaseChannel.BETA);
console.log(chromeBetaBrowser);

// 查找Chrome开发版
const chromeDevBrowser = findBrowser(BrowserType.CHROME, ReleaseChannel.DEV);
console.log(chromeDevBrowser);

// 查找Chrome金丝雀版
const chromeCanaryBrowser = findBrowser(BrowserType.CHROME, ReleaseChannel.CANARY);
console.log(chromeCanaryBrowser);
```

## API

### 类型和常量

#### BrowserType

浏览器类型常量：

```typescript
const BrowserType = {
  CHROME: 'chrome',
  CHROMIUM: 'chromium',
  EDGE: 'edge',
  BRAVE: 'brave',
} as const;

type BrowserTypeValue = typeof BrowserType[keyof typeof BrowserType];
```

#### ReleaseChannel

浏览器发布渠道常量：

```typescript
const ReleaseChannel = {
  STABLE: 'stable',
  BETA: 'beta',
  DEV: 'dev',
  CANARY: 'canary',
} as const;

type ReleaseChannelValue = typeof ReleaseChannel[keyof typeof ReleaseChannel];
```

#### BrowserInfo

浏览器信息接口：

```typescript
interface BrowserInfo {
  /**
   * 浏览器类型
   */
  type: BrowserTypeValue;
  
  /**
   * 浏览器可执行文件路径
   */
  executablePath: string;
  
  /**
   * 浏览器版本
   */
  version?: string;
  
  /**
   * 浏览器来源
   */
  source?: string;

  /**
   * 发布渠道
   */
  channel?: ReleaseChannelValue;
}
```

### 函数

#### findInstalledBrowsers(options?)

查找系统中安装的所有浏览器。

参数：
- `options.browserType`：（可选）要查找的浏览器类型
- `options.returnFirstMatch`：（可选）是否只返回第一个找到的浏览器
- `options.channel`：（可选）要查找的浏览器发布渠道

返回：`BrowserInfo[]`

#### findBrowser(browserType, channel?)

查找指定类型的浏览器。

参数：
- `browserType`：要查找的浏览器类型
- `channel`：（可选）要查找的浏览器发布渠道

返回：`BrowserInfo | undefined`

#### findDefaultBrowser()

查找默认浏览器（按优先级：Chrome > Edge > Brave）。

返回：`BrowserInfo | undefined`

### 浏览器查找器类

每种浏览器类型都有对应的查找器类，可以单独使用：

```typescript
import { ChromeFinder, EdgeFinder, BraveFinder } from '@karinjs/browser-finder';

// 查找Chrome浏览器
const chromeFinder = new ChromeFinder();
const chromeBrowsers = chromeFinder.find();

// 查找Edge浏览器
const edgeFinder = new EdgeFinder();
const edgeBrowsers = edgeFinder.find();

// 查找Brave浏览器
const braveFinder = new BraveFinder();
const braveBrowsers = braveFinder.find();
```

## 许可证

MIT 