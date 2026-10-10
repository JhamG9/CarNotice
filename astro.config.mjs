// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // El sitio vive bajo el prefijo de idioma; por ahora solo existe /es/.
  redirects: {
    '/': '/es/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
