#!/usr/bin/env node
// Sube un vídeo largo (horizontal, no Short) al canal de YouTube con la API de YouTube.
//
//   node publicar-video.mjs verificar                                         comprueba el acceso al canal, sin subir nada
//   node publicar-video.mjs borrador video.mp4 "Título" descripcion.txt        lo sube privado: no se ve en público
//   node publicar-video.mjs oculto video.mp4 "Título" descripcion.txt --confirmo  sin listar: solo con el enlace
//   node publicar-video.mjs publicar video.mp4 "Título" descripcion.txt --confirmo
//   node publicar-video.mjs portada <id del vídeo> --portada=portada.png       vuelve a intentar solo la miniatura
//
// La descripción va en un archivo de texto (lleva los capítulos y las fuentes). Opciones: --ia declara contenido
// sintético (voz generada con IA), --portada=archivo.png sube la miniatura y --categoria=N elige la categoría de
// YouTube (2 Autos y vehículos, 15 Mascotas y animales, 26 Consejos y estilo, 27 Educación, 28 Ciencia y tecnología;
// por defecto 26).
//
// Publicar es decisión de la persona: sin --confirmo no se publica nada. Si Google deja privado lo que se pidió
// público (puede pasar mientras el proyecto no tenga auditoría), se avisa.
import { existsSync, readFileSync, statSync } from 'node:fs';
// La conexión con Google y el .env son los de la skill de reels: un solo canal, un solo token.
import { leerEnv } from '../../jham-reels/scripts/meta-comun.mjs';
import { CANAL, leerRespuestaGoogle } from '../../jham-reels/scripts/youtube-comun.mjs';

const API = 'https://www.googleapis.com/youtube/v3';
const SUBIDAS = 'https://www.googleapis.com/upload/youtube/v3';

const argumentos = process.argv.slice(2);
const opciones = argumentos.filter((a) => a.startsWith('--'));
const [accion, archivo, titulo, descripcion] = argumentos.filter((a) => !a.startsWith('--'));
const confirmo = opciones.includes('--confirmo');
const conIA = opciones.includes('--ia');
const portada = opciones.find((o) => o.startsWith('--portada='))?.split('=')[1];
const categoria = opciones.find((o) => o.startsWith('--categoria='))?.split('=')[1] ?? '26';
// La descripción llega como archivo (capítulos y fuentes) o, si no existe ese archivo, como texto.
const textoDescripcion = descripcion && existsSync(descripcion) ? readFileSync(descripcion, 'utf8') : (descripcion ?? '');

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
    // YouTube acepta portadas de hasta 2 MB: si el PNG pasa, se manda como JPG con sharp (viene con Astro).
    let imagen = readFileSync(portada);
    let tipo = 'image/png';
    if (imagen.length > 2 * 1024 * 1024) {
      const { default: sharp } = await import('sharp');
      imagen = await sharp(imagen).jpeg({ quality: 88 }).toBuffer();
      tipo = 'image/jpeg';
    }
    await leerRespuestaGoogle(
      await fetch(`${SUBIDAS}/thumbnails/set?videoId=${videoId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': tipo },
        body: imagen,
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
  if (textoDescripcion.length > 5000) salir(`La descripción tiene ${textoDescripcion.length} caracteres; YouTube acepta 5000.`);
  const bytes = statSync(archivo).size;
  const metadatos = {
    snippet: {
      title: titulo,
      description: textoDescripcion,
      categoryId: categoria,
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
  console.log(`YouTube: https://www.youtube.com/watch?v=${video.id}`);
  if (privacidad === 'public' && video.status.privacyStatus !== 'public') {
    console.log('YouTube: Google lo dejó privado (el proyecto no tiene auditoría). Se cambia a público en YouTube Studio.');
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
  } else if (accion === 'oculto' && archivo) {
    if (!confirmo) salir('No subí nada: falta --confirmo.');
    await verificar(token);
    await subir(token, 'unlisted');
  } else if (accion === 'publicar' && archivo) {
    if (!confirmo) salir('No publiqué nada: falta --confirmo.');
    await verificar(token);
    await subir(token, 'public');
  } else {
    salir('Uso: publicar-video.mjs verificar | borrador <mp4> "<título>" <descripcion.txt> | oculto|publicar <mp4> "<título>" <descripcion.txt> --confirmo');
  }
} catch (error) {
  salir(error.message);
}
