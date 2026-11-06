/**
 * Idiomas del sitio. El prefijo de la URL (/es/, /en/) dice el idioma de la página, no de dónde
 * viene la noticia. Para sumar un idioma: añadirlo aquí, crear su archivo de textos y sus segmentos
 * de ruta en src/lib/rutas.ts.
 */
export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_POR_DEFECTO: Idioma = 'es';

/** Código para Intl (fechas, números, listas) y para el atributo lang. */
export const LOCALE: Record<Idioma, string> = { es: 'es', en: 'en' };

/** og:locale de cada idioma. El español se queda en "es", como estaba. */
export const OG_LOCALE: Record<Idioma, string> = { es: 'es', en: 'en_US' };

export const esIdioma = (valor: string | undefined): valor is Idioma => IDIOMAS.includes(valor as Idioma);

/** Idioma de una página según el primer segmento de su ruta; sin prefijo, el español. */
export function idiomaDe(url: URL | string): Idioma {
  const ruta = typeof url === 'string' ? url : url.pathname;
  const primero = ruta.split('/')[1];
  return esIdioma(primero) ? primero : IDIOMA_POR_DEFECTO;
}
