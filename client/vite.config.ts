import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Force full reload on file changes
    hmr: {
      overlay: true,
    },
  },
  // Disable caching for development
  optimizeDeps: {
    force: true,
  },
})
