import { createSSRApp } from 'vue'
import { parse } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'

/**
 * 将 Vue 组件转换为 HTML 字符串
 * @param component Vue 但组件文件绝对路径
 * @param options 传递给组件的数据
 */
export const vueToHtml = async (component: string, options: Record<string, any>) => {
  const { descriptor } = parse(component)
  const template = descriptor.template?.content || ''
  const app = createSSRApp({ template, data: () => options })
  const html = await renderToString(app)
  const styles = descriptor.styles.map(style => style.content).join('\n')

  const data = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
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
          ${styles}
        </style>
      </head>
      <body>
        <div id="app">
        ${html}
        </div>
      </body>
    </html>
    `

  return data
}
