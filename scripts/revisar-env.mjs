// Revisa el .env antes de compilar y publicar (npm run deploy).
// Se ejecuta con node --env-file-if-exists=.env, así que lee las mismas variables que Astro y wrangler.

const faltan = [];

if (!process.env.PUBLIC_SUPABASE_URL) faltan.push('PUBLIC_SUPABASE_URL');
if (!process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) faltan.push('PUBLIC_SUPABASE_PUBLISHABLE_KEY');

if (faltan.length) {
  console.error(`Faltan en .env: ${faltan.join(', ')}.`);
  console.error('Sin ellas el sitio se publica con el comparador vacío y sin páginas de carros. Copia .env.example como .env y complétalo.');
  process.exit(1);
}

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.warn('No hay CLOUDFLARE_API_TOKEN en .env: wrangler usará la sesión de "npx wrangler login", si existe.');
} else if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error('Falta CLOUDFLARE_ACCOUNT_ID en .env (va junto con CLOUDFLARE_API_TOKEN).');
  process.exit(1);
}
