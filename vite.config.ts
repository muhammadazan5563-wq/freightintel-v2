
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/equipment': {
            target: 'https://searchcarriers.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/equipment/, '/company'),
            followRedirects: true,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
