import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Aggressively find the key. 
  // Priority: 
  // 1. System Env VITE_API_KEY (Vercel Setting)
  // 2. System Env API_KEY (Vercel Setting)
  // 3. .env file VITE_API_KEY
  // 4. .env file API_KEY
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || env.VITE_API_KEY || env.API_KEY;

  console.log(`[Vite Build] API Key Detected: ${!!apiKey ? 'Yes' : 'No'}`);

  return {
    plugins: [react()],
    define: {
      // This enables process.env.API_KEY to work in the browser code as a fallback
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    }
  };
});