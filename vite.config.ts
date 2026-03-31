import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      external: (id) => id === "/vendor/heic-to.js",
      output: {
        manualChunks(id) {
          if (id.includes("jszip")) {
            return "zip-runtime";
          }
        },
      },
    },
  },
});
