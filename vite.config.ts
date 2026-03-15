import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https需要的
// import basicSsl from '@vitejs/plugin-basic-ssl'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    https: {
      key: fileURLToPath(new URL('./localhost+2-key.pem', import.meta.url)),
      cert: fileURLToPath(new URL('./localhost+2.pem', import.meta.url)),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5500', // 后端地址
        secure: true, // 忽略自签名证书
        changeOrigin: true, // 修改请求头 origin，避免跨域问题
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api 前缀
      },
    },
  },
})
