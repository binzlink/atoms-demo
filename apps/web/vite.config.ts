import UnoCSS from "unocss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [UnoCSS(), react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    watch: {
      usePolling: true,
    },
  },
});
