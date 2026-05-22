import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: '@/modals', replacement: path.resolve(__dirname, './src/components/modals') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
})
