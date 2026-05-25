import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import { version } from './package.json';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Upload source maps to Sentry during production builds.
    // Requires SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT env vars.
    // No-op when SENTRY_AUTH_TOKEN is unset (local builds and dev server).
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT ?? 'my-collections-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      silent: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
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
    sourcemap: 'hidden',
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  // Pre-bundle workspace packages that export runtime values (enums).
  // Without this, Vite can't resolve named exports from CJS __exportStar.
  optimizeDeps: {
    include: ['@my-collections/shared'],
  },
});
