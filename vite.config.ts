import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      // Use CDN so `npm install leaflet` is optional; types come from `@types/leaflet`.
      leaflet: 'https://esm.sh/leaflet@1.9.4',
    },
  },
})