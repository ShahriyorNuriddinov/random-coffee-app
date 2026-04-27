import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Random Coffee HK',
        short_name: 'Random Coffee',
        description: 'AI-powered professional networking over coffee in Hong Kong',
        theme_color: '#007aff',
        background_color: '#f4f7f9',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Cache app shell
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Don't cache API calls
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache Supabase images
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Cache picsum photos
            urlPattern: /^https:\/\/picsum\.photos\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'profile-photos',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/swiper')) return 'swiper'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) return 'charts'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/react-hot-toast')) return 'ui'
          if (id.includes('/src/admin/')) return 'admin'
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    sourcemap: false,
  },
})
