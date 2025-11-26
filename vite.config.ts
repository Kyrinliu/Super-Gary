import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // In Vercel environment, variables are often in process.env directly
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This enables process.env.API_KEY to work in the browser code
      // We JSON.stringify it to ensure it's treated as a string literal during build replacement
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    }
  };
});