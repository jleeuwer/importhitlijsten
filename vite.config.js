import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setupVitest.js"],
    include: ["tests/**/*.{test,spec}.{js,jsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"]
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "src/client/main.jsx",
      output: {
        entryFileNames: "assets/main.js"
      }
    }
  }
});
