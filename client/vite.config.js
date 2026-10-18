import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let target = env.VITE_BACKEND_TARGET || env.VITE_BACKEND_URL || 'http://localhost:5001'

  // If set to localhost or IP without protocol/port, normalize it
  if (target === 'localhost' || target === '127.0.0.1') {
    target = 'http://localhost:5001'
  } else if (!target.startsWith('http')) {
    target = `http://${target}`
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
