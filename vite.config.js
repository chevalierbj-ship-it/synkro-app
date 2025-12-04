import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et les dépendances core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Séparer les icônes lucide
          'icons': ['lucide-react']
        }
      }
    },
    // Optimiser la taille des chunks
    chunkSizeWarningLimit: 1000,
    // Minification optimale
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Retirer les console.log en production
        drop_debugger: true
      }
    }
  },
  // Optimisations de performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})