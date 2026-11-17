import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
    base: '/torneo-appv2/',
  plugins: [react()],
  server: {
    port: 5173,
    // el cliente llama a /api (y pide las fotos a /uploads) y Vite lo redirige al servidor
    proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' },
  },
});