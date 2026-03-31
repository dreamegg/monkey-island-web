import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    watch: {
      ignored: ['**/tools/**', '**/node_modules/**', '**/.venv/**'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        devtools: resolve(__dirname, 'devtools.html'),
      },
    },
  },
});
