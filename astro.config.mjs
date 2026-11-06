// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Dominio del sitio. Se usa en URL canónicas, Open Graph y datos estructurados.
const SITIO = 'https://mejorelectrico.com';

// El sitemap se arma después de escribir las páginas en dist/: las que llevan noindex se quedan fuera.
function indexable(url) {
  const html = `dist${new URL(url).pathname}index.html`;
  return !existsSync(html) || !/<meta name="robots" content="noindex/.test(readFileSync(html, 'utf8'));
}

// Cloudflare Pages busca el 404.html más cercano a la ruta pedida: con este, /en/… sin página sale en inglés.
const error404PorIdioma = {
  name: 'error-404-por-idioma',
  hooks: {
    'astro:build:done': ({ dir }) => {
      copyFileSync(fileURLToPath(new URL('en/404/index.html', dir)), fileURLToPath(new URL('en/404.html', dir)));
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: SITIO,
  // Todas las rutas terminan en "/", para que la URL canónica sea una sola.
  trailingSlash: 'always',
  // El mapa del sitio se genera solo en cada compilación (sitemap-index.xml).
  integrations: [react(), sitemap({ filter: indexable }), error404PorIdioma],
  // El sitio vive bajo el prefijo de idioma (/es/, /en/); la raíz lleva al español.
  redirects: {
    '/': '/es/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
