import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: '/agentic-prototype/',
    server: { 
      port: 5173 
    },
    build: {
      sourcemap: true,
      outDir: "./dist",
      assetsDir: "assets",
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
  };
});
