import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://papayawhip-tapir-274068.hostingersite.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
