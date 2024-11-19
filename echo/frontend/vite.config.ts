import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { lingui } from "@lingui/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["macros"],
      },
    }),
    lingui(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@mantine/core", "@mantine/hooks"],
          icons: ["@tabler/icons-react", "lucide-react"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000/",
        changeOrigin: true,
        rewrite: (path) => {
          console.log("Proxying request to", path);
          return path;
        },
      },
      "/directus": {
        target: "http://localhost:8055",
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/directus/, "/");
          console.log("Proxying request to", newPath);
          return newPath;
        },
      },
    },
  },
});
