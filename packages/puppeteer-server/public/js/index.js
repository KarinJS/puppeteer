document.addEventListener('DOMContentLoaded', () => {
  // 检查登录状态
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    window.location.href = '/login.html'
    return
  }

  // 登出按钮事件
  const logoutButton = document.getElementById('logout-button')
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      window.location.href = '/login.html'
    })
  }

  // 设置当前年份
  const yearSpan = document.getElementById('current-year')
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear()
  }

  // 主题切换逻辑
  const themeToggle = document.getElementById('theme-toggle')
  const iconSystem = document.getElementById('theme-icon-system')
  const iconDark = document.getElementById('theme-icon-dark')
  const iconLight = document.getElementById('theme-icon-light')

  // 主题切换顺序：自动 -> 夜间 -> 白天
  const themeOrder = ['system', 'dark', 'light']

  // 添加主题切换状态锁，防止快速切换时出现问题
  let isThemeSwitching = false

  // 显示当前主题图标
  function showThemeIcon (theme) {
    // 隐藏所有图标
    iconSystem.classList.add('hidden')
    iconDark.classList.add('hidden')
    iconLight.classList.add('hidden')

    // 显示对应主题的图标
    if (theme === 'system') {
      iconSystem.classList.remove('hidden')
    } else if (theme === 'dark') {
      iconDark.classList.remove('hidden')
    } else if (theme === 'light') {
      iconLight.classList.remove('hidden')
    }
  }

  // 应用主题 - 更全面的主题应用方式
  function applyTheme (theme) {
    // 防止重复执行主题切换
    if (isThemeSwitching) return
    isThemeSwitching = true

    try {
      const html = document.documentElement
      const body = document.body

      if (theme === 'system') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        const actualTheme = isDarkMode ? 'dark' : 'light'

        // 更新HTML元素
        html.classList.toggle('dark', isDarkMode)
        html.setAttribute('data-theme', actualTheme)

        // 同步更新BODY元素
        body.classList.toggle('dark', isDarkMode)
        body.setAttribute('data-theme', actualTheme)
      } else if (theme === 'dark') {
        // 更新HTML元素
        html.classList.add('dark')
        html.setAttribute('data-theme', 'dark')

        // 同步更新BODY元素
        body.classList.add('dark')
        body.setAttribute('data-theme', 'dark')
      } else if (theme === 'light') {
        // 更新HTML元素
        html.classList.remove('dark')
        html.setAttribute('data-theme', 'light')

        // 同步更新BODY元素
        body.classList.remove('dark')
        body.setAttribute('data-theme', 'light')
      }

      // 显示当前主题图标
      showThemeIcon(theme)

      // 强制触发重绘，确保所有样式被正确应用
      setTimeout(() => {
        document.body.style.transition = 'none'
        document.body.offsetHeight // 触发重绘
        document.body.style.transition = ''
      }, 5)
    } finally {
      // 确保锁定状态被解除
      setTimeout(() => {
        isThemeSwitching = false
      }, 150)
    }
  }

  // 初始化主题
  let currentThemeIndex = 0
  const savedTheme = localStorage.getItem('theme') || 'system'

  // 找到保存的主题在数组中的索引
  currentThemeIndex = themeOrder.indexOf(savedTheme)
  if (currentThemeIndex === -1) currentThemeIndex = 0 // 默认使用system

  // 应用当前主题
  applyTheme(themeOrder[currentThemeIndex])

  // 主题切换按钮点击事件
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // 如果主题切换正在进行中，忽略此次点击
      if (isThemeSwitching) return

      // 循环切换主题
      currentThemeIndex = (currentThemeIndex + 1) % themeOrder.length
      const newTheme = themeOrder[currentThemeIndex]

      // 保存并应用新主题
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    })
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
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
  })
})
