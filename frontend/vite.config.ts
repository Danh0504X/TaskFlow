import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Cho phép truy cập qua URL forward (vd devtunnels.ms) — Vite mặc định chặn Host header lạ
    // (chống DNS rebinding), nếu không sẽ gặp lỗi "Blocked request. This host is not allowed".
    allowedHosts: ['.devtunnels.ms'],
  },
})
