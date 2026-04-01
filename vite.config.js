import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800, // kB — suppress warnings, app is SPA with heavy features
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'zustand': ['zustand'],
          'phosphor': ['phosphor-react'],
        }
      }
    }
  }
})
