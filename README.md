# 使用说明

## 安装

> 需要先`npm init`初始化项目

```bash
npm install @karinjs/puppeteer && node .
# or
npm install @karinjs/puppeteer && npx init && node .
# or
pnpm init && pnpm install @karinjs/puppeteer && node .
# or
pnpm init && pnpm install @karinjs/puppeteer && npx init && node .
# or
yarn init && yarn add @karinjs/puppeteer && node .
# or
yarn init && yarn add @karinjs/puppeteer && npx init && node .
```

## 1. 项目配置

`./config.json`:

```json
{
  "logLevel": "info",
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
