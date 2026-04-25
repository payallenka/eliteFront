import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5174'
    }
    ,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '8fe6-2406-7400-9a-ef2f-79ab-bd4f-f5e9-782e.ngrok-free.app'
    ]
  }
})
