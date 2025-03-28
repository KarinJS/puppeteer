import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

/**
 * 主题类型定义
 */
type Theme = 'system' | 'dark' | 'light'

/**
 * 主题切换组件属性
 */
interface ThemeToggleProps {
  className?: string
}

/**
 * 主题切换组件
 */
const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  // 主题切换顺序
  const themeOrder: Theme[] = ['system', 'dark', 'light']

  // 当前主题索引
  const [currentThemeIndex, setCurrentThemeIndex] = useState<number>(0)
  // 当前主题
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  // 主题切换锁
  const [isThemeSwitching, setIsThemeSwitching] = useState<boolean>(false)

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    const themeIndex = themeOrder.indexOf(savedTheme)

    if (themeIndex !== -1) {
      setCurrentThemeIndex(themeIndex)
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  /**
   * 应用主题
   */
  const applyTheme = (theme: Theme) => {
    // 防止重复执行主题切换
    if (isThemeSwitching) return
    setIsThemeSwitching(true)

    try {
      const html = document.documentElement
      const body = document.body

      if (theme === 'system') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        const actualTheme = isDarkMode ? 'dark' : 'light'

        // 更新HTML和BODY元素
        html.classList.toggle('dark', isDarkMode)
        html.setAttribute('data-theme', actualTheme)
        body.classList.toggle('dark', isDarkMode)
        body.setAttribute('data-theme', actualTheme)
      } else if (theme === 'dark') {
        // 更新HTML和BODY元素
        html.classList.add('dark')
        html.setAttribute('data-theme', 'dark')
        body.classList.add('dark')
        body.setAttribute('data-theme', 'dark')
      } else if (theme === 'light') {
        // 更新HTML和BODY元素
        html.classList.remove('dark')
        html.setAttribute('data-theme', 'light')
        body.classList.remove('dark')
        body.setAttribute('data-theme', 'light')
      }

      // 强制触发重绘
      setTimeout(() => {
        document.body.style.transition = 'none'
        document.body.offsetHeight // 触发重绘
        document.body.style.transition = ''
      }, 5)
    } finally {
      // 解除锁定状态
      setTimeout(() => {
        setIsThemeSwitching(false)
      }, 150)
    }
  }

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    // 如果主题切换正在进行中，忽略此次点击
    if (isThemeSwitching) return

    // 循环切换主题
    const nextIndex = (currentThemeIndex + 1) % themeOrder.length
    const nextTheme = themeOrder[nextIndex]

    // 保存并应用新主题
    localStorage.setItem('theme', nextTheme)
    setCurrentThemeIndex(nextIndex)
    setCurrentTheme(nextTheme)
    applyTheme(nextTheme)
  }

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === 'system') {
        const html = document.documentElement
        const body = document.body
        const newTheme = e.matches ? 'dark' : 'light'

        // 同时更新HTML和BODY元素
        html.classList.toggle('dark', e.matches)
        html.setAttribute('data-theme', newTheme)
        body.classList.toggle('dark', e.matches)
        body.setAttribute('data-theme', newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <button
      type='button'
      onClick={toggleTheme}
      className={`rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
      title='切换主题'
    >
      {currentTheme === 'system' && (
        <ComputerDesktopIcon className='h-5 w-5' />
      )}
      {currentTheme === 'dark' && (
        <MoonIcon className='h-5 w-5' />
      )}
      {currentTheme === 'light' && (
        <SunIcon className='h-5 w-5' />
      )}
    </button>
  )
}

export default ThemeToggle
