import { components } from 'node-karin'
import { getConfig, pkg, saveConfig } from './config/index'
import type { PuppeteerLaunchOptions } from '@snapka/puppeteer'
import type { ComponentConfig, GetConfigResponse } from 'node-karin'

const webConfig: {
  info: GetConfigResponse['info'],
  components: () => ComponentConfig[],
  save: (config: PuppeteerLaunchOptions) => {
    success: boolean,
    message: string
  }
} = {
  info: {
    id: pkg.name,
    name: '渲染器插件',
    version: pkg.version,
    description: pkg.description,
    author: [
      {
        name: 'sj817',
        home: 'https://sj817.com',
        avatar: 'https://github.com/sj817.png',
      }
    ],
    icon: {
      name: 'search',
      size: 24,
      color: '#0078d4', // 浅蓝色
    }
  },
  /** 动态渲染的组件 */
  components: () => {
    const config = getConfig()
    return [
      components.switch.create('downloadEnable', {
        label: '启用浏览器下载',
        description: '是否启用浏览器自动下载功能',
        defaultSelected: config.download?.enable !== false,
        color: 'success',
      }),
      components.radio.group('downloadBrowser', {
        label: '下载的浏览器',
        orientation: 'horizontal',
        description: '没有浏览器时，下载的浏览器类型，linux推荐 chrome-headless-shell',
        defaultValue: config.download?.browser || 'chrome',
        radio: [
          components.radio.create('chrome', {
            label: 'chrome',
            value: 'chrome'
          }),
          components.radio.create('chromium', {
            label: 'chromium',
            value: 'chromium'
          }),
          components.radio.create('chrome-headless-shell', {
            label: 'chrome-headless-shell',
            value: 'chrome-headless-shell'
          })
        ]
      }),
      components.input.string('downloadVersion', {
        label: '下载浏览器版本',
        description: '支持：latest、stable、beta、dev、canary 或特定版本号',
        defaultValue: config.download?.version || 'stable',
        isRequired: false,
        className: 'inline-block p-2',
      }),
      components.input.string('downloadDir', {
        label: '下载目录',
        description: '浏览器下载保存目录，为空则使用默认路径',
        defaultValue: config.download?.dir || '',
        isRequired: false,
        className: 'inline-block p-2',
      }),
      components.input.string('downloadBaseUrl', {
        label: '自定义下载源',
        description: '自定义下载源URL，不建议设置',
        defaultValue: config.download?.baseUrl || '',
        isRequired: false,
        className: 'inline-block p-2',
      }),
      components.divider.create('divider0'),
      components.radio.group('protocol', {
        label: 'protocol',
        orientation: 'horizontal',
        description: '连接到浏览器的协议',
        defaultValue: config.protocol || 'cdp',
        radio: [
          components.radio.create('cdp', {
            label: 'cdp',
            value: 'cdp',
            description: 'chrome devtools protocol，性能一般，但是稳定'
          }),
          components.radio.create('webDriverBiDi', {
            label: 'webDriverBiDi',
            value: 'webDriverBiDi',
            description: 'webDriverBiDi，性能更好，速度更快，目前处于开发中，谨慎使用'
          })
        ]
      }),
      components.divider.create('divider1'),
      components.radio.group('headless', {
        label: '无头模式',
        orientation: 'horizontal',
        description: '无头模式配置，最新版chrome支持所有选项',
        defaultValue: config.headless || 'new',
        radio: [
          components.radio.create('new', {
            label: 'new',
            value: 'new',
            description: '使用新的无头模式（推荐）'
          }),
          components.radio.create('shell', {
            label: 'shell',
            value: 'shell',
            description: '使用传统无头模式（仅chrome-headless-shell）'
          }),
          components.radio.create('false', {
            label: 'false',
            value: 'false',
            description: '以有头模式启动浏览器'
          })
        ]
      }),
      components.divider.create('divider3'),
      components.switch.create('debug', {
        label: 'debug模式',
        description: '是否开启debug模式，debug模式下，浏览器将前台运行，并且打开页面后不会关闭，仅在windows下有效',
        defaultSelected: config.debug,
        color: 'success',
      }),
      // findBrowser
      components.switch.create('findBrowser', {
        label: '自动查找浏览器',
        description: '启用后会使用 @snapka/browser-finder 查找系统浏览器、puppeteer、playwright下载的浏览器',
        defaultSelected: config.findBrowser !== false,
        color: 'success',
      }),
      // hmr
      components.switch.create('hmr', {
        label: '热更新',
        description: '是否开启热更新，开启后，前端点击保存后会强制关闭所有正在进行的截图任务并重载配置',
        defaultSelected: config.hmr,
        color: 'success',
      }),
      // pipe
      components.switch.create('pipe', {
        label: '管道模式',
        description: '是否开启管道模式，开启后，浏览器将使用管道模式运行',
        defaultSelected: config.pipe,
        color: 'success',
      }),
      components.divider.create('divider2'),
      // slowMo
      components.input.number('slowMo', {
        label: '慢动作延迟',
        description: '操作慢动作延迟时间（毫秒），用于调试',
        defaultValue: (config.slowMo || 0) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 0,
            max: 10000,
            error: '慢动作延迟必须在0-10000之间'
          }
        ]
      }),
      // maxOpenPages
      components.input.number('maxOpenPages', {
        label: '最大标签页',
        description: '最多同时打开的标签页数量，超出后将会自动排队',
        defaultValue: (config.maxOpenPages || 10) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 1,
            max: 100,
            error: '最大标签页数量必须在1-100之间'
          }
        ]
      }),
      // pageMode
      components.radio.group('pageMode', {
        label: '页面模式',
        orientation: 'horizontal',
        description: '页面管理模式：复用模式性能更好，一次性模式隔离性更强',
        defaultValue: config.pageMode || 'reuse',
        radio: [
          components.radio.create('reuse', {
            label: 'reuse',
            value: 'reuse',
            description: '复用模式（推荐）'
          }),
          components.radio.create('disposable', {
            label: 'disposable',
            value: 'disposable',
            description: '一次性模式'
          })
        ]
      }),
      // pageIdleTimeout
      components.input.number('pageIdleTimeout', {
        label: '页面空闲超时',
        description: '页面在池中空闲超过此时间后会被自动销毁（毫秒），设置为0表示永不超时',
        defaultValue: (config.pageIdleTimeout || 60000) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 0,
            max: 999999999,
            error: '页面空闲超时必须大于等于0'
          }
        ]
      }),
      // retries
      components.input.number('retries', {
        label: '重试次数',
        description: '操作失败时的最大重试次数',
        defaultValue: (config.retries || 2) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 0,
            max: 10,
            error: '重试次数必须在0-10之间'
          }
        ]
      }),
      // executablePath
      components.input.string('executablePath', {
        label: '浏览器可执行路径',
        description: '浏览器可执行路径，如果为空，将会自动下载浏览器',
        defaultValue: config.executablePath,
        isRequired: false,
        className: 'inline-block p-2',
      }),
      // userDataDir
      components.input.string('userDataDir', {
        label: '用户数据目录',
        description: '用户数据目录，如果为空，将会使用默认路径',
        defaultValue: config.userDataDir,
        isRequired: false,
        className: 'inline-block p-2',
      }),
      // defaultViewport width
      components.input.number('viewportWidth', {
        label: '默认视窗宽度',
        description: '默认视窗宽度（像素）',
        defaultValue: (config.defaultViewport?.width || 800) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 1,
            max: 10000,
            error: '视窗宽度必须在1-10000之间'
          }
        ]
      }),
      // defaultViewport height
      components.input.number('viewportHeight', {
        label: '默认视窗高度',
        description: '默认视窗高度（像素）',
        defaultValue: (config.defaultViewport?.height || 600) + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 1,
            max: 10000,
            error: '视窗高度必须在1-10000之间'
          }
        ]
      }),
      // 分隔线
      components.divider.create('divider4'),
      // args
      components.input.group('args', {
        label: '启动参数',
        description: '启动参数，不允许出现空值，无特殊需求不建议改动',
        template: components.input.string('args', {
          label: '启动参数',
        }),
        data: config.args || []
      }),
    ]
  },

  /** 前端点击保存之后调用的方法 */
  save: (config: PuppeteerLaunchOptions & {
    downloadBrowser?: string
    downloadEnable?: boolean
    downloadVersion?: string
    downloadDir?: string
    downloadBaseUrl?: string
    viewportWidth?: number
    viewportHeight?: number
  }) => {
    // 处理 download 相关字段
    if (!config.download) {
      config.download = {}
    }

    if (config.downloadEnable !== undefined) {
      config.download.enable = config.downloadEnable
      delete config.downloadEnable
    }

    if (config.downloadBrowser) {
      config.download.browser = config.downloadBrowser as any
      delete config.downloadBrowser
    }

    if (config.downloadVersion) {
      config.download.version = config.downloadVersion
      delete config.downloadVersion
    }

    if (config.downloadDir) {
      config.download.dir = config.downloadDir
      delete config.downloadDir
    }

    if (config.downloadBaseUrl) {
      config.download.baseUrl = config.downloadBaseUrl
      delete config.downloadBaseUrl
    }

    // 处理 defaultViewport
    if (config.viewportWidth !== undefined || config.viewportHeight !== undefined) {
      config.defaultViewport = {
        width: Number(config.viewportWidth || 800),
        height: Number(config.viewportHeight || 600)
      }
      delete config.viewportWidth
      delete config.viewportHeight
    }

    config = {
      ...config,
      maxOpenPages: Number(config.maxOpenPages),
      pageIdleTimeout: Number(config.pageIdleTimeout),
      retries: Number(config.retries),
      slowMo: Number(config.slowMo || 0),
    }

    saveConfig(config)
    return {
      success: true,
      message: '好了哦 φ(>ω<*)'
    }
  }
}
export default webConfig
