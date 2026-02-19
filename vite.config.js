import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/flip7/',
  plugins: [react()],
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.js'],
    restoreMocks: true,
  },
})
