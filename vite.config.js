import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'review' ? './' : '/',
  ...(mode === 'review' ? { build: { outDir: 'review-dist', rollupOptions: { input: path.resolve(__dirname, 'review.html') } } } : {}),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
