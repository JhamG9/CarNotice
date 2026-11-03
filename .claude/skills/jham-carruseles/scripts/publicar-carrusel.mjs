#!/usr/bin/env node
// Publica un carrusel en la página de Facebook y en el Instagram de Mejor Eléctrico con la API de Meta.
//
//   node publicar-carrusel.mjs verificar                     comprueba el token y las cuentas, sin subir nada
//   node publicar-carrusel.mjs borrador ~/carrusel-x         sube las imágenes sin publicarlas: nada se ve en público
//   node publicar-carrusel.mjs publicar ~/carrusel-x --confirmo [--solo-facebook | --solo-instagram]
//
// Lee de la carpeta las láminas en salida/NN.jpg (las que hizo render.mjs) y el texto en salida/texto-publicar.txt.
//
// Instagram no deja subir imágenes desde el computador: pide una dirección pública en JPG. Por eso cada lámina se
// sube primero a Facebook como foto sin publicar (no aparece en la página) y a Instagram se le pasa su dirección.
//
// Publicar es decisión de la persona: sin --confirmo no se publica nada.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GRAPH, graph, leerEnv, leerRespuesta } from '../../jham-reels/scripts/meta-comun.mjs';

const MAX_LAMINAS = 10;
const argumentos = process.argv.slice(2);
const opciones = argumentos.filter((a) => a.startsWith('--'));
const [accion, carpeta] = argumentos.filter((a) => !a.startsWith('--'));
const confirmo = opciones.includes('--confirmo');
const aFacebook = !opciones.includes('--solo-instagram');
const aInstagram = !opciones.includes('--solo-facebook');

const env = leerEnv();
const pageId = env.META_PAGE_ID;
const igId = env.META_IG_ID;
const token = env.META_PAGE_TOKEN;
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (!pageId || !token) salir('Faltan META_PAGE_ID o META_PAGE_TOKEN en .env. Ejecuta primero meta-token.mjs de jham-reels.');

async function verificar() {
  const pagina = await graph('GET', '/me', { fields: 'id,name,username', access_token: token });
  if (pagina.id !== pageId) salir(`El token es de otra página: ${pagina.name}.`);
  console.log(`Facebook: token válido para "${pagina.name}" (${pagina.username ?? pagina.id}).`);
  if (!igId) salir('Falta META_IG_ID en .env.');
  const ig = await graph('GET', `/${igId}`, { fields: 'username', access_token: token });
  const limite = await graph('GET', `/${igId}/content_publishing_limit`, { access_token: token });
  console.log(`Instagram: @${ig.username}, ${limite.data?.[0]?.quota_usage ?? 0} publicaciones por API en 24 horas.`);
}

// Las láminas salen del carrusel.json, no de lo que haya en la carpeta: así no se cuela una lámina vieja.
function leerCarrusel() {
  const base = resolve(carpeta);
  const plan = JSON.parse(readFileSync(join(base, 'carrusel.json'), 'utf8'));
  const total = plan.laminas?.length ?? 0;
  if (total < 2) salir('Un carrusel necesita al menos 2 láminas.');
  if (total > MAX_LAMINAS) salir(`Tiene ${total} láminas; la API de Instagram acepta ${MAX_LAMINAS}.`);
  const imagenes = Array.from({ length: total }, (_, i) => join(base, 'salida', `${String(i + 1).padStart(2, '0')}.jpg`));
  const falta = imagenes.find((r) => !existsSync(r));
  if (falta) salir(`Falta ${falta}. Ejecuta render.mjs antes.`);
  const rutaTexto = join(base, 'salida', 'texto-publicar.txt');
  if (!existsSync(rutaTexto)) salir(`Falta ${rutaTexto}.`);
  return { imagenes, texto: readFileSync(rutaTexto, 'utf8').trim() };
}

async function subirFotoSinPublicar(ruta) {
  const cuerpo = new FormData();
  cuerpo.append('published', 'false');
  cuerpo.append('source', new Blob([readFileSync(ruta)], { type: 'image/jpeg' }), 'lamina.jpg');
  const respuesta = await fetch(`${GRAPH}/${pageId}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: cuerpo,
  });
  const { id } = await leerRespuesta(respuesta);
  return id;
}

// La versión más grande que guarda Facebook de la foto: es la que Instagram descarga.
async function direccionPublica(fotoId) {
  const { images } = await graph('GET', `/${fotoId}`, { fields: 'images', access_token: token });
  const mayor = [...(images ?? [])].sort((a, b) => b.width - a.width)[0];
  if (!mayor?.source) throw new Error(`Facebook no devolvió la dirección de la foto ${fotoId}.`);
  return mayor.source;
}

async function esperarContenedor(id, nombre) {
  for (let intento = 0; intento < 30; intento++) {
    const { status_code: fase, status } = await graph('GET', `/${id}`, { fields: 'status_code,status', access_token: token });
    if (fase === 'FINISHED') return;
    if (fase === 'ERROR' || fase === 'EXPIRED') throw new Error(`Instagram rechazó ${nombre}: ${status}`);
    await esperar(5000);
  }
  throw new Error(`Instagram sigue procesando ${nombre}.`);
}

async function publicarFacebook(fotos, texto) {
  const campos = { message: texto, access_token: token };
  fotos.forEach((id, i) => {
    campos[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  const { id } = await graph('POST', `/${pageId}/feed`, campos);
  const { permalink_url: enlace } = await graph('GET', `/${id}`, { fields: 'permalink_url', access_token: token });
  console.log(`Facebook: publicado: ${enlace}`);
}

// Instagram no tiene borradores por API: el contenedor del carrusel no se ve hasta llamar a media_publish.
async function prepararInstagram(fotos, texto) {
  const hijos = [];
  for (const [i, fotoId] of fotos.entries()) {
    const { id } = await graph('POST', `/${igId}/media`, {
      image_url: await direccionPublica(fotoId),
      is_carousel_item: 'true',
      access_token: token,
    });
    await esperarContenedor(id, `la lámina ${i + 1}`);
    hijos.push(id);
  }
  const { id } = await graph('POST', `/${igId}/media`, {
    media_type: 'CAROUSEL',
    children: hijos.join(','),
    caption: texto,
    access_token: token,
  });
  await esperarContenedor(id, 'el carrusel');
  console.log(`Instagram: carrusel de ${hijos.length} láminas listo, sin publicar.`);
  return id;
}

async function publicarInstagram(contenedor) {
  // Fuera de cualquier reintento: repetirlo a ciegas podría publicar dos veces.
  const { id } = await graph('POST', `/${igId}/media_publish`, { creation_id: contenedor, access_token: token });
  const { permalink: enlace } = await graph('GET', `/${id}`, { fields: 'permalink', access_token: token });
  console.log(`Instagram: publicado: ${enlace}`);
}

async function subirLaminas(imagenes) {
  const fotos = [];
  for (const [i, ruta] of imagenes.entries()) {
    fotos.push(await subirFotoSinPublicar(ruta));
    console.log(`Facebook: lámina ${i + 1} de ${imagenes.length} subida sin publicar.`);
  }
  return fotos;
}

try {
  if (accion === 'verificar') {
    await verificar();
  } else if (accion === 'borrador' && carpeta) {
    const { imagenes, texto } = leerCarrusel();
    await verificar();
    const fotos = await subirLaminas(imagenes);
    if (aInstagram) await prepararInstagram(fotos, texto);
    console.log('Prueba terminada: nada quedó público.');
  } else if (accion === 'publicar' && carpeta) {
    if (!confirmo) salir('No publiqué nada: falta --confirmo.');
    const { imagenes, texto } = leerCarrusel();
    await verificar();
    const fotos = await subirLaminas(imagenes);
    // Instagram se prepara antes de publicar en Facebook: si rechaza una lámina, no sale en ninguna red.
    const contenedor = aInstagram ? await prepararInstagram(fotos, texto) : null;
    if (aFacebook) await publicarFacebook(fotos, texto);
    if (contenedor) await publicarInstagram(contenedor);
  } else {
    salir('Uso: publicar-carrusel.mjs verificar | borrador <carpeta> | publicar <carpeta> --confirmo [--solo-facebook | --solo-instagram]');
  }
} catch (error) {
  salir(error.message);
}
