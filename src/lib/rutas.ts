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
export const rutaComparador = () => `/${IDIOMA}/comparador/`;
export const rutaNota = (id: string) => `/${IDIOMA}/notas/${id}/`;
/** La página 1 no lleva número: /categoria/<slug>/, /categoria/<slug>/2/, ... */
const sufijoPagina = (pagina: number) => (pagina > 1 ? `${pagina}/` : '');

export const rutaBlog = (pagina = 1) => `/${IDIOMA}/blog/${sufijoPagina(pagina)}`;
export const rutaCategoria = (categoria: Categoria, pagina = 1) =>
  `/${IDIOMA}/categoria/${categoria.slug}/${sufijoPagina(pagina)}`;
export const rutaEtiqueta = (etiqueta: string, pagina = 1) =>
  `/${IDIOMA}/etiqueta/${slugificar(etiqueta)}/${sufijoPagina(pagina)}`;
