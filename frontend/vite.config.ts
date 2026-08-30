import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/full-pipeline': 'http://localhost:8000',
      '/control-panel': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
      '/extract-formulas': 'http://localhost:8000',
      '/generate-diagram': 'http://localhost:8000',
      '/generate-diagrams-batch': 'http://localhost:8000',
      '/generate-report': 'http://localhost:8000',
      '/parse': 'http://localhost:8000',
      '/classify': 'http://localhost:8000',
      '/index': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
});
