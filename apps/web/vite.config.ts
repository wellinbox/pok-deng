import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@pokdeng/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: { port: 5173, host: true },
});
