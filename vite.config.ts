import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    // Skip pre-bundling @google/genai — large esbuild output often fails when C: is low on space.
    // p-retry is CJS with named exports (AbortError); must be pre-bundled or ESM import { AbortError } breaks.
    optimizeDeps: {
      exclude: ['@google/genai'],
      include: ['p-retry'],
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      // IPv4 only — on Windows, "localhost" often resolves to IPv6 first and can 500; use 127.0.0.1 in the browser.
      host: '127.0.0.1',
      open: false,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
  };
});
