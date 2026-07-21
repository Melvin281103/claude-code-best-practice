// Vite build configuration for InvestMe.
// This tells Vite to use the React plugin (so .jsx files work)
// and to serve the app on a fixed port during development.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
