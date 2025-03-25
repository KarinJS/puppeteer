// 登录相关逻辑
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form')
  const loginButton = document.getElementById('login-button')
  const passwordInput = document.getElementById('password')
  const errorMessage = document.getElementById('error-message')
  const toast = document.getElementById('toast')
  const toastMessage = document.getElementById('toast-message')

  // 从URL参数中获取redirect_url
  const urlParams = new URLSearchParams(window.location.search)
  const redirectUrl = urlParams.get('redirect_url') || './index.html'

  // 处理表单提交
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    handleLogin()
  })

  // 处理回车键登录
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  })

  // 登录处理函数
  async function handleLogin () {
    const password = passwordInput.value

    // 简单的表单验证
    if (!password) {
      showError('请输入管理密码')
      return
    }

    /** sha256加密 */
    const token = 'Bearer ' + sha256(password)
    console.log('token:', token)

    // 显示加载状态
    loginButton.classList.add('loading')
    loginButton.disabled = true

    try {
      // 发送登录请求
      const response = await fetch('/api/login', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })

      // 处理响应
      if (response.ok) {
        // 保存token到localStorage
        localStorage.setItem('token', token)

        showSuccess('登录成功，正在跳转...')
        // 登录成功后，延迟跳转到主页
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1000)
      } else {
        const data = await response.json()
        showError(data.message || '密码错误，请重试')
        resetLoginButton()
      }
    } catch (error) {
      showError('连接服务器失败，请稍后再试')
      console.error('登录请求错误:', error)
      resetLoginButton()
    }
  }

  // 重置登录按钮状态
  function resetLoginButton () {
    loginButton.classList.remove('loading')
    loginButton.disabled = false
  }

  // 展示错误消息
  function showError (message) {
    errorMessage.textContent = message
    errorMessage.classList.remove('hidden')
    passwordInput.classList.add('input-error')

    // 3秒后自动隐藏错误消息
    setTimeout(() => {
      errorMessage.classList.add('hidden')
      passwordInput.classList.remove('input-error')
    }, 3000)
  }

  // 显示成功消息
  function showSuccess (message) {
    toastMessage.textContent = message
    toast.classList.remove('translate-x-full', 'opacity-0')

    // 3秒后自动隐藏成功消息
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0')
    }, 3000)
  }
})
