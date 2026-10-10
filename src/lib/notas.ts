import { getCollection, type CollectionEntry } from 'astro:content';
import { slugificar } from './rutas';

export type Nota = CollectionEntry<'notas'>;

export const NOTAS_POR_PAGINA = 10;

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

export async function obtenerNotas(): Promise<Nota[]> {
  const notas = await getCollection('notas');
  return notas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}
