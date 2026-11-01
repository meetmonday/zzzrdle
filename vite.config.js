import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/zzzrdle/',
  plugins: [svelte()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
