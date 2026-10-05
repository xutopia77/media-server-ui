import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:38080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      // WHIP/WHEP signaling endpoints (SDP offer in body, session URL in Location header).
      '/whip': {
        target: 'http://localhost:38080',
        changeOrigin: true,
        secure: false
      },
      '/whep': {
        target: 'http://localhost:38080',
        changeOrigin: true,
        secure: false
      }
    }
  },
})
