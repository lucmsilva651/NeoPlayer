import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src https: file: ws://localhost:5173 wss://localhost:5173",
  "worker-src 'self'",
  "object-src 'none'",
].join('; ');

export default defineConfig({
  plugins: [vue()],
  root: 'src/ui',
  base: './',
  assetsInclude: ['**/*.wasm'],
  server: {
    headers: {
      'Content-Security-Policy': DEV_CSP,
    },
  },
});
