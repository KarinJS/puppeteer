# Puppeteer Server 项目

基于 `@karinjs/puppeteer-server` 的自动化脚本项目。

## 命令说明

### 基本命令

| 命令              | 说明                |
| ----------------- | ------------------- |
| `npm run app`     | 前台运行服务        |
| `npm run start`   | 使用PM2后台运行服务 |
| `npm run stop`    | 停止后台服务        |
| `npm run restart` | 重启后台服务        |
| `npm run delete`  | 删除后台服务        |
| `npm run status`  | 查看服务状态        |

### 日志与监控

| 命令                 | 说明                       |
| -------------------- | -------------------------- |
| `npm run logs`       | 查看全部日志(最近1000行)   |
| `npm run error-logs` | 仅查看错误日志(最近1000行) |
| `npm run monitor`    | 实时监控服务状态           |

### 其他命令

| 命令             | 说明                                         |
| ---------------- | -------------------------------------------- |
| `npm run update` | 更新到最新版本的 `@karinjs/puppeteer-server` |

## 快速开始

1. 前台运行（开发调试）:
```bash
npm run app
```

2. 后台运行（生产环境）:
```bash
npm run start
```

## 注意事项

- 后台运行需要全局安装PM2: `npm install -g pm2`
- 如需修改端口或其他配置，请编辑项目根目录下的`index.js`文件
- 更多高级功能请参考`@karinjs/puppeteer-server`文档

## 自定义开发

可以在`index.js`文件中添加自定义逻辑，更多API详情请查看`@karinjs/puppeteer-server`文档。 