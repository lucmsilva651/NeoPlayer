import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'electron',
        'electron/main',
        'path',
        'node:path',
        '@electron-toolkit/utils',
        'electron-squirrel-startup',
      ],
    },
  },
});
