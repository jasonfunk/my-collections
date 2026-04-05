import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // During development, proxy API calls to the NestJS server
      // so we avoid CORS issues and can use relative paths in the app
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  // Pre-bundle workspace packages that export runtime values (enums).
  // Without this, Vite can't resolve named exports from CJS __exportStar.
  optimizeDeps: {
    include: ['@my-collections/shared'],
  },
});
