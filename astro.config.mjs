// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio del sitio. Se usa en URL canónicas, Open Graph y datos estructurados.
const SITIO = 'https://mejorelectrico.com';

// https://astro.build/config
export default defineConfig({
  site: SITIO,
  // Todas las rutas terminan en "/", para que la URL canónica sea una sola.
  trailingSlash: 'always',
  // El mapa del sitio se genera solo en cada compilación (sitemap-index.xml).
  integrations: [react(), sitemap()],
  // El sitio vive bajo el prefijo de idioma; por ahora solo existe /es/.
  redirects: {
    '/': '/es/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
