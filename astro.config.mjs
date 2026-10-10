// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// TODO: cambiar por el dominio real del sitio. Se usa en URL canónicas, Open Graph y datos estructurados.
const SITIO = 'https://www.example.com';

// https://astro.build/config
export default defineConfig({
  site: SITIO,
  // Todas las rutas terminan en "/", para que la URL canónica sea una sola.
  trailingSlash: 'always',
  integrations: [react()],
  // El sitio vive bajo el prefijo de idioma; por ahora solo existe /es/.
  redirects: {
    '/': '/es/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
