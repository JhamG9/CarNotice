#!/usr/bin/env node
// Abre un formulario local donde la persona pega la clave de cliente y la clave secreta de la app de TikTok
// (developers.tiktok.com → Mejor Electrico Reels → Sandbox «reels» → Credentials). Después lleva a la pantalla de
// permisos de TikTok y guarda en .env lo que usa publicar-tiktok.mjs. No imprime ningún valor.
//
//   node .claude/skills/jham-reels/scripts/tiktok-token.mjs   y abrir http://localhost:4392/
//
// La app está en modo sandbox: la cuenta tiene que estar antes en «Target users» del sandbox.
//
// Con --web usa el inicio de sesión web: TikTok devuelve el permiso a https://mejorelectrico.com/es/ y la persona pega
// esa dirección en el formulario. Sirve cuando el de escritorio falla (pasó el 2026-11-04 con «server_error»).
//
// La clave y el secreto se guardan en .env apenas se envía el formulario: si la autorización falla o hay que
// reconectar, http://localhost:4392/ lleva directo a TikTok sin volver a pegarlos.
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { leerEnv } from './meta-comun.mjs';
import { ALCANCES, API, guardarEnEnv, leerRespuestaTikTok, perfil } from './tiktok-comun.mjs';

const PUERTO = 4392;
// TikTok solo acepta localhost o 127.0.0.1 en apps de escritorio, y la dirección debe ser la registrada.
const ORIGEN = `http://localhost:${PUERTO}`;
const VUELTA = `${ORIGEN}/vuelta`;
// Registrada en «Web» del Login Kit del sandbox. La web no usa PKCE.
const WEB = process.argv.includes('--web');
const VUELTA_WEB = 'https://mejorelectrico.com/es/';
// Diagnóstico: --solo-perfil pide solo user.info.basic, para saber si el fallo viene del permiso de subir vídeos.
const PEDIDOS = process.argv.includes('--solo-perfil') ? ['user.info.basic'] : ALCANCES;
const APP = 'https://developers.tiktok.com/app/7704089936648374280/sandbox/7704067410088871943';

// Lo que se pegó en el formulario solo vive en memoria hasta que TikTok devuelve el código.
let pendiente = null;

// PKCE de TikTok para escritorio: el desafío es el SHA-256 del verificador en hexadecimal.
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
const verificador = () => Array.from(randomBytes(64), (b) => ALFABETO[b % ALFABETO.length]).join('');

function irATikTok(respuesta, clave, secreto) {
  pendiente = { clave, secreto, estado: randomBytes(16).toString('hex'), verificador: verificador() };
  const permiso = new URL('https://www.tiktok.com/v2/auth/authorize/');
  const parametros = {
    client_key: clave,
    response_type: 'code',
    scope: PEDIDOS.join(','),
    redirect_uri: WEB ? VUELTA_WEB : VUELTA,
    state: pendiente.estado,
  };
  if (!WEB) {
    parametros.code_challenge = createHash('sha256').update(pendiente.verificador).digest('hex');
    parametros.code_challenge_method = 'S256';
  }
  permiso.search = new URLSearchParams(parametros);
  respuesta.writeHead(303, { Location: permiso.toString(), 'Cache-Control': 'no-store' });
  respuesta.end();
}

async function conectar(codigo) {
  const tokens = await leerRespuestaTikTok(
    await fetch(`${API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: pendiente.clave,
        client_secret: pendiente.secreto,
        code: codigo,
        grant_type: 'authorization_code',
        redirect_uri: WEB ? VUELTA_WEB : VUELTA,
        ...(WEB ? {} : { code_verifier: pendiente.verificador }),
      }),
    }),
  );
  if (!tokens.refresh_token) throw new Error('TikTok no devolvió un token de renovación. Vuelve a empezar.');
  const faltan = PEDIDOS.filter((a) => !String(tokens.scope ?? '').split(',').includes(a));
  if (faltan.length) throw new Error(`Faltan permisos: ${faltan.join(', ')}. Vuelve a empezar y acéptalos todos.`);
  const usuario = await perfil(tokens.access_token);
  if (PEDIDOS !== ALCANCES) return `${usuario.display_name} (prueba solo de perfil: no se guardó nada)`;
  guardarEnEnv({
    TIKTOK_REFRESH_TOKEN: tokens.refresh_token,
    TIKTOK_OPEN_ID: tokens.open_id,
  });
  return usuario.display_name;
}

const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pagina = (cuerpo) => `<!doctype html><html lang="es"><meta charset="utf-8"><title>Conectar TikTok</title>
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
  pagina(`<h1>Conectar la cuenta de TikTok</h1>
${error ? `<p class="error" role="alert">${escapar(error)}</p>` : ''}
<form method="post" autocomplete="off">
<label for="clave">1. Client key</label>
<small>En el <a href="${APP}" target="_blank" rel="noreferrer">sandbox «reels» de la app</a>, arriba en «Credentials». Despliega la flecha para verla.</small>
<input id="clave" name="clave" required>
<label for="secreto">2. Client secret</label>
<small>Al lado, en el mismo recuadro.</small>
<input id="secreto" name="secreto" type="password" required>
<button>Seguir a TikTok</button>
</form>
<p><small>Después TikTok pide entrar: usa la cuenta @mejorelectrico y acepta los permisos.</small></p>`);

const pegar = (error = '') =>
  pagina(`<h1>Último paso</h1>
${error ? `<p class="error" role="alert">${escapar(error)}</p>` : ''}
<p>Después de aceptar los permisos, TikTok te llevó a mejorelectrico.com. Copia la dirección completa de esa pestaña
(empieza por <code>https://mejorelectrico.com/es/?code=</code>) y pégala aquí.</p>
<form method="post" action="/pegar" autocomplete="off">
<label for="direccion">Dirección</label>
<input id="direccion" name="direccion" required>
<button>Conectar</button>
</form>`);

const servidor = createServer((peticion, respuesta) => {
  const enviar = (html) => {
    respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    respuesta.end(html);
  };
  const url = new URL(peticion.url, ORIGEN);

  // En modo web la dirección de vuelta la pega la persona en /pegar; en escritorio llega sola a /vuelta.
  const devuelta = (consulta) => {
    if (!pendiente || consulta.get('state') !== pendiente.estado) return enviar(formulario('La respuesta de TikTok no coincide. Vuelve a empezar.'));
    const codigo = consulta.get('code');
    if (!codigo) return enviar(formulario(`TikTok no dio permiso: ${consulta.get('error_description') ?? consulta.get('error') ?? 'sin detalle'}.`));
    conectar(codigo)
      .then((nombre) => {
        enviar(pagina(`<h1>Listo</h1><p>Quedó conectada la cuenta ${escapar(nombre)}. Ya puedes cerrar esta pestaña.</p>`));
        console.log('Cuenta de TikTok conectada: datos guardados en .env.');
        servidor.close(() => process.exit(0));
        servidor.closeAllConnections();
      })
      .catch((error) => {
        console.error('No se pudo conectar:', error.message);
        enviar(formulario(error.message));
      });
  };

  if (peticion.method === 'GET' && url.pathname === '/vuelta') return devuelta(url.searchParams);
  if (peticion.method === 'GET' && url.pathname === '/pegar') return enviar(pegar());
  if (peticion.method !== 'POST') {
    const env = leerEnv();
    return env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET
      ? irATikTok(respuesta, env.TIKTOK_CLIENT_KEY, env.TIKTOK_CLIENT_SECRET)
      : enviar(formulario());
  }
  if (peticion.headers.origin !== ORIGEN) {
    respuesta.writeHead(403);
    return respuesta.end();
  }
  let cuerpo = '';
  peticion.on('data', (parte) => (cuerpo += parte));
  peticion.on('end', () => {
    const datos = new URLSearchParams(cuerpo);
    if (url.pathname === '/pegar') {
      try {
        return devuelta(new URL((datos.get('direccion') ?? '').trim()).searchParams);
      } catch {
        return enviar(pegar('Eso no es una dirección. Copia toda la barra de direcciones.'));
      }
    }
    const clave = (datos.get('clave') ?? '').trim();
    const secreto = (datos.get('secreto') ?? '').trim();
    if (!clave || !secreto) return enviar(formulario('Faltan la clave o el secreto.'));
    guardarEnEnv({ TIKTOK_CLIENT_KEY: clave, TIKTOK_CLIENT_SECRET: secreto });
    irATikTok(respuesta, clave, secreto);
  });
});

servidor.listen(PUERTO, 'localhost', () => console.log(`Formulario en ${ORIGEN}/`));
// Si nadie lo usa, se apaga solo.
setTimeout(() => {
  console.log('Se apagó el formulario por falta de uso.');
  process.exit(2);
}, 30 * 60 * 1000).unref();
