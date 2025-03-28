import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 开发服务器配置
  server: {
    port: 5173,
    open: true,
    proxy: {
      // 将 API 请求代理到后端服务器
      '/api': {
        target: 'http://localhost:7775',
        changeOrigin: true,
      },
    },
  },
  // 构建配置
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
    sourcemap: false,
  },
})
