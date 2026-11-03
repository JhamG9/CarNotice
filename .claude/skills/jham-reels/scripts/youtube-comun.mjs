// Lo que comparten youtube-token.mjs y publicar-youtube.mjs: el canal, los permisos y los errores de Google.

export const CANAL = '@mejorelectrico';

// Subir vídeos y su portada, leer el canal y leer las estadísticas de cada Short.
export const ALCANCES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

// Los errores de Google pueden repetir la petición: solo se muestran su mensaje y su código.
export async function leerRespuestaGoogle(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || datos.error) {
    const e = typeof datos.error === 'object' ? datos.error : { message: datos.error_description ?? datos.error };
    throw new Error(`Google respondió ${respuesta.status}: ${e.message ?? 'sin detalle'} (${e.errors?.[0]?.reason ?? e.status ?? '?'})`);
  }
  return datos;
}
