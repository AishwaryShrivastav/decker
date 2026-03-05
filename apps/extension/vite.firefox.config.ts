import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Firefox MV2 build.
 *
 * Key differences from the Chrome MV3 build:
 * - outDir: dist-firefox/
 * - publicDir: public-firefox/ (contains MV2 manifest + persistent background page)
 * - No offscreen entry — Firefox uses the persistent background page instead
 * - target: firefox115 (ESM supported in FF 115+)
 *
 * TODO (Firefox recording): Implement MediaRecorder capture using the persistent
 * background page + iframe approach once Firefox's tabCapture API support
 * is confirmed. The chrome.offscreen API does not exist in Firefox.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-firefox",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Background script runs in the persistent background page (not a SW)
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        popup: resolve(__dirname, "src/popup/index.ts"),
        // NOTE: offscreen is Chrome-only; omitted here
      },
      output: {
        entryFileNames: "src/[name]/index.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        // Firefox 115+ supports ESM in background pages via <script type="module">
        format: "es",
      },
    },
    target: "firefox115",
    minify: false,
  },
  publicDir: "public-firefox",
});
