import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    // Ensure output JS files are encoded as UTF-8 so special characters (₱, emojis) render correctly
    charset: 'utf8',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap-vendor': ['bootstrap'],
          'sweetalert2-vendor': ['sweetalert2'],
        },
      },
    },
  },
})
