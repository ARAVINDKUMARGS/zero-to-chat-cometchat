import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the browser talks to Vite (port 5173) and Vite forwards
// anything starting with /api to our Express server (port 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
});
