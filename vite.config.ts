import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: { https: {} },
    plugins: [mkcert()],
    build: {
      sourcemap: true,
      outDir: "./dist",
    },
  };
});
