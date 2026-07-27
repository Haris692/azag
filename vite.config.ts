import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sert le repo sur haris692.github.io/azag/
// donc base doit matcher le nom du repo, sinon page blanche (assets 404).
const BASE = '/azag/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // scope/base alignes sur BASE pour que le SW soit servi au bon endroit
      manifest: {
        name: 'AZAG',
        short_name: 'AZAG',
        description: 'Navigation routiere communautaire, temps reel, sans compte.',
        theme_color: '#0A0A0A',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        // Phase 0 : icone SVG unique. Jeu d'icones PNG (192/512/maskable)
        // genere en Phase 6 (polish PWA), cf. brief section 8.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // cache des assets du build ; le cache des tuiles carte sera ajoute en Phase 6
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: null, // HashRouter : pas besoin de fallback SPA
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
  },
})
