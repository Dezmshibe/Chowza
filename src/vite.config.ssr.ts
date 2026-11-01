import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist/server',
    emptyOutDir: true,

    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'entry-server.js',
      },
    },
  },
});
