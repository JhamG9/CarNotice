#!/usr/bin/env node
// Sube un reel como Short al canal de YouTube de Mejor Eléctrico con la API de YouTube.
//
//   node publicar-youtube.mjs verificar                                comprueba el acceso al canal, sin subir nada
//   node publicar-youtube.mjs borrador reel.mp4 "Título" "Descripción"  lo sube privado: no se ve en público
//   node publicar-youtube.mjs publicar reel.mp4 "Título" "Descripción" --confirmo
//   node publicar-youtube.mjs portada <id del vídeo> --portada=portada.png   vuelve a intentar solo la portada
//
// Opciones: --ia declara contenido sintético (voz generada con IA) y --portada=archivo.png sube la miniatura.
//
// Publicar es decisión de la persona: sin --confirmo no se publica nada. Mientras Google no apruebe la auditoría
// del proyecto, todo lo que se sube por API queda privado aunque se pida público.
import { readFileSync, statSync } from 'node:fs';
import { leerEnv } from './meta-comun.mjs';
import { CANAL, leerRespuestaGoogle } from './youtube-comun.mjs';

const API = 'https://www.googleapis.com/youtube/v3';
const SUBIDAS = 'https://www.googleapis.com/upload/youtube/v3';
const AUTOS_Y_VEHICULOS = '2';

const argumentos = process.argv.slice(2);
const opciones = argumentos.filter((a) => a.startsWith('--'));
const [accion, archivo, titulo, descripcion] = argumentos.filter((a) => !a.startsWith('--'));
const confirmo = opciones.includes('--confirmo');
const conIA = opciones.includes('--ia');
const portada = opciones.find((o) => o.startsWith('--portada='))?.split('=')[1];

const env = leerEnv();

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REFRESH_TOKEN) {
  salir('Faltan los datos de YouTube en .env. Ejecuta primero youtube-token.mjs.');
}

// El token de acceso dura una hora: se pide uno nuevo en cada ejecución.
async function tokenDeAcceso() {
  const datos = await leerRespuestaGoogle(
    await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        refresh_token: env.YOUTUBE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    }),
  );
  return datos.access_token;
}

async function verificar(token) {
  const { items } = await leerRespuestaGoogle(
    await fetch(`${API}/channels?part=snippet,status&mine=true`, { headers: { Authorization: `Bearer ${token}` } }),
  );
  const canal = items?.[0];
  if (canal?.id !== env.YOUTUBE_CHANNEL_ID || canal.snippet.customUrl?.toLowerCase() !== CANAL) {
    salir(`El token es de otro canal: ${canal?.snippet?.title ?? 'ninguno'}.`);
  }
  console.log(`YouTube: acceso válido a "${canal.snippet.title}" (${canal.snippet.customUrl}).`);
}

// La portada no debe tumbar un vídeo ya subido: si falla, se avisa y se cambia en YouTube Studio.
async function subirPortada(token, videoId) {
  if (!portada) return;
  try {
    await leerRespuestaGoogle(
      await fetch(`${SUBIDAS}/thumbnails/set?videoId=${videoId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
        body: readFileSync(portada),
      }),
    );
    console.log('YouTube: portada subida.');
  } catch (error) {
    console.error(`YouTube: no se pudo subir la portada: ${error.message}`);
  }
}

async function subir(token, privacidad) {
  if (!titulo) salir('Falta el título.');
  if (titulo.length > 100) salir(`El título tiene ${titulo.length} caracteres; YouTube acepta 100.`);
  const bytes = statSync(archivo).size;
  const metadatos = {
    snippet: {
      title: titulo,
      description: descripcion ?? '',
      categoryId: AUTOS_Y_VEHICULOS,
      defaultLanguage: 'es',
      defaultAudioLanguage: 'es',
    },
    status: { privacyStatus: privacidad, selfDeclaredMadeForKids: false, containsSyntheticMedia: conIA },
  };
  const inicio = await fetch(`${SUBIDAS}/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(bytes),
    },
    body: JSON.stringify(metadatos),
  });
  if (!inicio.ok) await leerRespuestaGoogle(inicio);
  const destino = inicio.headers.get('location');
  if (!destino) salir('YouTube no devolvió la dirección de subida.');
  const video = await leerRespuestaGoogle(
    await fetch(destino, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(bytes) },
      body: readFileSync(archivo),
    }),
  );
  console.log(`YouTube: vídeo ${video.id} subido como ${video.status.privacyStatus}.`);
  console.log(`YouTube: https://www.youtube.com/shorts/${video.id}`);
  if (privacidad === 'public' && video.status.privacyStatus !== 'public') {
    console.log('YouTube: quedó privado porque el proyecto aún no pasa la auditoría de Google. Se cambia a público en YouTube Studio.');
  }
  await subirPortada(token, video.id);
  return video.id;
}

try {
  const token = await tokenDeAcceso();
  if (accion === 'verificar') {
    await verificar(token);
  } else if (accion === 'portada' && archivo && portada) {
    // Aquí `archivo` es el id de un vídeo ya subido: sirve para reintentar una portada que falló.
    await subirPortada(token, archivo);
  } else if (accion === 'borrador' && archivo) {
    await verificar(token);
    await subir(token, 'private');
    console.log('Prueba terminada: el vídeo quedó privado.');
  } else if (accion === 'publicar' && archivo) {
    if (!confirmo) salir('No publiqué nada: falta --confirmo.');
    await verificar(token);
    await subir(token, 'public');
  } else {
    salir('Uso: publicar-youtube.mjs verificar | borrador <mp4> "<título>" "<descripción>" | publicar <mp4> "<título>" "<descripción>" --confirmo');
  }
} catch (error) {
  salir(error.message);
}
