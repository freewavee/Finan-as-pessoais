import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
    },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  server: {
    port: 3333,
    open: false,
  },
  appType: "spa",
});
