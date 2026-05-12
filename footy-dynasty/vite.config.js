import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const testing = process.env.npm_lifecycle_event === 'test'

export default defineConfig({
  plugins: testing
    ? []
    : [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: { enabled: false },
          manifest: {
            name: 'Footy Dynasty',
            short_name: 'Footy Dynasty',
            description: 'Australian rules football dynasty manager — climb the pyramid.',
            theme_color: '#0b1220',
            background_color: '#0b1220',
            display: 'standalone',
            orientation: 'any',
            start_url: '/',
            scope: '/',
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
          },
        }),
      ],
  test: {
    environment: 'node',
    globals: true,
    maxWorkers: process.env.CI ? 4 : '75%',
  },
})
