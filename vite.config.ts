import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error about cwd missing
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK to work
      // Support both VITE_API_KEY (Vite standard) and API_KEY (Container standard)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    },
    server: {
      host: true
    }
  };
});