import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, //EXPOSES VITE TO THE MOBILE DEVICE ON THE WI-FI NETWORK
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true, //REWRITES HOST HEADER FOR PROXIED REQUESTS
      },
      '/meeting': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})