import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' 确保构建产物使用相对路径，兼容 GitHub Pages 项目子路径部署
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
  worker: {
    format: 'es',
  },
})
