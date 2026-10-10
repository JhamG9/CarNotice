export const categorias = [
  { clave: 'lanzamientos', nombre: 'Lanzamientos', slug: 'lanzamientos', electrica: false },
  { clave: 'noticias', nombre: 'Noticias', slug: 'noticias', electrica: false },
  { clave: 'electricos', nombre: 'Eléctricos', slug: 'electricos', electrica: true },
  { clave: 'pruebas', nombre: 'Pruebas', slug: 'pruebas', electrica: false },
] as const;

export type Categoria = (typeof categorias)[number];
export type ClaveCategoria = Categoria['clave'];

export const clavesCategoria = categorias.map((c) => c.clave) as [ClaveCategoria, ...ClaveCategoria[]];

export function buscarCategoria(clave: ClaveCategoria): Categoria {
  return categorias.find((c) => c.clave === clave)!;
}
