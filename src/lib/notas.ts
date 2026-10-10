import { getCollection, type CollectionEntry } from 'astro:content';

export type Nota = CollectionEntry<'notas'>;

export async function obtenerNotas(): Promise<Nota[]> {
  const notas = await getCollection('notas');
  return notas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}
