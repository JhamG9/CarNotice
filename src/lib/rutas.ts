import { textoCategoria, type Categoria } from '../data/categorias';
import { IDIOMA_POR_DEFECTO, type Idioma } from '../i18n/idiomas';

export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Segmento de URL de cada sección, por idioma. */
const SEGMENTOS = {
  es: {
    notas: 'notas',
    carros: 'carros',
    comparador: 'comparador',
    blog: 'blog',
    categoria: 'categoria',
    etiqueta: 'etiqueta',
    nosotros: 'nosotros',
    avisoLegal: 'aviso-legal',
    privacidad: 'politica-de-privacidad',
  },
  en: {
    notas: 'news',
    carros: 'cars',
    comparador: 'compare',
    blog: 'blog',
    categoria: 'category',
    etiqueta: 'tag',
    nosotros: 'about',
    avisoLegal: 'legal-notice',
    privacidad: 'privacy-policy',
  },
} satisfies Record<Idioma, Record<string, string>>;

type Seccion = keyof (typeof SEGMENTOS)['es'];

/**
 * Secciones que ya tienen páginas en cada idioma. Mientras una no exista en inglés, sus enlaces
 * desde las páginas en inglés llevan a la versión en español, para no dejar enlaces rotos.
 * Al construir una sección en inglés, se añade aquí.
 */
const CONSTRUIDAS: Record<Idioma, ReadonlySet<Seccion | 'inicio'>> = {
  es: new Set(['inicio', ...(Object.keys(SEGMENTOS.es) as Seccion[])]),
  en: new Set(['inicio', ...(Object.keys(SEGMENTOS.en) as Seccion[])]),
};

/** Idioma en que se enlaza una sección: el pedido si ya existe, si no el español. */
const idiomaDisponible = (seccion: Seccion | 'inicio', idioma: Idioma): Idioma =>
  CONSTRUIDAS[idioma].has(seccion) ? idioma : IDIOMA_POR_DEFECTO;

/** Ruta base de una sección: /es/carros/, /en/cars/... */
const base = (seccion: Seccion, idioma: Idioma) => {
  const disponible = idiomaDisponible(seccion, idioma);
  return `/${disponible}/${SEGMENTOS[disponible][seccion]}/`;
};

export const rutaInicio = (idioma: Idioma = 'es') => `/${idiomaDisponible('inicio', idioma)}/`;
export const rutaComparador = (idioma: Idioma = 'es') => base('comparador', idioma);
/** Comparador libre con dos versiones elegidas. */
export const rutaComparadorCon = (slugA: string, slugB: string, idioma: Idioma = 'es') =>
  `${base('comparador', idioma)}?${new URLSearchParams({ a: slugA, b: slugB })}`;
/** Página fija de una comparación entre dos modelos: /comparador/<modelo-a>-vs-<modelo-b>/ */
export const rutaComparacion = (par: string, idioma: Idioma = 'es') => `${base('comparador', idioma)}${par}/`;
export const rutaCarros = (idioma: Idioma = 'es') => base('carros', idioma);
export const rutaModelo = (modelo: string, idioma: Idioma = 'es') => `${base('carros', idioma)}${modelo}/`;
/** Imágenes para compartir, generadas al compilar. */
export const rutaImagenModelo = (modelo: string, idioma: Idioma = 'es') =>
  idioma === 'es' ? `/og/carros/${modelo}.jpg` : `/og/${idioma}/${SEGMENTOS[idioma].carros}/${modelo}.jpg`;
export const rutaImagenComparacion = (par: string, idioma: Idioma = 'es') =>
  idioma === 'es' ? `/og/comparador/${par}.jpg` : `/og/${idioma}/${SEGMENTOS[idioma].comparador}/${par}.jpg`;
/** Nota por su slug. En inglés, el slug es el de la nota traducida (src/content/notas-en/). */
export const rutaNota = (id: string, idioma: Idioma = 'es') => `${base('notas', idioma)}${id}/`;
export const rutaNosotros = (idioma: Idioma = 'es') => base('nosotros', idioma);
export const rutaAvisoLegal = (idioma: Idioma = 'es') => base('avisoLegal', idioma);
export const rutaPrivacidad = (idioma: Idioma = 'es') => base('privacidad', idioma);
/** La página 1 no lleva número: /categoria/<slug>/, /categoria/<slug>/2/, ... */
const sufijoPagina = (pagina: number) => (pagina > 1 ? `${pagina}/` : '');

export const rutaBlog = (pagina = 1, idioma: Idioma = 'es') => `${base('blog', idioma)}${sufijoPagina(pagina)}`;
export const rutaCategoria = (categoria: Categoria, pagina = 1, idioma: Idioma = 'es') =>
  `${base('categoria', idioma)}${textoCategoria(categoria, idiomaDisponible('categoria', idioma)).slug}/${sufijoPagina(pagina)}`;
export const rutaEtiqueta = (etiqueta: string, pagina = 1, idioma: Idioma = 'es') =>
  `${base('etiqueta', idioma)}${slugificar(etiqueta)}/${sufijoPagina(pagina)}`;
