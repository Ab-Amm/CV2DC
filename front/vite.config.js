import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Forcer l'extension .js pour tous les chunks
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    }
  }
})