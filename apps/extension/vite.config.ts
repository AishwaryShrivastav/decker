import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // content script is built separately via vite.content.config.ts (IIFE)
        background: resolve(__dirname, "src/background/index.ts"),
        offscreen: resolve(__dirname, "src/offscreen/index.ts"),
        popup: resolve(__dirname, "src/popup/index.ts"),
      },
      output: {
        // Predictable paths that match manifest.json and HTML <script> srcs
        entryFileNames: "src/[name]/index.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    // MV3: no eval, chrome 116+ supports all ES2020 features
    target: "chrome116",
    minify: false,
  },
  // Copies public/ → dist/ (manifest.json, icons, popup.html, offscreen.html)
  publicDir: "public",
});
