import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_E2E_TEST ? 'http://127.0.0.1:8001' : 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
