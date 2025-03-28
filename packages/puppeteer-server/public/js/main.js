// 当前配置数据
let currentConfig = null

/**
 * 获取存储的token
 * @returns {string|null} token
 */
function getToken () {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * 清除存储的token
 */
function clearToken () {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

// DOM元素常量
const CONFIG_FORM = document.getElementById('config-form')
const LOADING = document.getElementById('loading')
const LAST_UPDATE = document.getElementById('last-update')
const SAVE_BTN = document.getElementById('save-btn')
const WS_CLIENT_CONTAINER = document.getElementById('ws-client-container')
const ENV_CONTAINER = document.getElementById('env-container')
const ADD_WS_CLIENT_BTN = document.getElementById('add-ws-client')
const ADD_ENV_BTN = document.getElementById('add-env')
const NEW_ENV_KEY = document.getElementById('new-env-key')
const TAB_BUTTONS = document.querySelectorAll('.tab-btn')
const TAB_CONTENTS = document.querySelectorAll('.tab-content')
const TOAST = document.getElementById('toast')
const TOAST_MESSAGE = document.getElementById('toast-message')
const CURRENT_YEAR = document.getElementById('current-year')

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 设置年份
  CURRENT_YEAR.textContent = new Date().getFullYear()

  // 初始化标签页切换
  initTabs()

  // 初始化按钮事件
  initButtons()

  // 获取配置
  fetchConfig()
})

/**
 * 初始化标签页切换
 */
function initTabs () {
  TAB_BUTTONS.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab

      // 更新标签按钮样式
      TAB_BUTTONS.forEach(btn => {
        if (btn.dataset.tab === target) {
          btn.classList.add('border-primary-500', 'text-primary-600', 'dark:text-primary-400')
          btn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300')
        } else {
          btn.classList.remove('border-primary-500', 'text-primary-600', 'dark:text-primary-400')
          btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300')
        }
      })

      // 更新内容显示
      TAB_CONTENTS.forEach(content => {
        if (content.dataset.tabContent === target) {
          content.classList.remove('hidden')
        } else {
          content.classList.add('hidden')
        }
      })
    })
  })
}

/**
 * 初始化按钮事件
 */
function initButtons () {
  // 保存配置按钮
  SAVE_BTN.addEventListener('click', saveConfig)

  // 添加WS客户端按钮
  ADD_WS_CLIENT_BTN.addEventListener('click', () => {
    addWsClientForm({
      enable: false,
      url: 'ws://127.0.0.1:7777/render',
      heartbeatTime: 30 * 1000,
      reconnectionTime: 5 * 1000,
      authorization: ''
    }, currentConfig.ws_client.length)
  })

  // 添加环境变量按钮
  ADD_ENV_BTN.addEventListener('click', () => {
    const envKey = NEW_ENV_KEY.value.trim()
    if (envKey) {
      addEnvForm(envKey, '', true)
      NEW_ENV_KEY.value = ''
    } else {
      showToast('请输入环境变量名', 'error')
    }
  })
}

/**
 * 获取配置数据
 */
async function fetchConfig () {
  try {
    const token = getToken()
    if (!token) {
      window.location.href = '/login.html'
      return
    }

    const response = await fetch('/api/config/get', {
      headers: {
        Authorization: token
      }
    })

    if (response.status === 401) {
      // 认证失败，跳转到登录页
      clearToken()
      window.location.href = '/login.html'
      return
    }

    if (!response.ok) {
      throw new Error(`获取配置失败: ${response.statusText}`)
    }

    currentConfig = await response.json()
    currentConfig = currentConfig.data

    // 确保所有配置使用下划线命名法
    if (currentConfig.wsClient && !currentConfig.ws_client) {
      currentConfig.ws_client = currentConfig.wsClient
    }

    if (currentConfig.wsServer && !currentConfig.ws_server) {
      currentConfig.ws_server = currentConfig.wsServer
    }

    // 设置更新时间
    LAST_UPDATE.textContent = new Date().toLocaleString()

    // 填充表单数据
    fillFormData(currentConfig)

    // 显示表单
    LOADING.classList.add('hidden')
    CONFIG_FORM.classList.remove('hidden')
  } catch (error) {
    console.error('获取配置错误:', error)
    showToast('获取配置失败', 'error')
  }
}

/**
 * 填充表单数据
 * @param {Object} config 配置数据
 */
function fillFormData (config) {
  // 浏览器配置
  document.getElementById('browser-download').value = config.browser.downloadBrowser || 'chrome'
  document.getElementById('browser-debug').value = config.browser.debug.toString()
  document.getElementById('browser-maxPages').value = config.browser.maxPages
  document.getElementById('browser-idleTime').value = config.browser.idleTime
  document.getElementById('browser-hmr').value = config.browser.hmr.toString()
  document.getElementById('browser-headless').value = config.browser.headless.toString()
  document.getElementById('browser-executablePath').value = config.browser.executablePath || ''
  document.getElementById('browser-userDataDir').value = config.browser.userDataDir || ''
  document.getElementById('browser-protocol').value = config.browser.protocol || 'cdp'
  document.getElementById('browser-args').value = (config.browser.args || []).join('\n')

  // HTTP配置
  document.getElementById('http-host').value = config.http.host
  document.getElementById('http-port').value = config.http.port
  document.getElementById('http-token').value = config.http.token || ''
  document.getElementById('http-limit').value = config.http.limit
  // 将字节转换为MB显示
  const uploadValueMB = config.http.upload ? (config.http.upload / (1024 * 1024)).toFixed(1) : ''
  document.getElementById('http-upload').value = uploadValueMB
  document.getElementById('http-screenshot').value = config.http.screenshot.toString()

  // WS服务端配置
  document.getElementById('ws-server-enable').value = config.ws_server.enable.toString()
  document.getElementById('ws-server-path').value = config.ws_server.path
  document.getElementById('ws-server-token').value = config.ws_server.token || ''
  document.getElementById('ws-server-timeout').value = config.ws_server.timeout || ''

  // WS客户端配置
  WS_CLIENT_CONTAINER.innerHTML = ''
  config.ws_client.forEach((client, index) => {
    addWsClientForm(client, index)
  })

  // 日志配置
  document.getElementById('logger-level').value = config.logger.level

  // 环境变量配置
  ENV_CONTAINER.innerHTML = ''
  for (const [key, value] of Object.entries(config.env || {})) {
    addEnvForm(key, value)
  }
}

/**
 * 添加WS客户端表单
 * @param {Object} client 客户端配置
 * @param {number} index 索引
 */
function addWsClientForm (client, index) {
  const clientDiv = document.createElement('div')
  clientDiv.classList.add('card', 'bg-base-100', 'shadow-md', 'mb-4')
  clientDiv.dataset.index = index

  // 确保卡片也应用当前主题
  const currentTheme = document.documentElement.getAttribute('data-theme')
  if (currentTheme) {
    clientDiv.setAttribute('data-theme', currentTheme)
  }

  // 创建HTML内容
  const html = `
    <div class="card-body">
      <div class="flex justify-between items-center mb-2">
        <h3 class="card-title text-lg">客户端 #${index + 1}</h3>
        <button type="button" class="btn btn-circle btn-sm btn-error" data-delete="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div class="divider my-1"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 form-control-compact">
        <div class="form-control w-full">
          <label class="label" for="ws-client-enable-${index}">
            <span class="label-text text-gray-700 dark:text-gray-300">启用</span>
          </label>
          <select id="ws-client-enable-${index}" name="ws_client[${index}].enable" class="select select-bordered w-full">
            <option value="true" ${client.enable ? 'selected' : ''}>开启</option>
            <option value="false" ${!client.enable ? 'selected' : ''}>关闭</option>
          </select>
          <label class="label">
            <span class="label-text-alt text-gray-600 dark:text-gray-400">是否启用此WebSocket客户端连接</span>
          </label>
        </div>
        <div class="form-control w-full">
          <label class="label" for="ws-client-url-${index}">
            <span class="label-text text-gray-700 dark:text-gray-300">URL</span>
          </label>
          <input type="text" id="ws-client-url-${index}" name="ws_client[${index}].url" value="${client.url || ''}" class="input input-bordered w-full">
          <label class="label">
            <span class="label-text-alt text-gray-600 dark:text-gray-400">WebSocket服务器地址，例如: ws://服务器地址:端口/路径</span>
          </label>
        </div>
        <div class="form-control w-full">
          <label class="label" for="ws-client-heartbeat-${index}">
            <span class="label-text text-gray-700 dark:text-gray-300">心跳时间 (毫秒)</span>
          </label>
          <input type="number" id="ws-client-heartbeat-${index}" name="ws_client[${index}].heartbeatTime" value="${client.heartbeatTime || client.heartbeat || ''}" class="input input-bordered w-full">
          <label class="label">
            <span class="label-text-alt text-gray-600 dark:text-gray-400">心跳包发送间隔，保持连接活跃，默认30000</span>
          </label>
        </div>
        <div class="form-control w-full">
          <label class="label" for="ws-client-reconnection-${index}">
            <span class="label-text text-gray-700 dark:text-gray-300">重连时间 (毫秒)</span>
          </label>
          <input type="number" id="ws-client-reconnection-${index}" name="ws_client[${index}].reconnectionTime" value="${client.reconnectionTime || ''}" class="input input-bordered w-full">
          <label class="label">
            <span class="label-text-alt text-gray-600 dark:text-gray-400">连接断开后的重连间隔，默认5000</span>
          </label>
        </div>
        <div class="form-control w-full">
          <label class="label" for="ws-client-token-${index}">
            <span class="label-text text-gray-700 dark:text-gray-300">鉴权密钥</span>
          </label>
          <input type="text" id="ws-client-token-${index}" name="ws_client[${index}].authorization" value="${client.authorization || client.token || ''}" class="input input-bordered w-full">
          <label class="label">
            <span class="label-text-alt text-gray-600 dark:text-gray-400">WebSocket连接认证令牌（明文）</span>
          </label>
        </div>
      </div>
    </div>
  `

  // 设置HTML
  clientDiv.innerHTML = html
  WS_CLIENT_CONTAINER.appendChild(clientDiv)

  // 为删除按钮添加事件监听
  clientDiv.querySelector(`[data-delete="${index}"]`).addEventListener('click', () => {
    clientDiv.remove()
  })
}

/**
 * 添加环境变量表单
 * @param {string} key 变量名
 * @param {string} value 变量值
 * @param {boolean} isNew 是否为新添加的变量
 */
function addEnvForm (key, value, isNew = false) {
  const envRow = document.createElement('div')
  envRow.classList.add('flex', 'gap-4', 'items-center')

  // 确保应用当前主题
  const currentTheme = document.documentElement.getAttribute('data-theme')
  if (currentTheme) {
    envRow.setAttribute('data-theme', currentTheme)
  }

  envRow.innerHTML = `
    <div class="flex-grow">
      <input type="text" id="env-key-${key}" name="env.key" value="${key}" class="input input-bordered w-full" readonly>
    </div>
    <div class="flex-grow">
      <input type="text" id="env-value-${key}" name="env.value.${key}" value="${value}" class="input input-bordered w-full" placeholder="无值请输入null">
    </div>
    <button type="button" class="btn btn-circle btn-sm btn-error" data-delete-env="${key}">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
    </button>
  `

  ENV_CONTAINER.appendChild(envRow)

  // 添加删除事件
  envRow.querySelector(`[data-delete-env="${key}"]`).addEventListener('click', () => {
    envRow.remove()
  })

  // 如果是新添加的，添加动画效果
  if (isNew) {
    envRow.classList.add('animate-fadeIn')
    setTimeout(() => {
      envRow.classList.remove('animate-fadeIn')
    }, 500)
  }
}

/**
 * 从表单获取配置数据
 * @returns {Object} 配置数据
 */
function getConfigFromForm () {
  // 浏览器配置
  const browser = {
    ...currentConfig.browser,
    downloadBrowser: document.getElementById('browser-download').value,
    debug: document.getElementById('browser-debug').value === 'true',
    maxPages: parseInt(document.getElementById('browser-maxPages').value, 10),
    idleTime: parseInt(document.getElementById('browser-idleTime').value, 10),
    hmr: document.getElementById('browser-hmr').value === 'true',
    headless: document.getElementById('browser-headless').value === 'true',
    executablePath: document.getElementById('browser-executablePath').value || null,
    userDataDir: document.getElementById('browser-userDataDir').value || '',
    protocol: document.getElementById('browser-protocol').value,
    args: document.getElementById('browser-args').value.split('\n').filter(line => line.trim() !== ''),
    defaultViewport: currentConfig.browser.defaultViewport // 保留原始值
  }

  // HTTP配置
  const http = {
    host: document.getElementById('http-host').value,
    port: parseInt(document.getElementById('http-port').value, 10),
    token: document.getElementById('http-token').value || null,
    limit: document.getElementById('http-limit').value,
    screenshot: document.getElementById('http-screenshot').value === 'true'
  }

  // 处理上传限制 - 从MB转换为字节
  const uploadValueMB = document.getElementById('http-upload').value
  if (uploadValueMB) {
    // 将MB转换为字节
    http.upload = Math.round(parseFloat(uploadValueMB) * 1024 * 1024)
  } else {
    http.upload = null
  }

  // WS服务端配置 - 只使用下划线命名法
  const ws_server = {
    enable: document.getElementById('ws-server-enable').value === 'true',
    path: document.getElementById('ws-server-path').value,
    token: document.getElementById('ws-server-token').value || null
  }

  const timeoutValue = document.getElementById('ws-server-timeout').value
  if (timeoutValue) {
    ws_server.timeout = parseInt(timeoutValue, 10)
  } else {
    ws_server.timeout = null
  }

  // WS客户端配置 - 只使用下划线命名法
  const ws_client = []
  const clientDivs = WS_CLIENT_CONTAINER.querySelectorAll('div[data-index]')
  clientDivs.forEach(div => {
    const index = parseInt(div.dataset.index, 10)

    const client = {
      enable: document.getElementById(`ws-client-enable-${index}`).value === 'true',
      url: document.getElementById(`ws-client-url-${index}`).value
    }

    // 处理心跳时间字段
    const heartbeatValue = document.getElementById(`ws-client-heartbeat-${index}`).value
    if (heartbeatValue) {
      client.heartbeatTime = parseInt(heartbeatValue, 10)
    } else {
      client.heartbeatTime = null
    }

    // 处理重连时间字段
    const reconnectionValue = document.getElementById(`ws-client-reconnection-${index}`)
    if (reconnectionValue && reconnectionValue.value) {
      client.reconnectionTime = parseInt(reconnectionValue.value, 10)
    } else {
      client.reconnectionTime = null
    }

    // 处理鉴权密钥
    const authValue = document.getElementById(`ws-client-token-${index}`).value
    if (authValue) {
      client.authorization = authValue
    } else {
      client.authorization = null
    }

    ws_client.push(client)
  })

  // 日志配置
  const logger = {
    level: document.getElementById('logger-level').value
  }

  // 环境变量配置 - 修改为数组格式
  const env = []
  const envInputs = document.querySelectorAll('input[name^="env.value."]')
  envInputs.forEach(input => {
    const key = input.name.replace('env.value.', '')
    const value = input.value.trim()
    // 将环境变量以数组形式添加
    env.push({
      key,
      value: value === '' || value === 'null' ? null : value
    })
  })

  // 创建配置对象 - 只使用下划线命名风格
  const config = {
    browser,
    http,
    logger,
    env,
    ws_server,
    ws_client
  }

  return config
}

/**
 * 保存配置
 */
async function saveConfig () {
  try {
    const token = getToken()
    if (!token) {
      window.location.href = '/login.html'
      return
    }

    const config = getConfigFromForm()

    const response = await fetch('/api/config/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify(config)
    })

    if (response.status === 401) {
      // 认证失败，跳转到登录页
      clearToken()
      window.location.href = '/login.html'
      return
    }

    if (!response.ok) {
      throw new Error(`保存配置失败: ${response.statusText}`)
    }

    await response.json()

    // 更新当前配置
    currentConfig = config

    // 更新更新时间
    LAST_UPDATE.textContent = new Date().toLocaleString()

    showToast('配置保存成功')
  } catch (error) {
    console.error('保存配置错误:', error)
    showToast('保存配置失败', 'error')
  }
}

/**
 * 显示提示框
 * @param {string} message 消息
 * @param {string} type 类型 success|error
 */
function showToast (message, type = 'success') {
  TOAST_MESSAGE.textContent = message

  // 设置图标颜色
  const icon = document.getElementById('toast-icon').querySelector('svg')
  if (type === 'success') {
    icon.classList.remove('text-red-500')
    icon.classList.add('text-green-500')
  } else {
    icon.classList.remove('text-green-500')
    icon.classList.add('text-red-500')
  }

  // 显示提示框
  TOAST.classList.remove('translate-x-full', 'opacity-0')

  // 3秒后隐藏
  setTimeout(() => {
    TOAST.classList.add('translate-x-full', 'opacity-0')
  }, 3000)
}

// 监听主题变化事件
document.addEventListener('themeChanged', (e) => {
  const theme = e.detail.theme
  updateDynamicElementsTheme(theme)
})

/**
 * 更新动态创建的元素的主题
 * @param {string} theme 主题名称
 */
function updateDynamicElementsTheme (theme) {
  // 更新WS客户端卡片
  const wsClientCards = WS_CLIENT_CONTAINER.querySelectorAll('.card')
  wsClientCards.forEach(card => {
    card.setAttribute('data-theme', theme)
  })

  // 更新环境变量行
  const envRows = ENV_CONTAINER.querySelectorAll('div')
  envRows.forEach(row => {
    row.setAttribute('data-theme', theme)
  })
}
