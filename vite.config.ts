import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
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
        target: 'https://localhost:8088',
        secure: false,
        changeOrigin: true,
      },
    },
  },

  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  base: './',
})
