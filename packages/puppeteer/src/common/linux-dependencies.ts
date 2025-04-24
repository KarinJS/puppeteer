import fs from 'node:fs'
import { exec, spawnSync } from 'node:child_process'
import { promisify } from 'node:util'
import { logger } from './logger'

const execAsync = promisify(exec)

/**
 * Linux发行版类型
 */
export enum LinuxDistroType {
  /** Debian/Ubuntu系列 */
  DEBIAN = 'debian',
  /** Fedora/RHEL/CentOS系列 */
  FEDORA = 'fedora',
  /** openSUSE系列 */
  SUSE = 'suse',
  /** Arch Linux系列 */
  ARCH = 'arch',
  /** 未知或不支持的发行版 */
  UNKNOWN = 'unknown'
}

/**
 * 检测当前Linux发行版类型
 * @returns 返回Linux发行版类型
 */
export async function detectLinuxDistro (): Promise<LinuxDistroType> {
  try {
    // 尝试读取/etc/os-release文件
    if (fs.existsSync('/etc/os-release')) {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8')

      if (osRelease.includes('ID=debian') || osRelease.includes('ID=ubuntu') ||
        osRelease.includes('ID_LIKE=debian')) {
        return LinuxDistroType.DEBIAN
      }

      if (osRelease.includes('ID=fedora') || osRelease.includes('ID=rhel') ||
        osRelease.includes('ID=centos') || osRelease.includes('ID_LIKE=fedora')) {
        return LinuxDistroType.FEDORA
      }

      if (osRelease.includes('ID=opensuse') || osRelease.includes('ID_LIKE=opensuse') ||
        osRelease.includes('ID=suse')) {
        return LinuxDistroType.SUSE
      }

      if (osRelease.includes('ID=arch') || osRelease.includes('ID=manjaro') ||
        osRelease.includes('ID_LIKE=arch')) {
        return LinuxDistroType.ARCH
      }
    }

    // 尝试通过命令行工具检测
    try {
      await execAsync('apt --version')
      return LinuxDistroType.DEBIAN
    } catch (e) {
      // 忽略错误
    }

    try {
      await execAsync('dnf --version')
      return LinuxDistroType.FEDORA
    } catch (e) {
      // 忽略错误
    }

    try {
      await execAsync('zypper --version')
      return LinuxDistroType.SUSE
    } catch (e) {
      // 忽略错误
    }

    try {
      await execAsync('pacman --version')
      return LinuxDistroType.ARCH
    } catch (e) {
      // 忽略错误
    }

    return LinuxDistroType.UNKNOWN
  } catch (error) {
    return LinuxDistroType.UNKNOWN
  }
}

/**
 * 检查是否有sudo权限
 * @returns 是否有sudo权限
 */
async function hasSudoAccess (): Promise<boolean> {
  try {
    await execAsync('sudo -n true')
    return true
  } catch {
    return false
  }
}

/**
 * 不同发行版的中文字体包和命令
 */
const LINUX_CONFIGS = {
  [LinuxDistroType.DEBIAN]: {
    chineseFonts: [
      'fonts-noto-cjk',
      'fonts-wqy-zenhei',
      'fonts-wqy-microhei'
    ],
    installCmd: 'apt-get install -y',
    updateCmd: 'apt-get update',
    testCmd: 'apt-get -h'
  },
  [LinuxDistroType.FEDORA]: {
    chineseFonts: [
      'google-noto-sans-cjk-fonts',
      'wqy-zenhei-fonts',
      'wqy-microhei-fonts'
    ],
    installCmd: 'dnf install -y',
    updateCmd: 'dnf check-update',
    testCmd: 'dnf -h'
  },
  [LinuxDistroType.SUSE]: {
    chineseFonts: [
      'google-noto-sans-cjk-fonts',
      'wqy-zenhei-fonts',
      'wqy-microhei-fonts'
    ],
    installCmd: 'zypper install -y',
    updateCmd: 'zypper refresh',
    testCmd: 'zypper -h'
  },
  [LinuxDistroType.ARCH]: {
    chineseFonts: [
      'noto-fonts-cjk',
      'wqy-zenhei',
      'wqy-microhei'
    ],
    installCmd: 'pacman -S --noconfirm',
    updateCmd: 'pacman -Sy',
    testCmd: 'pacman -h'
  }
}

/**
 * 转换Debian依赖到其他发行版的映射
 */
const DEPS_MAPPING: Record<LinuxDistroType, Record<string, string> | undefined> = {
  [LinuxDistroType.DEBIAN]: undefined,
  [LinuxDistroType.UNKNOWN]: undefined,
  [LinuxDistroType.FEDORA]: {
    'ca-certificates': 'ca-certificates',
    'fonts-liberation': 'liberation-fonts',
    libasound2: 'alsa-lib',
    'libatk-bridge2.0-0': 'at-spi2-atk',
    'libatk1.0-0': 'atk',
    'libatspi2.0-0': 'at-spi2-core',
    libc6: 'glibc',
    libcairo2: 'cairo',
    libcups2: 'cups-libs',
    'libcurl3-gnutls': 'libcurl',
    'libcurl3-nss': 'libcurl',
    libcurl4: 'libcurl',
    libcurl3: 'libcurl',
    'libdbus-1-3': 'dbus-libs',
    libdrm2: 'libdrm',
    libexpat1: 'expat',
    libgbm1: 'mesa-libgbm',
    'libglib2.0-0': 'glib2',
    'libgtk-3-0': 'gtk3',
    'libgtk-4-1': 'gtk4',
    libnspr4: 'nspr',
    libnss3: 'nss',
    'libpango-1.0-0': 'pango',
    libudev1: 'systemd-libs',
    libvulkan1: 'vulkan-loader',
    'libx11-6': 'libX11',
    libxcb1: 'libxcb',
    libxcomposite1: 'libXcomposite',
    libxdamage1: 'libXdamage',
    libxext6: 'libXext',
    libxfixes3: 'libXfixes',
    libxkbcommon0: 'libxkbcommon',
    libxrandr2: 'libXrandr',
    wget: 'wget',
    'xdg-utils': 'xdg-utils'
  },
  [LinuxDistroType.SUSE]: {
    'ca-certificates': 'ca-certificates',
    'fonts-liberation': 'liberation-fonts',
    libasound2: 'alsa',
    'libatk-bridge2.0-0': 'at-spi2-atk-gtk3',
    'libatk1.0-0': 'atk',
    'libatspi2.0-0': 'at-spi2-core',
    libc6: 'glibc',
    libcairo2: 'cairo',
    libcups2: 'cups-libs',
    'libcurl3-gnutls': 'libcurl',
    'libcurl3-nss': 'libcurl',
    libcurl4: 'libcurl',
    libcurl3: 'libcurl',
    'libdbus-1-3': 'dbus-1',
    libdrm2: 'libdrm',
    libexpat1: 'libexpat',
    libgbm1: 'Mesa-libgbm',
    'libglib2.0-0': 'glib2',
    'libgtk-3-0': 'gtk3',
    'libgtk-4-1': 'gtk4',
    libnspr4: 'mozilla-nspr',
    libnss3: 'mozilla-nss',
    'libpango-1.0-0': 'pango',
    libudev1: 'libudev',
    libvulkan1: 'libvulkan',
    'libx11-6': 'libX11',
    libxcb1: 'libxcb',
    libxcomposite1: 'libXcomposite',
    libxdamage1: 'libXdamage',
    libxext6: 'libXext',
    libxfixes3: 'libXfixes',
    libxkbcommon0: 'libxkbcommon',
    libxrandr2: 'libXrandr',
    wget: 'wget',
    'xdg-utils': 'xdg-utils'
  },
  [LinuxDistroType.ARCH]: {
    'ca-certificates': 'ca-certificates',
    'fonts-liberation': 'ttf-liberation',
    libasound2: 'alsa-lib',
    'libatk-bridge2.0-0': 'at-spi2-atk',
    'libatk1.0-0': 'atk',
    'libatspi2.0-0': 'at-spi2-core',
    libc6: 'glibc',
    libcairo2: 'cairo',
    libcups2: 'libcups',
    'libcurl3-gnutls': 'curl',
    'libcurl3-nss': 'curl',
    libcurl4: 'curl',
    libcurl3: 'curl',
    'libdbus-1-3': 'dbus',
    libdrm2: 'libdrm',
    libexpat1: 'expat',
    libgbm1: 'mesa',
    'libglib2.0-0': 'glib2',
    'libgtk-3-0': 'gtk3',
    'libgtk-4-1': 'gtk4',
    libnspr4: 'nspr',
    libnss3: 'nss',
    'libpango-1.0-0': 'pango',
    libudev1: 'systemd-libs',
    libvulkan1: 'vulkan-icd-loader',
    'libx11-6': 'libx11',
    libxcb1: 'libxcb',
    libxcomposite1: 'libxcomposite',
    libxdamage1: 'libxdamage',
    libxext6: 'libxext',
    libxfixes3: 'libxfixes',
    libxkbcommon0: 'libxkbcommon',
    libxrandr2: 'libxrandr',
    wget: 'wget',
    'xdg-utils': 'xdg-utils'
  }
}

/**
 * 转换依赖名称从Debian到目标发行版
 * @param distroType - 目标发行版类型
 * @param debianDeps - Debian依赖列表
 * @returns 转换后的依赖列表
 */
function mapDependencies (distroType: LinuxDistroType, debianDeps: string[]): string[] {
  if (distroType === LinuxDistroType.DEBIAN) {
    return debianDeps
  }

  const mapping = DEPS_MAPPING[distroType]
  if (!mapping) {
    return []
  }

  return debianDeps
    .map(dep => mapping[dep] || null)
    .filter((dep): dep is string => dep !== null)
}

/**
 * 安装依赖包
 * @param baseCmd - 基础安装命令
 * @param packages - 要安装的包
 * @param useSudo - 是否使用sudo
 * @returns 安装是否成功
 */
async function installPackages (baseCmd: string, packages: string[], useSudo: boolean): Promise<boolean> {
  if (packages.length === 0) {
    return true
  }

  // 构建完整命令
  const prefix = useSudo ? 'sudo ' : ''
  // 分批安装，每批最多20个包
  const batchSize = 20

  try {
    // 一次性尝试安装所有包
    const cmd = `${prefix}${baseCmd} ${packages.join(' ')}`
    await execAsync(cmd)
    return true
  } catch (error) {
    // 如果一次性安装失败，尝试分批安装
    try {
      let success = false
      for (let i = 0; i < packages.length; i += batchSize) {
        const batch = packages.slice(i, i + batchSize)
        try {
          const cmd = `${prefix}${baseCmd} ${batch.join(' ')}`
          await execAsync(cmd)
          success = true
        } catch {
          // 忽略批量安装错误，继续下一批
        }
      }

      // 如果分批安装有成功的批次，则认为部分成功
      if (success) {
        return true
      }

      // 如果分批安装全部失败，尝试逐个安装
      success = false
      for (const pkg of packages) {
        try {
          const cmd = `${prefix}${baseCmd} ${pkg}`
          await execAsync(cmd)
          success = true
        } catch {
          // 忽略单个包安装失败
        }
      }

      return success
    } catch {
      // 所有尝试都失败
      return false
    }
  }
}

/**
 * 安装Linux系统依赖和中文字体
 * @param debDepsPath - Debian依赖文件路径
 * @returns 无需在意返回值，该函数不会阻止浏览器启动
 */
export async function installLinuxDependencies (debDepsPath: string): Promise<boolean> {
  if (process.platform !== 'linux') {
    return true
  }
  logger.info('当前为Linux系统，开始安装依赖...')

  try {
    /** Linux发行版 */
    const distroType = await detectLinuxDistro()

    if (distroType === LinuxDistroType.UNKNOWN) {
      logger.warn('未知的Linux发行版，跳过依赖安装')
      return true
    }

    if (fs.existsSync(debDepsPath)) {
      const data = fs.readFileSync(debDepsPath, 'utf-8').split('\n').join(',')
      if (process.getuid?.() !== 0) {
        throw new Error('安装系统依赖项需要 root 权限')
      }
      let result = spawnSync('apt-get', ['-v'])
      if (result.status !== 0) {
        throw new Error('无法安装系统依赖项：apt-get 似乎不可用')
      }
      result = spawnSync('apt-get', [
        'satisfy',
        '-y',
        data,
        '--no-install-recommends',
      ])
      if (result.status !== 0) {
        throw new Error(
          `无法安装系统依赖项：状态=${result.status},错误=${result.error},标准输出=${result.stdout.toString('utf8')},标准错误=${result.stderr.toString('utf8')}`
        )
      }

      return true
    }

    // 读取deb.deps文件中的依赖列表(如果存在)
    let debianDeps: string[] = []
    if (fs.existsSync(debDepsPath)) {
      debianDeps = fs.readFileSync(debDepsPath, 'utf8')
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.split(' ')[0]) // 只获取包名，忽略版本要求
    } else {
      logger.warn('依赖配置文件不存在')
      return true
    }

    // 检查是否有sudo权限
    const useSudo = await hasSudoAccess()

    // 获取该发行版的配置
    const distroConfig = LINUX_CONFIGS[distroType]
    if (!distroConfig) {
      return true
    }

    // 映射依赖名称
    const mappedDeps = mapDependencies(distroType, debianDeps)
    const chineseFonts = distroConfig.chineseFonts

    // 所有需要安装的包
    const allPackages = [...new Set([...mappedDeps, ...chineseFonts])]

    // 尝试执行包管理器状态检查
    try {
      await execAsync(`${useSudo ? 'sudo ' : ''}${distroConfig.testCmd}`)
    } catch {
      // 包管理器不可用
      return true
    }

    // 尝试更新包索引
    try {
      await execAsync(`${useSudo ? 'sudo ' : ''}${distroConfig.updateCmd}`)
    } catch {
      // 忽略更新失败
    }

    // 安装所有依赖
    await installPackages(distroConfig.installCmd, allPackages, useSudo)

    return true
  } catch (error) {
    // 记录错误但不影响浏览器启动
    logger.error('依赖安装过程出错:', error instanceof Error ? error.message : String(error))
    return true
  }
}
