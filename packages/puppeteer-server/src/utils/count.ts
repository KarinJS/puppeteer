import fs from 'fs'

const file = 'count.json'
/** 如果不存在则创建 */
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({ count: 0, start: 0, video: 0 }, null, 2))
}

export const count = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
  /** 截图次数 */
  count: number,
  /** 启动次数 */
  start: number
  /** 生成视频次数 */
  video: number
}

count.start++
const exit = async () => fs.writeFileSync(file, JSON.stringify(count, null, 2))

/** 监听挂起信号 在终端关闭时触发 */
process.once('SIGHUP', exit)
/** 监听中断信号 用户按下 Ctrl + C 时触发 */
process.once('SIGINT', exit)
/** 监听终止信号 程序正常退出时触发 */
process.once('SIGTERM', exit)
/** 监听退出信号 windows下程序正常退出时触发 */
process.once('SIGBREAK', exit)
/** 监听退出信号 与 SIGINT 类似，但会生成核心转储 */
process.once('SIGQUIT', exit)
/** 监听退出信号 Node.js进程退出时触发 */
process.once('exit', exit)
/** 监听退出信号 Node.js进程退出时触发 */
process.once('beforeExit', exit)

/** 每1分钟保存一次 */
setInterval(exit, 60000)
