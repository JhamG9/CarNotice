import path from 'node:path';
import sharp from 'sharp';
import type { Vehiculo } from './vehiculos';

/**
 * Imágenes de 1200 × 630 para compartir (Open Graph), generadas al compilar con sharp.
 * Usan las fotos de public/vehicles/; sin foto, un recuadro del color de los marcadores.
 * Colores de CLAUDE.md, tema claro: --bg, --heading, --accent, --tint, --chart-a y --chart-b.
 */

const ANCHO = 1200;
const ALTO = 630;
const COLOR = { fondo: '#F7F6F2', titular: '#14284B', acento: '#1B6B43', marcador: '#E4E9F1', a: '#C23508', b: '#2563C9' };
const FUENTE = "'Poppins', 'Helvetica Neue', Arial, sans-serif";

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Foto del vehículo recortada a la medida pedida. */
async function foto(v: Vehiculo, ancho: number, alto: number): Promise<Buffer> {
  if (typeof v.image_url === 'string') {
    try {
      return await sharp(path.join(process.cwd(), 'public', v.image_url)).resize(ancho, alto, { fit: 'cover' }).toBuffer();
    } catch {
      // Sin el archivo, se usa el marcador
    }
  }
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: COLOR.marcador } }).png().toBuffer();
}

const lienzo = () => sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: COLOR.fondo } });

/** Dos fotos lado a lado con "A vs B", la línea del color de cada carro y la marca del sitio. */
export async function imagenComparacion(a: Vehiculo, nombreA: string, b: Vehiculo, nombreB: string): Promise<Buffer> {
  const titulo = `${nombreA} vs ${nombreB}`;
  const tamanoTitulo = titulo.length > 38 ? 40 : titulo.length > 28 ? 48 : 56;
  const fotoAncho = 536;
  const fotoAlto = 315;
  const texto = `
    <svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
      <text x="${ANCHO / 2}" y="92" text-anchor="middle" font-family="${FUENTE}" font-size="${tamanoTitulo}" font-weight="700" fill="${COLOR.titular}">${escapar(titulo)}</text>
      <rect x="27" y="${140 + fotoAlto + 12}" width="${fotoAncho}" height="8" rx="4" fill="${COLOR.a}"/>
      <rect x="${ANCHO - 27 - fotoAncho}" y="${140 + fotoAlto + 12}" width="${fotoAncho}" height="8" rx="4" fill="${COLOR.b}"/>
      <text x="${ANCHO / 2}" y="${140 + fotoAlto / 2 + 14}" text-anchor="middle" font-family="${FUENTE}" font-size="34" font-weight="700" fill="${COLOR.titular}">VS</text>
      <text x="27" y="590" font-family="${FUENTE}" font-size="30" font-weight="700" fill="${COLOR.titular}">Mejor Eléctrico<tspan fill="${COLOR.acento}">.</tspan></text>
      <text x="${ANCHO - 27}" y="590" text-anchor="end" font-family="${FUENTE}" font-size="26" fill="${COLOR.acento}">Autonomía, carga, potencia y equipamiento</text>
    </svg>`;
  return lienzo()
    .composite([
      { input: await foto(a, fotoAncho, fotoAlto), left: 27, top: 140 },
      { input: await foto(b, fotoAncho, fotoAlto), left: ANCHO - 27 - fotoAncho, top: 140 },
      { input: Buffer.from(texto), left: 0, top: 0 },
    ])
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
}

/** Foto grande del modelo con una franja abajo: nombre y "Ficha técnica". */
export async function imagenModelo(v: Vehiculo, nombre: string): Promise<Buffer> {
  const altoFoto = 480;
  const tamano = nombre.length > 30 ? 44 : 56;
  const texto = `
    <svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
      <text x="40" y="${altoFoto + 78}" font-family="${FUENTE}" font-size="${tamano}" font-weight="700" fill="${COLOR.titular}">${escapar(nombre)}</text>
      <text x="40" y="${altoFoto + 122}" font-family="${FUENTE}" font-size="26" fill="${COLOR.acento}">Ficha técnica, autonomía y versiones</text>
      <text x="${ANCHO - 40}" y="${altoFoto + 122}" text-anchor="end" font-family="${FUENTE}" font-size="28" font-weight="700" fill="${COLOR.titular}">Mejor Eléctrico<tspan fill="${COLOR.acento}">.</tspan></text>
    </svg>`;
  return lienzo()
    .composite([
      { input: await foto(v, ANCHO, altoFoto), left: 0, top: 0 },
      { input: Buffer.from(texto), left: 0, top: 0 },
    ])
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
}
