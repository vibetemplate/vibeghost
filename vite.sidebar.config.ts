import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist/renderer-sidebar'),
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/sidebar.html')
    }
  },
  server: {
    port: 8174,
    host: 'localhost'
  }
})