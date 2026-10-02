import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(`${(process.env.GITHUB_SHA ?? 'dev').slice(0, 7)} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`)
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-4.svg', 'icon-4-touch-180.png'],
      manifest: {
        name: 'YTM Sorter',
        short_name: 'YTM Sorter',
        description: 'Просмотр и сортировка плейлистов YouTube Music',
        lang: 'ru',
        theme_color: '#030303',
        background_color: '#030303',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-4-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-4-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-4-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/]
      }
    })
  ],
  test: {
    include: ['tests/**/*.test.ts']
  }
})
