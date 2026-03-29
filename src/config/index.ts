import fs from 'node:fs'
import path from 'node:path'
import { karin, logger } from 'node-karin'
import pkg from '../../package.json'
import { basePath } from 'node-karin/root'
import type { PuppeteerLaunchOptions } from '@snapka/puppeteer'
import { probeRace } from '../probe'

/**
 * 热更新key
 */
export const HMR_KEY = 'karin-plugin-puppeteer-hmr'

/**
 * 环境变量名称：Chrome 版本解析镜像地址
 * 设置后将直接使用该镜像，不走探针
 * @example PUPPETEER_CHROME_MIRROR=https://mirror.karinjs.com
 */
export const ENV_CHROME_MIRROR = 'PUPPETEER_CHROME_MIRROR'

/**
 * 环境变量名称：自定义下载源 URL
 * @example PUPPETEER_DOWNLOAD_BASE_URL=https://registry.npmmirror.com/-/binary/chrome-for-testing
 */
export const ENV_DOWNLOAD_BASE_URL = 'PUPPETEER_DOWNLOAD_BASE_URL'

/**
 * 版本解析 API 列表（用于探针竞速）
 * 镜像在前，官方在后，探针会选择最快响应的
 */
export const VERSION_API_URLS = [
  'https://mirror.karinjs.com',
  'https://googlechromelabs.github.io',
]

/**
 * 默认配置
 */
const defaultConfig: PuppeteerLaunchOptions = {
  protocol: 'cdp',
  headless: 'shell',
  debug: false,
  findBrowser: true,
  slowMo: 0,
  maxOpenPages: 10,
  pageMode: 'reuse',
  pageIdleTimeout: 60000,
  defaultViewport: {
    width: 800,
    height: 600
  },
  download: {
    enable: true,
    browser: 'chrome-headless-shell',
    version: 'latest'
  },
  args: [
    '--window-size=800,600', // 设置窗口大小
    '--disable-gpu', // 禁用 GPU 硬件加速
    '--no-sandbox', // 关闭 Chrome 的沙盒模式
    '--disable-setuid-sandbox', // 进一步禁用 setuid 沙盒机制，通常和 --no-sandbox 配合使用，避免权限问题
    '--no-zygote', // 关闭 Chrome 的 zygote 进程，减少进程开销，优化资源使用
    // ===== 扩展/插件/组件 =====
    '--disable-extensions', // 禁用所有扩展
    '--disable-plugins', // 禁用所有插件（如 Flash 等 NPAPI/PPAPI 插件）
    '--disable-component-extensions-with-background-pages', // 禁用带后台页面的组件扩展
    '--disable-component-update', // 禁用组件自动更新
    '--disable-default-apps', // 禁用默认应用安装
    // ===== 网络/后台/同步 =====
    '--disable-background-networking', // 禁用后台网络请求
    '--disable-background-timer-throttling', // 禁用后台定时器节流
    '--disable-backgrounding-occluded-windows', // 禁用后台窗口降优先级
    '--disable-renderer-backgrounding', // 禁用渲染器后台降优先级
    '--disable-sync', // 禁用 Chrome 的同步功能
    '--disable-domain-reliability', // 禁用域名可靠性监控
    '--disable-ipc-flooding-protection', // 禁用 IPC 泛洪保护
    '--no-pings', // 禁用超链接审计 ping
    // ===== 安全/检测/监控（截图不需要） =====
    '--disable-client-side-phishing-detection', // 禁用客户端钓鱼检测
    '--safebrowsing-disable-auto-update', // 禁用安全浏览自动更新
    '--disable-crash-reporter', // 禁用崩溃报告
    '--disable-breakpad', // 禁用 Breakpad 崩溃转储
    '--disable-hang-monitor', // 禁用页面挂起监控
    '--metrics-recording-only', // 仅记录指标不上报
    // ===== 用户交互/UI/通知（截图无交互） =====
    '--disable-translate', // 禁用翻译
    '--disable-notifications', // 禁用通知
    '--disable-device-discovery-notifications', // 禁用设备发现通知
    '--disable-popup-blocking', // 禁用弹窗拦截
    '--disable-prompt-on-repost', // 禁用重新提交表单时的确认提示
    '--noerrdialogs', // 禁用错误对话框
    '--no-first-run', // 跳过首次运行的初始设置
    '--no-default-browser-check', // 跳过默认浏览器检查
    '--deny-permission-prompts', // 自动拒绝所有权限弹窗
    '--disable-search-engine-choice-screen', // 禁用搜索引擎选择页面
    '--ash-no-nudges', // 禁用 ChromeOS 提示气泡
    // ===== 音频/媒体 =====
    '--mute-audio', // 静音所有音频输出
    '--autoplay-policy=no-user-gesture-required', // 自动播放策略（避免阻塞）
    // ===== 存储/缓存 =====
    '--disable-session-crashed-bubble', // 禁用会话崩溃恢复气泡
    '--disable-dev-shm-usage', // 禁用 /dev/shm（共享内存）用作临时存储，改用磁盘存储
    // ===== 账户/密码/自动填充 =====
    '--password-store=basic', // 使用基础密码存储，避免调用系统钥匙链
    '--use-mock-keychain', // 使用模拟钥匙链，避免弹出授权窗口
    '--disable-signin-promo', // 禁用登录推广
    // ===== 渲染/画布/截图一致性 =====
    '--disable-accelerated-2d-canvas', // 禁用 2D 画布的硬件加速
    '--font-render-hinting=none', // 禁用字体渲染微调（截图一致性）
    '--force-color-profile=srgb', // 强制使用 sRGB 色彩配置（截图一致性）
    '--hide-scrollbars', // 隐藏滚动条（截图更干净）
    '--enable-features=NetworkService,NetworkServiceInProcess', // 网络服务进程内运行，减少进程数
    // ===== 禁用不需要的功能特性 =====
    '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process,TranslateUI,Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,DestroyProfileOnBrowserClose,Autofill,AutofillCreditCardAuthentication,GlobalMediaControls,ImprovedCookieControls,LazyFrameLoading,WebOTP,WebPayments,WebUSB,WebBluetooth,WebXR,IdleDetection,BackForwardCache,ThirdPartyStoragePartitioning,CrossOriginOpenerPolicyReporting,CrossOriginEmbedderPolicyCredentialless,SidePanelPinning,TabHoverCardImages',
    // ===== 杂项 =====
    '--disable-field-trial-config', // 禁用 Chrome 的 A/B 实验配置
    '--disable-back-forward-cache', // 禁用前进/后退缓存
    '--enable-automation', // 标记自动化模式（跳过部分人机验证相关弹窗）
    '--disable-blink-features=AutomationControlled', // 隐藏自动化标记（避免被检测）
    '--disable-infobars', // 禁用信息栏（如"Chrome 正受到自动化软件的控制"）
    '--ignore-certificate-errors', // 忽略证书错误（截图场景不关心证书）
  ]
}

/** 插件名称 */
export const pluginName = pkg.name.replace(/\//g, '-')
/** 插件版本 */
export const pluginVersion = pkg.version
/** 配置文件路径 */
export const configPath = path.resolve(basePath, pluginName, 'config', 'config.json')

/**
 * 初始化配置
 */
const init = () => {
  /** 判断文件是否存在 不存在则创建 */
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    logger.info(`[${pluginName}] 首次运行，已创建默认配置文件: ${configPath}`)
  }
}

/**
 * 获取配置（合并默认配置、配置文件和环境变量）
 * 环境变量优先级最高
 */
export const getConfig = (): PuppeteerLaunchOptions => {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const config = { ...defaultConfig, ...data }

  const envBaseUrl = process.env[ENV_DOWNLOAD_BASE_URL]
  if (envBaseUrl) {
    config.download = { ...(config.download ?? {}), baseUrl: envBaseUrl }
  }

  return config
}

/**
 * 版本通道名称到 JSON 字段的映射
 */
const channelMap: Record<string, string> = {
  latest: 'Canary',
  stable: 'Stable',
  beta: 'Beta',
  dev: 'Dev',
  canary: 'Canary',
}

/**
 * 从指定 URL 解析浏览器版本号
 *
 * @param version 版本通道名称（如 latest、stable）或具体版本号
 * @param baseUrl 版本 API 地址（如 https://mirror.karinjs.com）
 * @param signal 可选的 AbortSignal，用于取消请求
 * @returns 解析后的具体版本号，解析失败则抛出错误
 */
export const resolveVersionFromMirror = async (version: string, baseUrl: string, signal?: AbortSignal): Promise<string> => {
  const channel = channelMap[version]
  if (!channel) return version

  const url = `${baseUrl.replace(/\/+$/, '')}/chrome-for-testing/last-known-good-versions.json`
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch version info from mirror: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as { channels: Record<string, { version: string }> }
  const info = data.channels[channel]
  if (!info?.version) {
    throw new Error(`Channel "${channel}" not found in mirror response`)
  }
  return info.version
}

/**
 * 解析浏览器版本号
 * - 设置了 PUPPETEER_CHROME_MIRROR 环境变量时，直接使用该镜像，不走探针
 * - 未设置环境变量时，使用探针竞速多个 API，选择最快响应的
 *   首个 URL 立即请求，后续按 staggerDelay 延迟启动；
 *   任一成功后通过 AbortController 取消剩余请求和定时器
 *
 * @param version 版本通道名称（如 latest、stable）或具体版本号
 * @returns 解析后的具体版本号
 */
export const resolveVersion = async (version: string): Promise<string> => {
  const channel = channelMap[version]
  if (!channel) return version

  const envMirror = process.env[ENV_CHROME_MIRROR]
  if (envMirror) {
    logger.info(`[${pluginName}] 使用环境变量指定的镜像: ${envMirror}`)
    return resolveVersionFromMirror(version, envMirror)
  }

  const { result } = await probeRace({
    tag: pluginName,
    urls: VERSION_API_URLS,
    staggerDelay: 300,
    request: (url, signal) => resolveVersionFromMirror(version, url, signal),
  })

  return result
}

/**
 * 保存配置
 * @param config 配置
 */
export const saveConfig = (config: PuppeteerLaunchOptions) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  karin.emit(HMR_KEY, config)
}

export { pkg }

init()
