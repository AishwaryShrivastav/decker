import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Separate build for the content script only.
 * Content scripts cannot use ES module import syntax — they run as classic
 * scripts injected into a third-party page. We build them as IIFE (a single
 * self-contained file with no import statements).
 *
 * Single entry point → IIFE format is allowed by Rollup.
 * emptyOutDir: false → don't wipe the dist/ from the main build.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "src/[name]/index.js",
        format: "iife",
        // Inline all imports into one file — no chunks needed
        inlineDynamicImports: true,
      },
    },
    target: "chrome116",
    minify: false,
  },
  // No publicDir — the main build already copies public/
  publicDir: false,
});
