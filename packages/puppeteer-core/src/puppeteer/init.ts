import fs from 'fs'
import os from 'os'
import path from 'path'
import { common, Platform } from '@Common'

export interface Info {
  /** 是否为windows */
  isWin: boolean
  /** 操作系统标识符 */
  platform: Platform
  /** 版本 */
  version: string
  /** 缓存目录 */
  cache: string
  /** 根路径 也就是解压路径 */
  dir: string
  /** 下载后zip存放路径 */
  zip: string
  /** chrome文件夹根路径 */
  chromeDir: string
  /** chrome二进制路径 */
  chrome: string
  /** deb.deps路径 仅在linux下存在 */
  debDeps: string
}

/**
 * Chrome下载地址枚举
 */
export const enum ChromeUrl {
  Cnpm = 'https://cdn.npmmirror.com/binaries/chrome-for-testing',
  Google = 'https://storage.googleapis.com/chrome-for-testing-public',
}

export class InitChrome {
  /** 版本 */
  version: string
  /** 操作系统标识符 */
  platform: Platform
  /** chrome信息 */
  info: Info
  /** browser标识 暂不支持firefox  */
  browser: string
  constructor (version: string, headless: 'chrome-headless-shell' | 'chrome') {
    this.browser = headless
    this.version = version
    this.platform = common.Platform()
    this.info = this.GetInfo()
  }

  /**
   * 初始化
   * @returns
   */
  async init (): Promise<string> {
    /** 判断是否存在chrome */
    if (common.exists(this.info.chrome)) {
      console.info(`[chrome] ${this.info.chrome}`)
      return this.info.chrome
    } else {
      console.info('[chrome][init] 未找到chrome，开始下载')
    }

    /** 下载chrome */
    const url = await this.GetDownloadUrl()

    /** 检查zip是否已存在 已存在删除 */
    if (common.exists(this.info.zip)) fs.unlinkSync(this.info.zip)

    const downloadRes = await common.download(url, this.info.zip)
    if (!downloadRes) throw new Error('[chrome][init] 下载失败')

    console.info('[chrome][init] 下载完成，开始解压')
    const unzipRes = await common.unzip(this.info.zip, this.info.dir)
    if (!unzipRes) throw new Error('[chrome][init] 解压失败')
    /** 解压完成删除zip文件 */
    fs.unlinkSync(this.info.zip)
    console.info('[chrome][init] 解压完成: ', this.info.chrome)

    /** linux需要先安装环境 */
    if (os.platform() === 'linux') {
      console.log('[chrome][init] 当前为Linux系统，正在初始化环境...')
      await this.install()
    }

    return this.info.chrome
  }

  /**
   * 安装环境
   */
  async install (): Promise<void> {
    const CentOS = [
      'alsa-lib.x86_64',
      'atk.x86_64',
      'cups-libs.x86_64',
      'gtk3.x86_64',
      'ipa-gothic-fonts',
      'libXcomposite.x86_64',
      'libXcursor.x86_64',
      'libXdamage.x86_64',
      'libXext.x86_64',
      'libXi.x86_64',
      'libXrandr.x86_64',
      'libXScrnSaver.x86_64',
      'libXtst.x86_64',
      'pango.x86_64',
      'xorg-x11-fonts-100dpi',
      'xorg-x11-fonts-75dpi',
      'xorg-x11-fonts-cyrillic',
      'xorg-x11-fonts-misc',
      'xorg-x11-fonts-Type1',
      'xorg-x11-utils',
    ]

    const Debian = [
      'ca-certificates',
      'fonts-liberation',
      'libasound2',
      'libatk-bridge2.0-0',
      'libatk1.0-0',
      'libc6',
      'libcairo2',
      'libcups2',
      'libdbus-1-3',
      'libexpat1',
      'libfontconfig1',
      'libgbm1',
      'libgcc1',
      'libglib2.0-0',
      'libgtk-3-0',
      'libnspr4',
      'libnss3',
      'libpango-1.0-0',
      'libpangocairo-1.0-0',
      'libstdc++6',
      'libx11-6',
      'libx11-xcb1',
      'libxcb1',
      'libxcomposite1',
      'libxcursor1',
      'libxdamage1',
      'libxext6',
      'libxfixes3',
      'libxi6',
      'libxrandr2',
      'libxrender1',
      'libxss1',
      'libxtst6',
      'lsb-release',
      'wget',
      'xdg-utils',
    ]

    if (process.getuid?.() !== 0) {
      throw new Error('安装系统依赖需要root权限')
    }

    /** 获取当前的系统 */
    const system = await common.exec('cat /etc/os-release').catch(() => '') as string

    const install = async (list: { type: string, command: string }[]) => {
      await Promise.all(list.map(async (item) => {
        const command = item.type === '字体' && os.userInfo().uid === 0 ? `sudo ${item.command}` : item.command
        await common.exec(command).catch((e) => console.error(`[chrome][init] 安装${item.type}失败 请尝试手动执行: ${item.command}\n`, e))
      }))
    }

    if (/centos/i.test(system)) {
      const list = [
        { type: '依赖', command: `yum install -y ${CentOS.join(' ')}` },
        { type: 'nss', command: 'yum update nss -y' },
        { type: '字体', command: 'yum install wqy-microhei-fonts noto-sans-cjk-fonts adobe-source-han-sans-cn-fonts' },
      ]

      await install(list)
    } else if (/debian|ubuntu/i.test(system)) {
      let cmd = 'apt install fonts-wqy-microhei fonts-noto-cjk fonts-adobe-source-han-sans-cn'
      if (this.info.debDeps && fs.existsSync(this.info.debDeps)) {
        cmd = fs.readFileSync(this.info.debDeps, 'utf-8').split('\n').join(',')
      }
      const list = [
        { type: '依赖', command: `apt-get install -y ${Debian.join(' ')}` },
        { type: '字体', command: cmd }
      ]

      await install(list)
    } else if (/arch/i.test(system)) {
      // 我也不知道这玩意到底需要什么依赖...反正是chatgpt提供的。
      const list = [
        { type: '依赖', command: 'pacman -S --noconfirm alsa-lib atk cups gtk3 libxcomposite libxrandr libxdamage libxext libxi libxss libxtst pango xorg-fonts-100dpi xorg-fonts-75dpi xorg-fonts-cyrillic xorg-fonts-misc xorg-fonts-type1 nss libxshmfence libcups libu2f-host libgcrypt' },
        { type: '字体', command: 'pacman -S --noconfirm ttf-wqy-microhei noto-fonts-cjk adobe-source-han-sans-cn-fonts' },
      ]

      await install(list)
    } else {
      console.error(`[Error] 未知系统: ${system} 请自行处理 Chrome 依赖`)
      return
    }

    console.log('[chrome][init] 环境初始化完成')
  }

  /**
   * 获取下载地址
   */
  async GetDownloadUrl (host: ChromeUrl = ChromeUrl.Cnpm): Promise<string> {
    try {
      /** 组合url */
      const url = `${host}/${this.version}/${this.platform}/${this.browser}-${this.platform}.zip`
      console.info(`[chrome][init] 获取下载地址完成：${url}`)
      return url
    } catch (e) {
      if (host === ChromeUrl.Google) {
        console.error('[chrome][init] 谷歌源获取失败，无法下载，请检查网络连接')
        console.error(e)
        process.exit()
      }

      /** 如果下阿里云失败 则尝试走谷歌源 */
      console.error('[chrome][init] 阿里云源获取失败，正在尝试谷歌源进行下载...')
      console.error(e)
      return this.GetDownloadUrl(ChromeUrl.Google)
    }
  }

  /**
   * 获取chrome信息
   */
  GetInfo (): Info {
    /** 操作系统标识符 */
    const platform = this.platform
    /** 是否为windows */
    const isWin = os.platform() === 'win32'
    /** 缓存目录 */
    const cache = path.join(os.homedir(), '.cache', 'puppeteer', this.browser)
    /** 版本 */
    const version = `${platform}-${this.version}`
    /** 存放实际 Chrome 可执行文件的目录 */
    const dir = path.join(cache, version)
    /** 下载后压缩包的存放路径 */
    const zip = path.join(dir, `${this.browser}-${platform}.zip`)
    /** 解压路径 */
    const chromeDir = dir
    /** chrome二进制路径 */
    const chrome = path.join(chromeDir, `${this.browser}-${platform}`, `${this.browser}${isWin ? '.exe' : ''}`)
    /** deb.deps路径 仅在linux下存在 */
    const debDeps = path.join(chromeDir, `${this.browser}-${platform}`, 'deb.deps')

    // tips: 压缩包解压后会带一个文件夹: ${this.browser}-${platform}
    return {
      isWin,
      platform,
      version,
      cache,
      dir,
      zip,
      chromeDir,
      chrome,
      debDeps,
    }
  }
}
