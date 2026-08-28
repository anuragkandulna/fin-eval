import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/chat':      'http://localhost:8000',
      '/analyse':   'http://localhost:8000',
      '/documents/upload': 'http://localhost:8000',
      '/documents/list':   'http://localhost:8000',
      '/health':          'http://localhost:8000',
      '/dashboard':       'http://localhost:8000',
      '/personal':        'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
