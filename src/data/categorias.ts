export const categorias = [
  {
    clave: 'lanzamientos',
    nombre: 'Lanzamientos',
    slug: 'lanzamientos',
    electrica: false,
    descripcion: 'Los modelos nuevos y las nuevas generaciones que llegan al mercado.',
  },
  {
    clave: 'noticias',
    nombre: 'Noticias',
    slug: 'noticias',
    electrica: false,
    descripcion: 'Mercado, industria y regulación: lo que está pasando en el mundo de los carros.',
  },
  {
    clave: 'electricos',
    nombre: 'Eléctricos',
    slug: 'electricos',
    electrica: true,
    descripcion: 'Carros eléctricos e híbridos: modelos, autonomía, carga y costos.',
  },
  {
    clave: 'pruebas',
    nombre: 'Pruebas',
    slug: 'pruebas',
    electrica: false,
    descripcion: 'Pruebas de manejo en ciudad y carretera, con consumos y medidas reales.',
  },
] as const;

export type Categoria = (typeof categorias)[number];
export type ClaveCategoria = Categoria['clave'];

export const clavesCategoria = categorias.map((c) => c.clave) as [ClaveCategoria, ...ClaveCategoria[]];

export function buscarCategoria(clave: ClaveCategoria): Categoria {
  return categorias.find((c) => c.clave === clave)!;
}
