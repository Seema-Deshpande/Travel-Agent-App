import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import http from "node:http";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // Use a non-keep-alive agent so each request opens a fresh connection.
        // Prevents "socket hang up" from reusing an idle socket the backend closed.
        agent: new http.Agent({ keepAlive: false }),
      },
    },
  },
});
