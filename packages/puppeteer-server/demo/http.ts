import fs from 'node:fs'

const baseUrl = 'http://127.0.0.1:7775'

/**
 * 接口1 渲染模板并截图
 * 此接口允许传递data 用于渲染模板
 */
async function render () {
  const res = await fetch(`${baseUrl}/api/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: 'Bearer puppeteer'
    },
    body: JSON.stringify({
      data: {
        name: '李四'
      },
      file_name: 'test.html',
      file_type: 'htmlString',
      file: `<html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f0f2f5;
    }

    #app {
      display: inline-block;
      position: relative;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 24px;
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }

    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }

    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
    }

    .name {
      font-size: 24px;
      color: #1f2937;
      margin: 0;
      font-weight: 600;
    }

    .profile-info {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .label {
      color: #6b7280;
      font-size: 14px;
    }

    .value {
      color: #111827;
      font-weight: 500;
      font-size: 14px;
    }

    .profile-bio {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
      padding: 0 8px;
    }
  </style>
</head>

<body>
  <div id="app">
    <div class="profile-card" data-v-component="">
      <div class="profile-header">
        <div class="avatar">
          <img
            src="https://upload-bbs.miyoushe.com/upload/2023/10/24/80663279/3e83fef3d037b0de8d838cfe53582f5e_2622909253864094745.jpg"
            alt="头像">
        </div>
        <h2 class="name">{{ name }}</h2>
      </div>
      <div class="profile-info">
        <div class="info-item"><span class="label">年龄:</span><span class="value">28岁</span></div>
        <div class="info-item"><span class="label">职业:</span><span class="value">前端工程师</span></div>
        <div class="info-item"><span class="label">所在地:</span><span class="value">北京市朝阳区</span></div>
        <div class="info-item"><span class="label">邮箱:</span><span class="value">zhangsan@example.com</span></div>
      </div>
      <div class="profile-bio">
        <p>热爱技术，专注于前端开发5年，擅长 Vue.js 和 React。工作之余喜欢摄影和旅行，希望能用技术改变世界。</p>
      </div>
    </div>
  </div>


</body>

</html>`,
    })
  })

  const data = await res.json()
  const arr: number[] = Object.values(data.data)
  fs.writeFileSync('render.png', Buffer.from(arr))

  // 如果是base64
  // fs.writeFileSync('test.png', Buffer.from(data.data, 'base64'))
  console.log('render 渲染、截图成功')
}

/**
 * 接口2 纯截图
 */
async function screenshot () {
  const res = await fetch(`${baseUrl}/api/screenshot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: 'Bearer puppeteer'
    },
    body: JSON.stringify({
      data: {
        name: '李四'
      },
      file_name: 'test.html',
      file: 'https://baidu.com'
    })
  })

  const data = await res.json()
  const arr: number[] = Object.values(data.data)
  fs.writeFileSync('screenshot.png', Buffer.from(arr))

  // 如果是base64
  // fs.writeFileSync('test.png', Buffer.from(data.data, 'base64'))
  console.log('screenshot 截图成功')
}

(async () => {
  await Promise.all([
    render(),
    screenshot()
  ])
})()
