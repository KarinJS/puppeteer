import { components } from 'node-karin'
import { getConfig, pkg, saveConfig } from './config/index'
import type { LaunchOptions } from '@karinjs/puppeteer'
import type { ComponentConfig, GetConfigResponse } from 'node-karin'

const webConfig: {
  info: GetConfigResponse['info'],
  components: () => ComponentConfig[],
  save: (config: LaunchOptions) => {
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
      components.radio.group('downloadBrowser', {
        label: '下载的浏览器',
        orientation: 'horizontal',
        description: '没有浏览器时，下载的浏览器版本，linux推荐 chrome-headless-shell',
        defaultValue: config.downloadBrowser,
        radio: [
          components.radio.create('chrome', {
            label: 'chrome',
            value: 'chrome'
          }),
          components.radio.create('chrome-headless-shell', {
            label: 'chrome-headless-shell',
            value: 'chrome-headless-shell'
          })
        ]
      }),
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
        description: '是否无头模式，无头模式下，浏览器将后台运行，不会打开浏览器窗口',
        defaultValue: String(config.headless),
        radio: [
          components.radio.create('headless:true', {
            label: 'true',
            value: 'true',
            description: '打开无头模式'
          }),
          components.radio.create('headless:false', {
            label: 'false',
            value: 'false',
            description: '关闭无头模式'
          }),
          components.radio.create('shell', {
            label: 'shell',
            value: 'shell',
            description: '使用chrome-headless-shell'
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
      // maxPages
      components.input.number('maxPages', {
        label: '最大标签页',
        description: '最多同时打开的标签页数量，超出后将会自动排队',
        defaultValue: config.maxPages + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 1,
            max: 100,
            error: '最大标签页数量必须在1-100之间'
          }
        ]
      }),
      // idleTime
      components.input.number('idleTime', {
        label: '网络请求空闲时间',
        description: '网络请求空闲时间，单位为毫秒',
        defaultValue: config.idleTime + '',
        className: 'inline-block p-2',
        rules: [
          {
            min: 1,
            max: 999999,
            error: '网络请求空闲时间必须在1-999999之间'
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
  save: (config: LaunchOptions) => {
    config = {
      ...config,
      maxPages: Number(config.maxPages),
      idleTime: Number(config.idleTime),
    }

    saveConfig(config)
    return {
      success: true,
      message: '好了哦 φ(>ω<*)'
    }
  }
}
export default webConfig
