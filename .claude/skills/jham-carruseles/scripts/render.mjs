#!/usr/bin/env node
// Convierte el carrusel.json de una carpeta en láminas de 1080×1350 con Chrome sin ventana.
//
//   node render.mjs ~/carrusel-x                todas las láminas, la hoja de contacto y los JPG para publicar
//   node render.mjs ~/carrusel-x --solo=3       solo la lámina 3 (para corregir una sin repetir las demás)
//
// Sale en <carpeta>/salida: NN.png (para mirar), NN.jpg (Instagram solo acepta JPG) y hoja.png con todas juntas.
// Antes de fotografiar cada lámina comprueba que ningún texto se salga de su caja ni se corte: si pasa, lo dice y
// termina con código 1, para que no se publique una lámina rota.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { ESTILOS } from './estilos.mjs';

const ANCHO = 1080;
const ALTO = 1350;
const MAX_LAMINAS = 10;
const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROYECTO = resolve(SKILL, '../../..');
const FUENTES = join(SKILL, 'assets/fuentes');

const argumentos = process.argv.slice(2);
const carpeta = argumentos.find((a) => !a.startsWith('--'));
const solo = Number(argumentos.find((a) => a.startsWith('--solo='))?.split('=')[1]) || null;

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (!carpeta) salir('Uso: node render.mjs <carpeta del carrusel> [--solo=N]');
const base = resolve(carpeta);
const rutaPlan = join(base, 'carrusel.json');
if (!existsSync(rutaPlan)) salir(`No existe ${rutaPlan}.`);
const plan = JSON.parse(readFileSync(rutaPlan, 'utf8'));
const estilo = ESTILOS[plan.estilo ?? 'noche'];
if (!estilo) salir(`No hay estilo "${plan.estilo}". Hay: ${Object.keys(ESTILOS).join(', ')}.`);
const laminas = plan.laminas ?? [];
if (!laminas.length) salir('El carrusel no tiene láminas.');
// La marca de arriba y la web del cierre son las de Mejor Eléctrico salvo que el carrusel diga otras; "" las quita.
const MARCA = plan.marca ?? 'Mejor Eléctrico';
const WEB = plan.web ?? 'mejorelectrico.com';
if (laminas.length > MAX_LAMINAS) salir(`Tiene ${laminas.length} láminas; la API de Instagram acepta ${MAX_LAMINAS}.`);

function chrome() {
  const opciones = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const ruta = opciones.find((r) => existsSync(r));
  if (!ruta) salir('No encontré Chrome. Instálalo o pon su ruta en la variable CHROME.');
  return ruta;
}
const CHROME = chrome();

// ---------- Textos ----------

const escapar = (texto = '') =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// *así* va en color de acento y "/" parte el título en líneas (se parte antes de escapar, para no romper </em>).
const conAcento = (texto = '') => escapar(texto).replace(/\*([^*]+)\*/g, '<em>$1</em>');
const lineas = (texto = '') => String(texto).split(/\s*\/\s*/);

// La línea más larga decide el tamaño: el título baja de su tamaño máximo hasta caber a lo ancho, sin partirse.
const ANCHO_UTIL = ANCHO - 2 * 72;
function titulo(etiqueta, clase, texto, maximo, ancho = ANCHO_UTIL) {
  const partes = lineas(texto);
  const larga = Math.max(...partes.map((l) => l.replace(/\*/g, '').length));
  const tamano = Math.min(maximo, Math.floor(ancho / (larga * 0.6)));
  return `<${etiqueta} class="${clase}" style="font-size:${tamano}px">${partes.map(conAcento).join('<br>')}</${etiqueta}>`;
}

// "vehiculo:<slug>" es la foto del comparador; una ruta relativa se lee desde la carpeta del carrusel.
function imagen(ruta) {
  if (!ruta) return null;
  if (ruta.startsWith('vehiculo:')) ruta = join(PROYECTO, 'public/vehicles', `${ruta.slice(9)}.webp`);
  else if (!isAbsolute(ruta)) ruta = join(base, ruta);
  if (!existsSync(ruta)) salir(`No existe la imagen ${ruta}.`);
  return pathToFileURL(ruta).href;
}

const foto = (ruta, clase = 'foto') => (ruta ? `<div class="${clase}"><img src="${imagen(ruta)}" alt=""></div>` : '');

// ---------- Tipos de lámina ----------

const TIPOS = {
  portada: (l) => `
    ${titulo('h1', 'titulo grande', l.titulo, 104)}
    ${l.subtitulo ? `<p class="sub">${conAcento(l.subtitulo)}</p>` : ''}
    ${l.imagenes?.length ? `<div class="fotos n${Math.min(l.imagenes.length, 3)}">${l.imagenes.slice(0, 3).map((r) => foto(r)).join('')}</div>` : foto(l.imagen, 'foto ancha')}`,

  ranking: (l) => `
    <div class="puesto"><span>${escapar(l.puesto)}</span><div>${titulo('h2', 'titulo', l.nombre, 76, ANCHO_UTIL - 140)}${l.detalle ? `<p class="sub chica">${conAcento(l.detalle)}</p>` : ''}</div></div>
    ${foto(l.imagen, 'foto ancha')}
    ${l.valor != null ? `<div class="cifra"><p class="medida">${escapar(l.medida ?? '')}</p><p class="valor">${escapar(l.valor)}<small>${escapar(l.unidad ?? '')}</small></p>
    ${l.barra != null ? `<div class="barra"><div style="width:${Math.max(4, Math.min(100, l.barra * 100))}%"></div></div>` : ''}</div>` : ''}
    ${l.notas?.length ? `<ul class="notas">${l.notas.map((n) => `<li>${conAcento(n)}</li>`).join('')}</ul>` : ''}`,

  comparacion: (l) => `
    ${l.titulo ? titulo('h2', 'titulo', l.titulo, 76) : ''}
    <div class="dos">${[l.a, l.b].map((c) => `<div class="carro">${foto(c.imagen)}<p>${conAcento(c.nombre)}${c.detalle ? `<span>${conAcento(c.detalle)}</span>` : ''}</p></div>`).join('')}</div>
    ${(l.filas ?? []).map((f) => `<div class="fila"><span class="v ${f.gana === 'a' ? 'gana' : ''}">${escapar(f.a)}<small>${escapar(f.unidad ?? '')}</small></span><span class="md">${escapar(f.medida)}</span><span class="v d ${f.gana === 'b' ? 'gana' : ''}">${escapar(f.b)}<small>${escapar(f.unidad ?? '')}</small></span></div>`).join('')}`,

  dato: (l) => `
    ${l.titulo ? titulo('h2', 'titulo', l.titulo, 76) : ''}
    <p class="valor enorme">${escapar(l.valor)}<small>${escapar(l.unidad ?? '')}</small></p>
    ${l.texto ? `<p class="parrafo">${conAcento(l.texto)}</p>` : ''}
    ${foto(l.imagen, 'foto ancha')}`,

  lista: (l) => `
    ${titulo('h2', 'titulo', l.titulo, 76)}
    <ol class="lista">${(l.items ?? []).map((it, i) => `<li><span class="num">${i + 1}</span><div><b>${conAcento(it.titulo)}</b>${it.texto ? `<p>${conAcento(it.texto)}</p>` : ''}</div></li>`).join('')}</ol>`,

  texto: (l) => `
    ${titulo('h2', 'titulo', l.titulo, 76)}
    ${foto(l.imagen, 'foto ancha')}
    <p class="parrafo">${conAcento(l.texto)}</p>`,

  cierre: (l) => `
    ${titulo('h2', 'titulo grande', l.titulo, 104)}
    ${l.texto ? `<p class="parrafo">${conAcento(l.texto)}</p>` : ''}
    ${l.accion ? `<p class="boton">${conAcento(l.accion)}</p>` : ''}
    ${WEB ? `<p class="web">${escapar(l.web ?? WEB)}</p>` : ''}`,
};

// ---------- Página ----------

function css() {
  const e = estilo;
  return `
@font-face{font-family:T;src:url(${pathToFileURL(join(FUENTES, e.titulo.archivo)).href});font-weight:${e.titulo.peso}}
@font-face{font-family:X;src:url(${pathToFileURL(join(FUENTES, e.texto600)).href});font-weight:600}
@font-face{font-family:X;src:url(${pathToFileURL(join(FUENTES, e.texto800)).href});font-weight:800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${ANCHO}px;height:${ALTO}px;overflow:hidden}
body{background:${e.fondo};color:${e.texto};font-family:X;font-weight:600;position:relative}
em{font-style:normal;color:${e.acento}}
.m{position:absolute;border-radius:50%;filter:blur(120px);opacity:.55}
.lam{position:relative;height:100%;padding:64px 72px 52px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center;flex:none}
.pill{background:${e.acento};color:${e.acentoTexto};font-weight:800;font-size:24px;letter-spacing:2px;padding:11px 24px;border-radius:999px;text-transform:uppercase}
.marca{font-family:T;font-size:28px;color:${e.suave}}
.main{flex:1;min-height:0;display:flex;flex-direction:column;gap:28px;margin-top:40px;overflow:hidden}
.titulo{font-family:T;font-weight:${e.titulo.peso};font-size:76px;line-height:1.04;letter-spacing:-1px}
.titulo.grande{font-size:104px;letter-spacing:-2px;line-height:1}
.sub{font-size:34px;color:${e.suave};line-height:1.3}
.sub.chica{font-size:28px;margin-top:6px}
.parrafo{font-size:38px;line-height:1.38;color:${e.texto}}
.foto{border-radius:28px;overflow:hidden;background:${e.tarjeta};flex:1;min-height:0}
.foto img{width:100%;height:100%;object-fit:cover;display:block}
.foto.ancha{flex:1;min-height:260px}
.fotos{display:grid;gap:24px;flex:1;min-height:0}
.fotos.n2{grid-template-rows:1fr 1fr}.fotos.n3{grid-template-columns:1fr 1fr 1fr}
.puesto{display:flex;gap:28px;align-items:center}
.puesto>span{font-family:T;font-size:120px;line-height:1;color:${e.acento};min-width:110px}
.cifra{background:${e.tarjeta};border-radius:28px;padding:26px 34px;flex:none}
.medida{font-size:24px;letter-spacing:2px;color:${e.suave};text-transform:uppercase}
.valor{font-family:T;font-size:96px;line-height:1.05}
.valor small,.v small{font-family:X;font-size:.4em;color:${e.suave};margin-left:10px}
.valor.enorme{font-size:220px;color:${e.acento};line-height:1}
.barra{height:14px;border-radius:7px;background:${e.linea};margin-top:14px;overflow:hidden}
.barra div{height:100%;background:${e.acento};border-radius:7px}
.notas{list-style:none;display:flex;flex-direction:column;gap:12px;flex:none}
.notas li{font-size:30px;line-height:1.3;color:${e.suave};padding-left:30px;position:relative}
.notas li::before{content:"";position:absolute;left:0;top:14px;width:12px;height:12px;border-radius:50%;background:${e.acento}}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1;min-height:0}
.carro{background:${e.tarjeta};border-radius:28px;overflow:hidden;display:flex;flex-direction:column}
.carro .foto{border-radius:0}
.carro p{font-family:T;font-size:36px;padding:14px 24px 18px}
.carro p span{display:block;font-family:X;font-size:22px;color:${e.suave};margin-top:4px}
.fila{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:${e.tarjeta};border-radius:24px;padding:16px 30px;flex:none}
.fila .md{font-size:24px;color:${e.suave};letter-spacing:1px;text-transform:uppercase;text-align:center}
.v{font-family:T;font-size:50px}.v.d{text-align:right}.gana{color:${e.acento}}
.lista{list-style:none;display:flex;flex-direction:column;gap:26px}
.lista li{display:flex;gap:24px;align-items:flex-start}
.num{flex:none;width:60px;height:60px;border-radius:50%;background:${e.acento};color:${e.acentoTexto};font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center}
.lista b{font-family:T;font-weight:${e.titulo.peso};font-size:42px;line-height:1.15;display:block}
.lista p{font-size:30px;line-height:1.35;color:${e.suave};margin-top:6px}
.sin-foto.t-texto,.sin-foto.t-cierre,.sin-foto.t-dato,.sin-foto.t-lista{justify-content:center;gap:40px}
.sin-foto .parrafo{font-size:42px}
.boton{align-self:flex-start;width:fit-content;background:${e.acento};color:${e.acentoTexto};font-weight:800;font-size:36px;padding:22px 38px;border-radius:999px}
.boton em{color:${e.acentoTexto}}
.web{font-family:T;font-size:44px;color:${e.acento}}
.pie{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-top:28px;flex:none}
.cred{font-size:18px;color:${e.tenue};line-height:1.4;max-width:720px}
.der{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none}
.cont{font-size:22px;color:${e.tenue}}
.desliza{font-weight:800;font-size:28px;color:${e.acento}}`;
}

// Mide cada texto con las fuentes ya cargadas y deja lo que se sale en data-problemas.
const COMPROBAR = `
<script>
addEventListener('load', () => document.fonts.ready.then(() => {
  const p = [];
  const main = document.querySelector('.main');
  if (main.scrollHeight > main.clientHeight + 2) p.push('el contenido no cabe en la lámina (sobran ' + (main.scrollHeight - main.clientHeight) + ' px)');
  const caja = document.body.getBoundingClientRect();
  for (const el of document.querySelectorAll('h1,h2,p,li,b,span')) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.right > caja.right - 40 || r.left < 40) p.push('«' + el.textContent.trim().slice(0, 40) + '» toca el borde');
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).display !== 'inline') p.push('«' + el.textContent.trim().slice(0, 40) + '» no cabe a lo ancho');
  }
  for (const t of document.querySelectorAll('.titulo')) {
    const esperadas = t.innerHTML.split('<br>').length;
    const reales = Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight));
    if (reales > esperadas) p.push('el título «' + t.textContent.trim().slice(0, 40) + '» se parte en ' + reales + ' líneas en vez de ' + esperadas);
  }
  for (const img of document.images) if (!img.naturalWidth) p.push('una imagen no cargó: ' + img.src);
  document.body.setAttribute('data-problemas', JSON.stringify(p));
}));
</script>`;

function pagina(lamina, numero, total) {
  const tipo = TIPOS[lamina.tipo];
  if (!tipo) salir(`Lámina ${numero}: no existe el tipo "${lamina.tipo}". Hay: ${Object.keys(TIPOS).join(', ')}.`);
  const ultima = numero === total;
  const etiqueta = lamina.etiqueta ?? plan.etiqueta;
  const [m1, m2, m3] = estilo.manchas;
  // Las manchas cambian de sitio en cada lámina para que al deslizar no parezca la misma imagen.
  const giro = numero % 2 ? '' : 'transform:scaleX(-1);';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css()}</style></head><body>
<div style="position:absolute;inset:0;${giro}">
<div class="m" style="width:700px;height:700px;background:${m1};left:-260px;top:-200px"></div>
<div class="m" style="width:600px;height:600px;background:${m2};right:-240px;top:${380 + (numero % 3) * 120}px"></div>
<div class="m" style="width:520px;height:520px;background:${m3};left:120px;bottom:-260px"></div>
</div>
<div class="lam">
<div class="top">${etiqueta ? `<span class="pill">${escapar(etiqueta)}</span>` : '<span></span>'}<span class="marca">${escapar(MARCA)}</span></div>
<div class="main t-${lamina.tipo}${lamina.imagen || lamina.imagenes?.length ? '' : ' sin-foto'}">${tipo(lamina)}</div>
<div class="pie"><p class="cred">${conAcento(lamina.credito ?? (numero === 1 ? plan.credito : '') ?? '')}</p>
<div class="der"><span class="cont">${numero}/${total}</span>${ultima ? '' : '<span class="desliza">Desliza →</span>'}</div></div>
</div>${COMPROBAR}</body></html>`;
}

// ---------- Render ----------

const salida = join(base, 'salida');
mkdirSync(join(salida, 'html'), { recursive: true });
const BANDERAS = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1', `--window-size=${ANCHO},${ALTO}`, '--virtual-time-budget=8000'];

let fallos = 0;
const total = laminas.length;
for (let i = 0; i < total; i++) {
  const numero = i + 1;
  if (solo && numero !== solo) continue;
  const nn = String(numero).padStart(2, '0');
  const html = join(salida, 'html', `${nn}.html`);
  writeFileSync(html, pagina(laminas[i], numero, total));
  const dom = execFileSync(CHROME, [...BANDERAS, '--dump-dom', pathToFileURL(html).href], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const problemas = JSON.parse((dom.match(/data-problemas="([^"]*)"/)?.[1] ?? '["no se pudo medir la lámina"]').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  const png = join(salida, `${nn}.png`);
  execFileSync(CHROME, [...BANDERAS, `--screenshot=${png}`, pathToFileURL(html).href], { stdio: 'ignore' });
  await sharp(png).flatten({ background: estilo.fondo }).jpeg({ quality: 92, mozjpeg: true }).toFile(join(salida, `${nn}.jpg`));
  if (problemas.length) {
    fallos++;
    console.log(`Lámina ${numero} (${laminas[i].tipo}): ${problemas.join('; ')}`);
  } else {
    console.log(`Lámina ${numero} (${laminas[i].tipo}): bien.`);
  }
}

// Hoja de contacto: todas las láminas en pequeño, en el orden en que se deslizan.
if (!solo) {
  const columnas = Math.min(total, 5);
  const filas = Math.ceil(total / columnas);
  const [w, h, sep] = [324, 405, 16];
  const piezas = await Promise.all(
    laminas.map(async (_, i) => ({
      input: await sharp(join(salida, `${String(i + 1).padStart(2, '0')}.png`)).resize(w, h).toBuffer(),
      left: sep + (i % columnas) * (w + sep),
      top: sep + Math.floor(i / columnas) * (h + sep),
    })),
  );
  await sharp({ create: { width: sep + columnas * (w + sep), height: sep + filas * (h + sep), channels: 3, background: '#000000' } })
    .composite(piezas)
    .png()
    .toFile(join(salida, 'hoja.png'));
  console.log(`Hoja de contacto: ${join(salida, 'hoja.png')}`);
}

if (fallos) salir(`${fallos} lámina(s) con problemas: corrige carrusel.json y vuelve a renderizar.`);
console.log('Sin problemas.');
