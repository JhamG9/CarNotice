import type { Idioma } from '../i18n/idiomas';

export const categorias = [
  {
    clave: 'lanzamientos',
    nombre: 'Lanzamientos',
    slug: 'lanzamientos',
    electrica: false,
    descripcion: 'Los modelos nuevos y las nuevas generaciones que llegan al mercado.',
    en: { nombre: 'Launches', slug: 'launches', descripcion: 'New models and new generations arriving on the market.' },
  },
  {
    clave: 'noticias',
    nombre: 'Noticias',
    slug: 'noticias',
    electrica: false,
    descripcion: 'Mercado, industria y regulación: lo que está pasando en el mundo de los carros.',
    en: { nombre: 'News', slug: 'news', descripcion: 'Market, industry and regulation: what is happening in the car world.' },
  },
  {
    clave: 'electricos',
    nombre: 'Eléctricos',
    slug: 'electricos',
    electrica: true,
    descripcion: 'Carros eléctricos e híbridos: modelos, autonomía, carga y costos.',
    en: { nombre: 'Electric', slug: 'electric', descripcion: 'Electric and hybrid cars: models, range, charging and costs.' },
  },
  {
    clave: 'pruebas',
    nombre: 'Pruebas',
    slug: 'pruebas',
    electrica: false,
    descripcion: 'Pruebas de manejo en ciudad y carretera, con consumos y medidas reales.',
    en: { nombre: 'Tests', slug: 'tests', descripcion: 'Crash tests and road tests, with real consumption and measurements.' },
  },
] as const;

export type Categoria = (typeof categorias)[number];
export type ClaveCategoria = Categoria['clave'];

export const clavesCategoria = categorias.map((c) => c.clave) as [ClaveCategoria, ...ClaveCategoria[]];

/** Nombre, slug y descripción de la categoría en un idioma. La clave no cambia entre idiomas. */
export function textoCategoria(categoria: Categoria, idioma: Idioma): { nombre: string; slug: string; descripcion: string } {
  return idioma === 'es' ? categoria : categoria[idioma];
}

export function buscarCategoria(clave: ClaveCategoria): Categoria {
  return categorias.find((c) => c.clave === clave)!;
}
