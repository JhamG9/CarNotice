#!/usr/bin/env node
// Sube un reel como borrador al buzón de la cuenta de TikTok de Mejor Eléctrico, con la Content Posting API.
//
//   node publicar-tiktok.mjs verificar            comprueba el acceso a la cuenta, sin subir nada
//   node publicar-tiktok.mjs borrador reel.mp4    lo sube al buzón: no se ve en público
//
// La app está en modo sandbox, que no permite publicar directo: el vídeo llega como borrador y la persona lo
// termina en la app de TikTok (texto, canción y «Publicar»). Por eso subirlo no necesita --confirmo.
import { readFileSync, statSync } from 'node:fs';
import { leerEnv } from './meta-comun.mjs';
import { API, leerRespuestaTikTok, perfil, tokenDeAcceso } from './tiktok-comun.mjs';

// TikTok acepta un solo trozo hasta 64 MB; los reels pesan menos de 28 MB.
const MAX_UN_TROZO = 64 * 1024 * 1024;
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

const [accion, archivo] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const env = leerEnv();

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET || !env.TIKTOK_REFRESH_TOKEN) {
  salir('Faltan los datos de TikTok en .env. Ejecuta primero tiktok-token.mjs.');
}

async function verificar(token) {
  const usuario = await perfil(token);
  if (env.TIKTOK_OPEN_ID && usuario.open_id !== env.TIKTOK_OPEN_ID) salir(`El token es de otra cuenta: ${usuario.display_name}.`);
  console.log(`TikTok: acceso válido a "${usuario.display_name}".`);
}

async function subirBorrador(token) {
  const bytes = statSync(archivo).size;
  if (bytes > MAX_UN_TROZO) salir(`El vídeo pesa ${Math.round(bytes / 1048576)} MB; este script sube hasta 64 MB.`);
  const { data } = await leerRespuestaTikTok(
    await fetch(`${API}/post/publish/inbox/video/init/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: bytes, chunk_size: bytes, total_chunk_count: 1 } }),
    }),
  );
  const subida = await fetch(data.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes 0-${bytes - 1}/${bytes}`, 'Content-Length': String(bytes) },
    body: readFileSync(archivo),
  });
  if (!subida.ok) salir(`TikTok no aceptó el archivo: ${subida.status}.`);
  console.log('TikTok: vídeo enviado, procesando…');

  for (let intento = 0; intento < 40; intento++) {
    await esperar(5000);
    const { data: estado } = await leerRespuestaTikTok(
      await fetch(`${API}/post/publish/status/fetch/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ publish_id: data.publish_id }),
      }),
    );
    if (estado.status === 'FAILED') salir(`TikTok rechazó el vídeo: ${estado.fail_reason ?? 'sin detalle'}.`);
    if (estado.status === 'SEND_TO_USER_INBOX' || estado.status === 'PUBLISH_COMPLETE') {
      console.log('TikTok: borrador en el buzón. Ábrelo desde la notificación de la app para publicarlo.');
      return;
    }
  }
  salir('TikTok sigue procesando el vídeo. Revisa el buzón de la app en unos minutos.');
}

try {
  const token = await tokenDeAcceso(env);
  if (accion === 'verificar') {
    await verificar(token);
  } else if (accion === 'borrador' && archivo) {
    await verificar(token);
    await subirBorrador(token);
  } else {
    salir('Uso: publicar-tiktok.mjs verificar | borrador <mp4>');
  }
} catch (error) {
  salir(error.message);
}
