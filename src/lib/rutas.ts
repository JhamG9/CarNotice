import type { Categoria } from '../data/categorias';

const IDIOMA = 'es';

export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const rutaInicio = () => `/${IDIOMA}/`;
export const rutaNota = (id: string) => `/${IDIOMA}/notas/${id}/`;
export const rutaCategoria = (categoria: Categoria) => `/${IDIOMA}/categoria/${categoria.slug}/`;
export const rutaEtiqueta = (etiqueta: string) => `/${IDIOMA}/etiqueta/${slugificar(etiqueta)}/`;
