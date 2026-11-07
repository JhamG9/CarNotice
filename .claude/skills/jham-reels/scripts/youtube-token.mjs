#!/usr/bin/env node
// Abre un formulario local donde la persona pega el ID de cliente y la clave secreta del proyecto de Google Cloud.
// Después lleva a la pantalla de permisos de Google y guarda en .env lo que usa publicar-youtube.mjs. No imprime
// ningún valor.
//
//   node .claude/skills/jham-reels/scripts/youtube-token.mjs   y abrir http://127.0.0.1:4391/
//
// Con --json=client_secret_….json (el archivo que ofrece Google al crear el cliente) no hay que pegar nada:
// http://127.0.0.1:4391/ lleva directo a la pantalla de permisos. Borra ese archivo después.
// Con --reconectar usa el ID y la clave que ya están en .env: sirve para aceptar permisos nuevos (por ejemplo, el de
// subir subtítulos) sin volver a pegar nada.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { RUTA_ENV, leerEnv } from './meta-comun.mjs';
import { CANAL, ALCANCES, leerRespuestaGoogle } from './youtube-comun.mjs';

const PROYECTO = 'mejor-electrico-reels';
const PUERTO = 4391;
const ORIGEN = `http://127.0.0.1:${PUERTO}`;
const VUELTA = `${ORIGEN}/vuelta`;
const CLIENTES = `https://console.cloud.google.com/auth/clients?project=${PROYECTO}`;

// Lo que se pegó en el formulario solo vive en memoria hasta que Google devuelve el código.
let pendiente = null;

const rutaJson = process.argv.find((a) => a.startsWith('--json='))?.slice('--json='.length);
const reconectar = process.argv.includes('--reconectar');
const envActual = reconectar ? leerEnv() : {};
const cliente = rutaJson
  ? JSON.parse(readFileSync(rutaJson, 'utf8')).installed
  : reconectar && envActual.YOUTUBE_CLIENT_ID && envActual.YOUTUBE_CLIENT_SECRET
    ? { client_id: envActual.YOUTUBE_CLIENT_ID, client_secret: envActual.YOUTUBE_CLIENT_SECRET }
    : null;
if (reconectar && !cliente) {
  console.error('No hay ID ni clave de cliente en .env: conecta sin --reconectar.');
  process.exit(1);
}
if (rutaJson && !cliente?.client_id) {
  console.error('Ese JSON no es de un cliente de escritorio.');
  process.exit(1);
}

function irAGoogle(respuesta, id, secreto) {
  pendiente = { id, secreto, estado: randomBytes(16).toString('hex') };
  const permiso = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  permiso.search = new URLSearchParams({
    client_id: id,
    redirect_uri: VUELTA,
    response_type: 'code',
    scope: ALCANCES.join(' '),
    access_type: 'offline',
    prompt: 'consent select_account',
    state: pendiente.estado,
  });
  respuesta.writeHead(303, { Location: permiso.toString(), 'Cache-Control': 'no-store' });
  respuesta.end();
}

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

async function conectar(codigo) {
  const tokens = await leerRespuestaGoogle(
    await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code: codigo,
        client_id: pendiente.id,
        client_secret: pendiente.secreto,
        redirect_uri: VUELTA,
        grant_type: 'authorization_code',
      }),
    }),
  );
  if (!tokens.refresh_token) throw new Error('Google no devolvió un token de renovación. Vuelve a empezar.');
  const canales = await leerRespuestaGoogle(
    await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }),
  );
  const canal = canales.items?.[0];
  if (canal?.snippet?.customUrl?.toLowerCase() !== CANAL) {
    const recibido = canal ? `${canal.snippet.title} (${canal.snippet.customUrl})` : 'ninguno';
    throw new Error(`Se autorizó otro canal: ${recibido}. Entra con mejorelectrico9@gmail.com.`);
  }
  // Es un cliente de escritorio: Google no trata su clave como secreta, pero igual va solo en .env.
  guardarEnEnv({
    YOUTUBE_CLIENT_ID: pendiente.id,
    YOUTUBE_CLIENT_SECRET: pendiente.secreto,
    YOUTUBE_REFRESH_TOKEN: tokens.refresh_token,
    YOUTUBE_CHANNEL_ID: canal.id,
  });
  return canal.snippet.title;
}

const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pagina = (cuerpo) => `<!doctype html><html lang="es"><meta charset="utf-8"><title>Conectar YouTube</title>
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
  pagina(`<h1>Conectar el canal de YouTube</h1>
${error ? `<p class="error" role="alert">${escapar(error)}</p>` : ''}
<form method="post" autocomplete="off">
<label for="id">1. ID de cliente</label>
<small>Está en los <a href="${CLIENTES}" target="_blank" rel="noreferrer">clientes de OAuth</a> del proyecto, en «Cliente de escritorio 1». Termina en <code>.apps.googleusercontent.com</code>.</small>
<input id="id" name="id" required>
<label for="secreto">2. Secreto del cliente</label>
<small>En el mismo cliente, en «Secretos del cliente». Empieza por <code>GOCSPX-</code>.</small>
<input id="secreto" name="secreto" type="password" required>
<button>Seguir a Google</button>
</form>
<p><small>Después Google pide elegir la cuenta: usa mejorelectrico9@gmail.com y acepta los permisos. Como la app no está verificada, avisa que no es segura: toca «Configuración avanzada» y «Ir a Mejor Electrico Reels».</small></p>`);

const servidor = createServer((peticion, respuesta) => {
  const enviar = (html) => {
    respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    respuesta.end(html);
  };
  const url = new URL(peticion.url, ORIGEN);

  if (peticion.method === 'GET' && url.pathname === '/vuelta') {
    if (!pendiente || url.searchParams.get('state') !== pendiente.estado) return enviar(formulario('La respuesta de Google no coincide. Vuelve a empezar.'));
    const codigo = url.searchParams.get('code');
    if (!codigo) return enviar(formulario(`Google no dio permiso: ${url.searchParams.get('error') ?? 'sin detalle'}.`));
    conectar(codigo)
      .then((nombre) => {
        enviar(pagina(`<h1>Listo</h1><p>Quedó conectado el canal ${escapar(nombre)}. Ya puedes cerrar esta pestaña.</p>`));
        console.log('Canal conectado: datos guardados en .env.');
        servidor.close(() => process.exit(0));
        servidor.closeAllConnections();
      })
      .catch((error) => {
        console.error('No se pudo conectar:', error.message);
        enviar(formulario(error.message));
      });
    return;
  }
  if (peticion.method !== 'POST') {
    return cliente ? irAGoogle(respuesta, cliente.client_id, cliente.client_secret) : enviar(formulario());
  }
  if (peticion.headers.origin !== ORIGEN) {
    respuesta.writeHead(403);
    return respuesta.end();
  }
  let cuerpo = '';
  peticion.on('data', (parte) => (cuerpo += parte));
  peticion.on('end', () => {
    const datos = new URLSearchParams(cuerpo);
    const id = (datos.get('id') ?? '').trim();
    const secreto = (datos.get('secreto') ?? '').trim();
    if (!id.endsWith('.apps.googleusercontent.com')) return enviar(formulario('Ese no parece un ID de cliente de Google.'));
    irAGoogle(respuesta, id, secreto);
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => console.log(`Formulario en ${ORIGEN}/`));
// Si nadie lo usa, se apaga solo.
setTimeout(() => {
  console.log('Se apagó el formulario por falta de uso.');
  process.exit(2);
}, 30 * 60 * 1000).unref();
