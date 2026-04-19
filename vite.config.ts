import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pulse - Карта твоего ритма',
        short_name: 'Pulse',
        description: 'Энергия города в твоих руках.',
        theme_color: '#0B0B11',
        background_color: '#0B0B11',
        display: 'standalone',
        icons: [
          {
            src: 'https://img.icons8.com/m_rounded/512/FFFFFF/pulse.png', // Temporary generic icon until user provides one
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
