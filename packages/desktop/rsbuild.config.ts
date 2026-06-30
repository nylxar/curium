import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./src/main.tsx",
    },
  },
  resolve: {
    alias: {
      "@curium/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  html: {
    template: "./index.html",
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  output: {
    distPath: {
      root: "dist",
    },
    minify: process.env.TAURI_DEBUG ? false : true,
    sourceMap: !!process.env.TAURI_DEBUG,
  },
});
