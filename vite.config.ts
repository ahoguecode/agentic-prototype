import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: { 
      port: 5173 
    },
    build: {
      sourcemap: true,
      outDir: "./dist",
    },
  };
});
