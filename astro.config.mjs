// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync } from 'node:fs';

// Dominio del sitio. Se usa en URL canónicas, Open Graph y datos estructurados.
const SITIO = 'https://mejorelectrico.com';

// El sitemap se arma después de escribir las páginas en dist/: las que llevan noindex se quedan fuera.
function indexable(url) {
  const html = `dist${new URL(url).pathname}index.html`;
  return !existsSync(html) || !/<meta name="robots" content="noindex/.test(readFileSync(html, 'utf8'));
}

// https://astro.build/config
export default defineConfig({
  site: SITIO,
  // Todas las rutas terminan en "/", para que la URL canónica sea una sola.
  trailingSlash: 'always',
  // El mapa del sitio se genera solo en cada compilación (sitemap-index.xml).
  integrations: [react(), sitemap({ filter: indexable })],
  // El sitio vive bajo el prefijo de idioma; por ahora solo existe /es/.
  redirects: {
    '/': '/es/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
