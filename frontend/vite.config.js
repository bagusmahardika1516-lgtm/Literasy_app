import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const contentDir = fileURLToPath(new URL('../content', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': pembaruan hanya ditawarkan di beranda, tidak menyela soal (agents.md G12)
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Literasy: Busur & Juring',
        short_name: 'Busur & Juring',
        description: 'Belajar panjang busur dan luas juring lingkaran',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#0072B2',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: { '@content': contentDir },
  },
  server: {
    host: true, // agar bisa dibuka dari HP di jaringan yang sama
    fs: { allow: ['..'] },
  },
  build: {
    rollupOptions: {
      output: {
        // Three.js dipisah agar unduhan awal kecil (prd.md NFR-03)
        // Bentuk fungsi: Vite 8 (Rolldown) tidak menerima bentuk objek; tetap valid di Rollup (Vite 5)
        manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
