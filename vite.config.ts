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
      output: {
        manualChunks(id) {
          if (id.includes("heic-to")) {
            return "heic-runtime";
          }

          if (id.includes("jszip")) {
            return "zip-runtime";
          }
        },
      },
    },
  },
});
