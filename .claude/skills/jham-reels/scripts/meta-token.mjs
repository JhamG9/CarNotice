#!/usr/bin/env node
// Abre un formulario local donde la persona pega el token del Explorador de Meta y la clave secreta de la app.
// Saca el token de página que usa publicar-meta.mjs y lo guarda en .env. No imprime ningún valor.
//
//   node .claude/skills/jham-reels/scripts/meta-token.mjs   y abrir http://127.0.0.1:4390/
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { RUTA_ENV, graph } from './meta-comun.mjs';

const APP_ID = '1421720793504471';
const PAGINA = 'mejorelectrico';
const PUERTO = 4390;
const ORIGEN = `http://127.0.0.1:${PUERTO}`;
const EXPLORADOR = `https://developers.facebook.com/tools/explorer/${APP_ID}/`;
const AJUSTES = `https://developers.facebook.com/apps/${APP_ID}/settings/basic/`;

function guardarEnEnv(valores) {
  let texto = existsSync(RUTA_ENV) ? readFileSync(RUTA_ENV, 'utf8') : '';
  for (const [clave, valor] of Object.entries(valores)) {
    const linea = `${clave}=${valor}`;
    const patron = new RegExp(`^${clave}=.*$`, 'm');
    texto = patron.test(texto) ? texto.replace(patron, () => linea) : `${texto.replace(/\n*$/, '\n')}${linea}\n`;
  }
  writeFileSync(RUTA_ENV, texto);
  chmodSync(RUTA_ENV, 0o600);
}

async function conectar(tokenCorto, secreto) {
  const largo = await graph('POST', '/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: secreto,
    fb_exchange_token: tokenCorto,
  });
  // El token de página sacado de un token largo de usuario no caduca por fecha.
  const paginas = await graph('GET', '/me/accounts', {
    fields: 'id,name,username,access_token,instagram_business_account',
    limit: '100',
    access_token: largo.access_token,
  });
  const pagina = paginas.data.find((p) => p.username === PAGINA);
  if (!pagina) {
    const recibidas = paginas.data.map((p) => p.name).join(', ') || 'ninguna';
    throw new Error(`No llegó la página Mejor Eléctrico (llegaron: ${recibidas}). Genera el token otra vez y márcala.`);
  }
  const igId = pagina.instagram_business_account?.id;
  if (!igId) throw new Error('No llegó el Instagram. Genera el token otra vez y marca también @mejorelectrico.');
  guardarEnEnv({
    META_APP_ID: APP_ID,
    META_PAGE_ID: pagina.id,
    META_IG_ID: igId,
    META_PAGE_TOKEN: pagina.access_token,
  });
  return pagina.name;
}

const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pagina = (cuerpo) => `<!doctype html><html lang="es"><meta charset="utf-8"><title>Conectar Meta</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#F7F6F2;color:#14171C;font:18px/1.5 system-ui,sans-serif}
main{max-width:560px;margin:48px auto;padding:0 16px}
h1{color:#14284B;font-size:28px;line-height:1.2}
label{display:block;margin:24px 0 4px;font-weight:700}
input{width:100%;box-sizing:border-box;padding:12px;font-size:16px;border:1px solid #5A616B;border-radius:6px;background:#fff}
button{margin-top:28px;padding:12px 20px;font-size:18px;font-weight:700;color:#fff;background:#1B6B43;border:0;border-radius:6px;cursor:pointer}
a{color:#1B6B43}.error{padding:12px;border:1px solid #5A616B;border-radius:6px;background:#fff}small{color:#5A616B}
</style><main>${cuerpo}</main></html>`;

const formulario = (error = '') =>
  pagina(`<h1>Conectar la página con Meta</h1>
${error ? `<p class="error" role="alert">${escapar(error)}</p>` : ''}
<form method="post" autocomplete="off">
<label for="token">1. Token del Explorador</label>
<small>Cópialo en el <a href="${EXPLORADOR}" target="_blank" rel="noreferrer">Explorador</a>, con el botón al lado de «Access Token».</small>
<input id="token" name="token" type="password" required>
<label for="secreto">2. Clave secreta de la app</label>
<small>Cópiala en los <a href="${AJUSTES}" target="_blank" rel="noreferrer">ajustes de la app</a>: «App secret» y «Show».</small>
<input id="secreto" name="secreto" type="password" required>
<button>Conectar</button>
</form>`);

const servidor = createServer((peticion, respuesta) => {
  const enviar = (html) => {
    respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    respuesta.end(html);
  };
  if (peticion.method !== 'POST') return enviar(formulario());
  if (peticion.headers.origin !== ORIGEN) {
    respuesta.writeHead(403);
    return respuesta.end();
  }
  let cuerpo = '';
  peticion.on('data', (parte) => (cuerpo += parte));
  peticion.on('end', async () => {
    const datos = new URLSearchParams(cuerpo);
    try {
      const nombre = await conectar((datos.get('token') ?? '').trim(), (datos.get('secreto') ?? '').trim());
      enviar(pagina(`<h1>Listo</h1><p>Quedó conectada la página ${escapar(nombre)}. Ya puedes cerrar esta pestaña.</p>`));
      console.log('Token de página guardado en .env. La clave secreta no se guardó.');
      servidor.close(() => process.exit(0));
      servidor.closeAllConnections();
    } catch (error) {
      console.error('No se pudo conectar:', error.message);
      enviar(formulario(error.message));
    }
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => console.log(`Formulario en ${ORIGEN}/`));
// Si nadie lo usa, se apaga solo.
setTimeout(() => {
  console.log('Se apagó el formulario por falta de uso.');
  process.exit(2);
}, 30 * 60 * 1000).unref();
