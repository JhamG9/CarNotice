import { getCollection, type CollectionEntry } from 'astro:content';
import type { Idioma } from '../i18n/idiomas';
import { rutaNota, slugificar } from './rutas';

/** Nota en cualquier idioma: las de español en `notas`, las de inglés en `notasEn`. */
export type Nota = CollectionEntry<'notas'> | CollectionEntry<'notasEn'>;

export const NOTAS_POR_PAGINA = 10;

const COLECCION = { es: 'notas', en: 'notasEn' } as const satisfies Record<Idioma, Nota['collection']>;

export const idiomaDeNota = (nota: Nota): Idioma => (nota.collection === 'notasEn' ? 'en' : 'es');

/** Enlace a una nota, en su idioma. */
export const enlaceNota = (nota: Nota) => rutaNota(nota.id, idiomaDeNota(nota));

/** Slug de la nota en español de la que sale esta (la misma nota si ya es española). */
export const slugOriginal = (nota: Nota) => (nota.collection === 'notasEn' ? nota.data.original.id : nota.id);

export interface Etiqueta {
  nombre: string;
  slug: string;
  notas: Nota[];
}

/** Agrupa las notas por etiqueta. Dos textos con el mismo slug cuentan como una sola etiqueta. */
export function obtenerEtiquetas(notas: Nota[]): Etiqueta[] {
  const porSlug = new Map<string, Etiqueta>();
  for (const nota of notas) {
    for (const nombre of nota.data.etiquetas) {
      const slug = slugificar(nombre);
      const etiqueta = porSlug.get(slug) ?? { nombre, slug, notas: [] };
      if (!etiqueta.notas.includes(nota)) etiqueta.notas.push(nota);
      porSlug.set(slug, etiqueta);
    }
  }
  return [...porSlug.values()];
}

const PALABRAS_POR_MINUTO = 220;

/** Minutos de lectura estimados a partir del Markdown de la nota. */
export function tiempoDeLectura(nota: Nota): number {
  const palabras = (nota.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
}

/** Hasta `cantidad` notas de la misma categoría; si no alcanzan, completa con las más recientes. */
export function notasRelacionadas(nota: Nota, todas: Nota[], cantidad = 3): Nota[] {
  const otras = todas.filter((otra) => otra.id !== nota.id);
  const mismaCategoria = otras.filter((otra) => otra.data.categoria === nota.data.categoria);
  const resto = otras.filter((otra) => otra.data.categoria !== nota.data.categoria);
  return [...mismaCategoria, ...resto].slice(0, cantidad);
}

/** Notas de un idioma, de la más reciente a la más antigua. */
export async function obtenerNotas(idioma: Idioma = 'es'): Promise<Nota[]> {
  const notas: Nota[] = await getCollection(COLECCION[idioma]);
  return notas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

/**
 * Traducciones de cada nota: para el slug en español, la ruta de la nota en cada idioma.
 * Sirve para el hreflang, el selector de idioma y los enlaces dentro del texto.
 */
export async function traduccionesDeNotas(): Promise<Map<string, Partial<Record<Idioma, string>>>> {
  const mapa = new Map<string, Partial<Record<Idioma, string>>>();
  for (const nota of [...(await obtenerNotas('es')), ...(await obtenerNotas('en'))]) {
    const original = slugOriginal(nota);
    mapa.set(original, { ...mapa.get(original), [idiomaDeNota(nota)]: enlaceNota(nota) });
  }
  return mapa;
}
