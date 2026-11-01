// Lo que comparten meta-token.mjs y publicar-meta.mjs: lectura de .env y llamadas a la API de Meta.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = 'v26.0';
export const GRAPH = `https://graph.facebook.com/${VERSION}`;
export const RUPLOAD = `https://rupload.facebook.com/video-upload/${VERSION}`;
export const RUPLOAD_IG = `https://rupload.facebook.com/ig-api-upload/${VERSION}`;
export const RUTA_ENV = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env');

export function leerEnv() {
  if (!existsSync(RUTA_ENV)) return {};
  const valores = {};
  for (const linea of readFileSync(RUTA_ENV, 'utf8').split('\n')) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) valores[m[1]] = m[2];
  }
  return valores;
}

// Los errores de Meta pueden repetir la petición: solo se muestran su mensaje y su código.
export async function leerRespuesta(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || datos.error) {
    const e = datos.error ?? {};
    const detalle = e.error_user_msg ?? e.message ?? datos.debug_info?.message ?? 'sin detalle';
    throw new Error(`Meta respondió ${respuesta.status}: ${detalle} (código ${e.code ?? datos.debug_info?.type ?? '?'})`);
  }
  return datos;
}

// Los tokens van en el cuerpo de un POST o en la cabecera, nunca en una URL que quede en un registro.
export async function graph(metodo, ruta, parametros = {}) {
  const { access_token: token, ...resto } = parametros;
  const cabeceras = token ? { Authorization: `Bearer ${token}` } : {};
  if (metodo === 'GET') {
    const consulta = new URLSearchParams(resto).toString();
    const respuesta = await fetch(`${GRAPH}${ruta}${consulta ? `?${consulta}` : ''}`, { headers: cabeceras });
    return leerRespuesta(respuesta);
  }
  const respuesta = await fetch(`${GRAPH}${ruta}`, {
    method: 'POST',
    headers: cabeceras,
    body: new URLSearchParams(resto),
  });
  return leerRespuesta(respuesta);
}
