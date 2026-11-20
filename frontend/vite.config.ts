import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Lambda serves the built app from ../web; in dev, API calls go to the live function URL.
export default defineConfig({
  plugins: [react()],
  build: { outDir: '../web', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
  server: {
    proxy: { '/api': { target: 'https://nhtkjglp7thihtwvxwcqkyzw6e0ntxxe.lambda-url.us-east-1.on.aws', changeOrigin: true } },
  },
})
