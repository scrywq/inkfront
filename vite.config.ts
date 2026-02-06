import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "src");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    {
      name: "resolve-at-alias",
      resolveId(source) {
        if (source.startsWith("@/")) {
          return path.resolve(srcDir, source.slice(2));
        }
        return null;
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
}));
