import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'src/main/index.ts',
        formats: ['cjs']
      },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: 'src/preload/preload.ts',
        formats: ['cjs']
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    server: {
      port: 8174,
      host: 'localhost'
    },
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
          sidebar: resolve(__dirname, 'src/renderer/sidebar.html'),
          modal: resolve(__dirname, 'src/renderer/src/modal/index.html')
        }
      }
    }
  },
  modal: {
    root: 'src/modal',
    plugins: [react()],
    build: {
        outDir: 'dist/modal',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/modal/index.html')
            }
        }
    }
  }
})