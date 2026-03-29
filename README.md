# @karinjs/plugin-puppeteer

[node-karin](https://github.com/KarinJS/Karin) 的 Puppeteer 截图/渲染插件，基于 [@snapka/puppeteer](https://www.npmjs.com/package/@snapka/puppeteer) 封装。

## 功能

- 自动下载/查找系统中的 Chrome 浏览器
- 支持 CDP 和 WebDriver BiDi 两种协议
- 页面池管理（复用 / 一次性模式）
- 并发截图队列与限速
- 提供 Web 管理面板（通过 node-karin Web UI 配置）
- 配置热更新

## 安装

作为 [node-karin](https://github.com/KarinJS/Karin) 插件安装：

```bash
pnpm add @karinjs/plugin-puppeteer -w
```

## 配置

插件首次运行时会自动生成默认配置文件，位于 `<karin数据目录>/@karinjs-plugin-puppeteer/config/config.json`。

也可以通过 node-karin 的 Web 管理面板修改配置。

### 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `protocol` | `'cdp' \| 'webDriverBiDi'` | `'cdp'` | 浏览器通信协议。CDP 稳定，BiDi 更快但仍在开发中 |
| `headless` | `'new' \| 'shell' \| false` | `'shell'` | 无头模式。`'new'` 新版无头、`'shell'` 传统无头（仅 chrome-headless-shell）、`false` 有头 |
| `debug` | `boolean` | `false` | 调试模式，浏览器前台运行且页面不自动关闭（仅 Windows） |
| `findBrowser` | `boolean` | `true` | 是否使用 @snapka/browser-finder 自动查找系统/puppeteer/playwright 已有的浏览器 |
| `pipe` | `boolean` | `false` | 是否使用管道模式与浏览器通信 |
| `slowMo` | `number` | `0` | 操作延迟（毫秒），用于调试 |
| `maxOpenPages` | `number` | `10` | 最大同时打开的标签页数量，超出排队 |
| `pageMode` | `'reuse' \| 'disposable'` | `'reuse'` | 页面模式。复用模式性能好，一次性模式隔离性强 |
| `pageIdleTimeout` | `number` | `60000` | 页面空闲超时时间（毫秒），`0` 表示永不超时 |
| `defaultViewport` | `{ width, height }` | `{ width: 800, height: 600 }` | 默认视窗大小 |
| `executablePath` | `string` | - | 浏览器可执行文件路径，为空则自动下载/查找 |
| `userDataDir` | `string` | - | 浏览器用户数据目录 |
| `args` | `string[]` | 见下方 | Chrome 启动参数 |
| `download.enable` | `boolean` | `true` | 是否启用浏览器自动下载 |
| `download.browser` | `'chrome' \| 'chromium' \| 'chrome-headless-shell'` | `'chrome-headless-shell'` | 下载的浏览器类型 |
| `download.version` | `string` | `'latest'` | 浏览器版本，支持 `latest`、`stable`、`beta`、`dev`、`canary` 或具体版本号 |
| `download.dir` | `string` | - | 下载目录，为空使用默认路径 |
| `download.baseUrl` | `string` | - | 自定义下载源 URL |

### 环境变量

| 环境变量 | 说明 | 示例 |
|---|---|---|
| `PUPPETEER_CHROME_MIRROR` | Chrome 版本信息镜像地址，用于在无法访问 `googlechromelabs.github.io` 时解析浏览器版本 | `https://mirror.karinjs.com` |
| `PUPPETEER_DOWNLOAD_BASE_URL` | 自定义浏览器下载源 URL，优先级高于配置文件中的 `download.baseUrl` | `https://registry.npmmirror.com/-/binary/chrome-for-testing` |

> **国内用户提示**：如果无法正常下载浏览器，可以设置环境变量：
>
> ```bash
> export PUPPETEER_CHROME_MIRROR=https://mirror.karinjs.com
> ```

### 默认启动参数

```
--window-size=800,600
--disable-gpu
--no-sandbox
--disable-setuid-sandbox
--no-zygote
--disable-extensions
--disable-dev-shm-usage
--disable-background-networking
--disable-sync
--disable-crash-reporter
--disable-translate
--disable-notifications
--disable-device-discovery-notifications
--disable-accelerated-2d-canvas
```

## 开发

### 环境要求

- Node.js >= 18
- pnpm

### 目录结构

```
├── src/
│   ├── index.ts          # 插件入口，注册渲染器
│   ├── app.ts            # 开发模式入口
│   ├── web.config.ts     # Web 管理面板配置
│   ├── utils.ts          # 工具函数
│   ├── config/
│   │   └── index.ts      # 配置管理
│   └── __mocks__/        # 测试 mock
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.mjs
└── package.json
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 监听模式测试
pnpm test:watch

# 测试覆盖率
pnpm test:coverage

# Lint
pnpm lint

# 发布
pnpm pub
```

### 构建产物

构建输出到 `dist/` 目录，包含：

- `dist/index.js` - 插件入口
- `dist/web.config.js` - Web 管理面板配置
- `dist/*.d.ts` - 类型声明

## 协议

[MIT](LICENSE)
