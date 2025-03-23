// 主题管理
const html = document.documentElement
const body = document.body
const themeSelect = document.getElementById('theme-select')

// 初始化主题
function initTheme () {
  // 从本地存储获取主题设置
  const savedTheme = localStorage.getItem('theme')

  // 如果之前选择了"跟随系统"
  if (savedTheme === 'system' || !savedTheme) {
    // 使用系统首选主题
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark')
    } else {
      applyTheme('light')
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('theme') === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })

    // 设置选择框为"跟随系统"
    if (themeSelect) themeSelect.value = 'system'
  } else {
    // 应用保存的主题
    applyTheme(savedTheme)
    if (themeSelect) themeSelect.value = savedTheme
  }

  // 添加选择框事件监听器
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value
      if (selectedTheme === 'system') {
        localStorage.setItem('theme', 'system')
        applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      } else {
        localStorage.setItem('theme', selectedTheme)
        applyTheme(selectedTheme)
      }
    })
  }
}

// 应用主题
function applyTheme (theme) {
  // 设置HTML和body的data-theme属性
  html.setAttribute('data-theme', theme)
  body.setAttribute('data-theme', theme)

  // 更新dark类
  if (theme === 'dark') {
    html.classList.add('dark')
    body.classList.add('dark')
  } else {
    html.classList.remove('dark')
    body.classList.remove('dark')
  }

  // 派发主题变化事件
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
}

// 页面加载时初始化主题
document.addEventListener('DOMContentLoaded', initTheme)