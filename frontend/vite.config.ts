import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import viteCompression from "vite-plugin-compression"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({ algorithm: "gzip", ext: ".gz", threshold: 1024 }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br", threshold: 1024 }),
  ],
  resolve: {
    alias: [
      { find: '@/modals', replacement: path.resolve(__dirname, './src/components/modals') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-motion': ['framer-motion'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['axios', 'date-fns', 'zod', 'clsx', 'lucide-react', 'sonner', 'tailwind-merge'],
          'vendor-animations': ['lottie-web'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
    cssMinify: 'esbuild',
    sourcemap: false,
  },
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      '/media': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
