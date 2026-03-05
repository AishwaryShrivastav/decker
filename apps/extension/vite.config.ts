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
        // All four entries are TypeScript files
        // HTML files for popup + offscreen live in public/ and get copied as-is
        background: resolve(__dirname, "src/background/index.ts"),
        offscreen: resolve(__dirname, "src/offscreen/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
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
