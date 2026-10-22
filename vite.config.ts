import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// Pages serves the project site from /<repo>/, so assets need that prefix in production.
const base = process.env.GITHUB_ACTIONS ? '/werewoof/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Werewoof',
        short_name: 'Werewoof',
        description: 'Host a werewolf game with everyone on their own phone.',
        theme_color: '#14121f',
        background_color: '#14121f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [fileURLToPath(new URL('./src/ui/styles', import.meta.url))] },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
