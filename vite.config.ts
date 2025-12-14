import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键：GitHub Pages 通常部署在子目录，使用 './' 确保资源路径正确
  base: './', 
  server: {
    host: true, // 允许局域网访问
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  }
});