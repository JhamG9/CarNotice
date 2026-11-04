// Lo que comparten tiktok-token.mjs y publicar-tiktok.mjs: permisos, errores de TikTok y guardar en .env.
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { RUTA_ENV } from './meta-comun.mjs';

export const API = 'https://open.tiktokapis.com/v2';

// Leer el perfil (para comprobar que es la cuenta correcta) y subir vídeos como borrador al buzón.
export const ALCANCES = ['user.info.basic', 'video.upload'];

// Los errores de TikTok pueden repetir la petición: solo se muestran su mensaje y su código.
export async function leerRespuestaTikTok(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));
  const error = datos.error;
  const fallo = !respuesta.ok || (typeof error === 'object' ? error.code && error.code !== 'ok' : Boolean(error));
  if (fallo) {
    const mensaje = typeof error === 'object' ? error.message || error.code : datos.error_description ?? error;
    throw new Error(`TikTok respondió ${respuesta.status}: ${mensaje ?? 'sin detalle'}`);
  }
  return datos;
}

export function guardarEnEnv(valores) {
  let texto = existsSync(RUTA_ENV) ? readFileSync(RUTA_ENV, 'utf8') : '';
  for (const [clave, valor] of Object.entries(valores)) {
    const linea = `${clave}=${valor}`;
    const patron = new RegExp(`^${clave}=.*$`, 'm');
    texto = patron.test(texto) ? texto.replace(patron, () => linea) : `${texto.replace(/\n*$/, '\n')}${linea}\n`;
  }
  writeFileSync(RUTA_ENV, texto);
  chmodSync(RUTA_ENV, 0o600);
}

// Pide un token de acceso (dura 24 horas). TikTok puede devolver un token de renovación nuevo: se guarda siempre.
export async function tokenDeAcceso(env) {
  const datos = await leerRespuestaTikTok(
    await fetch(`${API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: env.TIKTOK_REFRESH_TOKEN,
      }),
    }),
  );
  if (datos.refresh_token && datos.refresh_token !== env.TIKTOK_REFRESH_TOKEN) {
    guardarEnEnv({ TIKTOK_REFRESH_TOKEN: datos.refresh_token });
  }
  return datos.access_token;
}

export async function perfil(token) {
  const { data } = await leerRespuestaTikTok(
    await fetch(`${API}/user/info/?fields=open_id,display_name`, { headers: { Authorization: `Bearer ${token}` } }),
  );
  return data.user;
}
