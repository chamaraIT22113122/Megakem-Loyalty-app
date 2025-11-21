import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5173,
    host: true, // Listen on all addresses including LAN
    https: false, // We'll use ngrok for HTTPS instead
  }
})
