import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_LOCAL_API_URL || 'http://localhost:10510',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
      allowedHosts: (env.VITE_ALLOWED_HOSTS ?? '')
        .split(',')
        .map((h: string) => h.trim())
        .filter(Boolean),
    },
  }
})
