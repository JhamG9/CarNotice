#!/usr/bin/env node
// Sube un reel a la página de Facebook y al Instagram de Mejor Eléctrico con la API de Meta.
//
//   node publicar-meta.mjs verificar                         comprueba el token y las cuentas, sin subir nada
//   node publicar-meta.mjs borrador reel.mp4 "Texto"         en Facebook queda como borrador; en Instagram sube el
//                                                            vídeo y no lo publica. Nada se ve en público
//   node publicar-meta.mjs publicar reel.mp4 "Texto" --confirmo [--solo-facebook | --solo-instagram]
//
// Opciones: --ia marca el reel de Facebook como generado con IA, --portada=archivo.png sube su portada a Facebook y
// --miniatura-ms=1800 elige el fotograma de portada en Instagram.
//
// Publicar es decisión de la persona: sin --confirmo no se publica nada.
import { readFileSync, statSync } from 'node:fs';
import { GRAPH, RUPLOAD, RUPLOAD_IG, graph, leerEnv, leerRespuesta } from './meta-comun.mjs';

const [accion, archivo, descripcion, ...opciones] = process.argv.slice(2);
const confirmo = opciones.includes('--confirmo');
const aFacebook = !opciones.includes('--solo-instagram');
const aInstagram = !opciones.includes('--solo-facebook');
const conIA = opciones.includes('--ia');
const valorDe = (nombre) => opciones.find((o) => o.startsWith(`--${nombre}=`))?.split('=')[1];
const portada = valorDe('portada');
const miniatura = valorDe('miniatura-ms');

const env = leerEnv();
const pageId = env.META_PAGE_ID;
const igId = env.META_IG_ID;
const token = env.META_PAGE_TOKEN;

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

if (!pageId || !token) salir('Faltan META_PAGE_ID o META_PAGE_TOKEN en .env. Ejecuta primero meta-token.mjs.');

async function verificar() {
  const pagina = await graph('GET', '/me', { fields: 'id,name,username', access_token: token });
  if (pagina.id !== pageId) salir(`El token es de otra página: ${pagina.name}.`);
  console.log(`Facebook: token válido para "${pagina.name}" (${pagina.username ?? pagina.id}).`);
  if (!aInstagram && accion !== 'verificar') return;
  if (!igId) salir('Falta META_IG_ID en .env. Ejecuta meta-token.mjs con los permisos de Instagram.');
  const ig = await graph('GET', `/${igId}`, { fields: 'username', access_token: token });
  const limite = await graph('GET', `/${igId}/content_publishing_limit`, { access_token: token });
  console.log(`Instagram: @${ig.username}, ${limite.data?.[0]?.quota_usage ?? 0} publicaciones por API en 24 horas.`);
}

// La portada no debe tumbar una publicación ya enviada: si falla, se avisa y se cambia a mano.
async function subirPortadaFacebook(videoId) {
  if (!portada) return;
  try {
    const cuerpo = new FormData();
    cuerpo.append('is_preferred', 'true');
    cuerpo.append('source', new Blob([readFileSync(portada)], { type: 'image/png' }), 'portada.png');
    const respuesta = await fetch(`${GRAPH}/${videoId}/thumbnails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: cuerpo,
    });
    await leerRespuesta(respuesta);
    console.log('Facebook: portada subida.');
  } catch (error) {
    console.error(`Facebook: no se pudo subir la portada: ${error.message}`);
  }
}

async function subirFacebook(estado) {
  const bytes = statSync(archivo).size;
  const { video_id: videoId } = await graph('POST', `/${pageId}/video_reels`, {
    upload_phase: 'start',
    access_token: token,
  });
  const subida = await fetch(`${RUPLOAD}/${videoId}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(bytes) },
    body: readFileSync(archivo),
  });
  await leerRespuesta(subida);
  await graph('POST', `/${pageId}/video_reels`, {
    upload_phase: 'finish',
    video_id: videoId,
    video_state: estado,
    description: descripcion ?? '',
    is_ai_generated: String(conIA),
    access_token: token,
  });
  console.log(`Facebook: vídeo ${videoId} enviado con estado ${estado}.`);
  await subirPortadaFacebook(videoId);

  // Meta procesa el vídeo después de recibirlo.
  for (let intento = 0; intento < 40; intento++) {
    await esperar(15000);
    const { status } = await graph('GET', `/${videoId}`, { fields: 'status', access_token: token });
    const fase = status?.video_status;
    console.log(`Facebook: ${fase ?? 'estado desconocido'}`);
    if (fase === 'error') salir(`Meta rechazó el vídeo: ${JSON.stringify(status)}`);
    if (fase === 'ready' || fase === 'published') return videoId;
  }
  salir('Meta sigue procesando el vídeo. Revísalo en el Planner de la página.');
}

// Instagram no tiene borradores por API: el contenedor subido no se ve hasta llamar a media_publish.
async function subirInstagram(publicar) {
  const bytes = statSync(archivo).size;
  const { id: contenedor } = await graph('POST', `/${igId}/media`, {
    media_type: 'REELS',
    upload_type: 'resumable',
    caption: descripcion ?? '',
    ...(miniatura ? { thumb_offset: miniatura } : {}),
    access_token: token,
  });
  const subida = await fetch(`${RUPLOAD_IG}/${contenedor}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(bytes) },
    body: readFileSync(archivo),
  });
  await leerRespuesta(subida);

  for (let intento = 0; intento < 40; intento++) {
    await esperar(15000);
    const { status_code: fase, status } = await graph('GET', `/${contenedor}`, {
      fields: 'status_code,status',
      access_token: token,
    });
    console.log(`Instagram: ${fase}`);
    if (fase === 'ERROR' || fase === 'EXPIRED') salir(`Meta rechazó el vídeo: ${status}`);
    if (fase === 'FINISHED') {
      if (!publicar) return console.log('Instagram: vídeo aceptado, sin publicar.');
      const { id } = await graph('POST', `/${igId}/media_publish`, { creation_id: contenedor, access_token: token });
      return console.log(`Instagram: publicado, medio ${id}.`);
    }
  }
  salir('Instagram sigue procesando el vídeo y no se publicó. Inténtalo de nuevo más tarde.');
}

try {
  if (accion === 'verificar') {
    await verificar();
  } else if (accion === 'borrador' && archivo) {
    await verificar();
    if (aFacebook) await subirFacebook('DRAFT');
    if (aInstagram) await subirInstagram(false);
    console.log('Prueba terminada: nada quedó público.');
  } else if (accion === 'publicar' && archivo) {
    if (!confirmo) salir('No publiqué nada: falta --confirmo.');
    await verificar();
    if (aFacebook) await subirFacebook('PUBLISHED');
    if (aInstagram) await subirInstagram(true);
    console.log('Publicado.');
  } else {
    salir('Uso: publicar-meta.mjs verificar | borrador <mp4> "<texto>" | publicar <mp4> "<texto>" --confirmo');
  }
} catch (error) {
  salir(error.message);
}
