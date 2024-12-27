# 使用说明

## 安装

```bash
npm init -y && npm install @karinjs/puppeteer && npx init && node .
# or
pnpm init && pnpm install @karinjs/puppeteer && npx init && node .
# or
yarn init -y && yarn add @karinjs/puppeteer && npx init && node .
```

## 1. 项目配置

`./config.json`:

```json
{
  "logLevel": "info",
  "headless": true,
  "http": {
    "host": "0.0.0.0",
    "port": 7005,
    "token": "123456"
  },
  "ws": {
    "enable": true,
    "token": "123456",
    "path": "/ws",
    "list": [
      {
        "url": "ws://127.0.0.1:7000/puppeteer",
        "token": "123456"
      }
    ]
  },
  // 浏览器启动数量 启动多个会导致cpu占用过高
  "browserCount": 1,
  // 传递给浏览器的参数
  "args": [
    "--enable-gpu",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--no-zygote",
    "--disable-extensions",
    "--disable-dev-shm-usage",
    "--window-size=1920,1080",
    "--force-device-scale-factor=2"
  ]
}
```

## 2. http接口

### 2.1 ping

请求示例:

```bash
curl http://127.0.0.1:7005/ping
```

### 2.2 计算token的md5值

请求示例:

```bash
curl http://127.0.0.1:7005/hex/123456
```

### 2.3 快速截图(GET)

请求示例:

```bash
curl http://127.0.0.1:7005/puppeteer?auth=123456&file=file:///root/1.png
curl http://127.0.0.1:7005/puppeteer?auth=123456&file=http://www.baidu.com
```

### 2.4 自定义传参截图(POST)

请求地址: `http://127.0.0.1:7005/puppeteer`  
请求方式: `POST`  
请求参数: `json` 详细参数查看[参数说明](https://github.com/KarinJS/puppeteer-core/blob/d92140a9f156aee07a855f6824f3ae8a8cd95da1/src/puppeteer/core.ts#L5)  
鉴权方式: http头部`authorization`字段  

```json
{
  "file": "file://D:/karin/puppeteer/test.html",
  "pageGotoParams": {
    "waitUntil": "networkidle2"
  }
}

```

### 2.5 模板渲染(POST)

请求地址: `http://127.0.0.1:7005/render`

> 这里只是在2.4的基础上增加了模板渲染的功能，所有参数不变，新增了`data`参数，传递给`art-template`模板的数据

```html
<style>
  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th,
  .table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  .table th {
    background-color: #4CAF50;
    color: white;
  }

  .table .highlight {
    background-color: #f2f2f2;
  }
</style>

<table class="table">
  <thead>
    <tr>
      <th>#</th>
      <th>名称</th>
      <th>数量</th>
      <th>价格</th>
      <th>总计</th>
    </tr>
  </thead>
  <tbody>
    {{each items item index}}
    <tr class="{{index % 2 === 0 ? 'highlight' : ''}}">
      <td>{{index + 1}}</td>
      <td>{{item.name}}</td>
      <td>{{item.quantity}}</td>
      <td>{{item.price.toFixed(2)}}</td>
      <td>{{(item.quantity * item.price).toFixed(2)}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4" style="text-align: right;"><strong>总计</strong></td>
      <td>{{items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}}</td>
    </tr>
  </tfoot>
</table>
```

```json
{
  "file": "file://D:/karin/puppeteer/test.html",
  "pageGotoParams": {
    "waitUntil": "networkidle2"
  },
  "data": {
    "items": [
      {
        "name": "桃子",
        "quantity": 2,
        "price": 10.5
      },
      {
        "name": "苹果",
        "quantity": 1,
        "price": 23.0
      },
      {
        "name": "西瓜",
        "quantity": 3,
        "price": 5.75
      }
    ]
  }
}
```

## 启动

```bash
# 前台启动
node .

# 查看全部指令
npx k

# 初始化
npx init

# 后台启动 需要全局安装pm2 `npm install -g pm2`
npx k .
npx k app
npx k start

# pm2重启
npx k rs

# pm2停止
npx k stop

# pm2查看日志
npx k log
```


### vue单组件

```vue
<template>
  <div class="profile-card" data-v-component>
    <div class="profile-header">
      <div class="avatar">
        <img :src="avatar" alt="头像" v-if="avatar">
        <div class="avatar-placeholder" v-else>{{ nameInitial }}</div>
      </div>
      <h2 class="name">{{ name }}</h2>
    </div>

    <div class="profile-info">
      <div class="info-item">
        <span class="label">年龄:</span>
        <span class="value">{{ age }}岁</span>
      </div>
      <div class="info-item">
        <span class="label">职业:</span>
        <span class="value">{{ occupation }}</span>
      </div>
      <div class="info-item">
        <span class="label">所在地:</span>
        <span class="value">{{ location }}</span>
      </div>
      <div class="info-item">
        <span class="label">邮箱:</span>
        <span class="value">{{ email }}</span>
      </div>
    </div>

    <div class="profile-bio">
      <p>{{ bio }}</p>
    </div>
  </div>
</template>

<style scoped>
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

<script setup>
const name = '张三'
const avatar = ''
const age = 18
const occupation = '前端工程师'
const location = '北京'
const email = 'test@gmail.com'
const bio = '这是一段个人简介'

</script>
```

- 将上面的代码保存为`test.vue`文件
- 使用接口 [#2.4 自定义传参截图post)](#24-自定义传参截图post)
- 请求参数如下:

```json
{
  "file": "/root/test.vue",
  "data": {
    "name": "张三",
    "age": 28,
    "occupation": "前端工程师",
    "location": "北京市朝阳区",
    "email": "zhangsan@example.com",
    "bio": "热爱技术，专注于前端开发5年，擅长 Vue.js 和 React。工作之余喜欢摄影和旅行，希望能用技术改变世界。",
    "avatar": "https://upload-bbs.miyoushe.com/upload/2023/10/24/80663279/3e83fef3d037b0de8d838cfe53582f5e_2622909253864094745.jpg"
  }
}
```