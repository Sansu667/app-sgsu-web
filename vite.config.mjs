import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración del empaquetador y del entorno de pruebas.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo, /api se redirige a la API que corre en el puerto 3000,
    // para evitar problemas de CORS y usar rutas relativas en todo el código.
    proxy: {
      // API_OBJETIVO permite apuntar a otra instancia de la API, como la que
      // levantan las pruebas de extremo a extremo en el puerto 3100.
      '/api': { target: process.env.API_OBJETIVO || 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/pruebas/configuracionPruebas.js',
    include: ['src/pruebas/**/*.prueba.{js,jsx}'],
  },
});
