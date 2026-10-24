import type { APIRoute, GetStaticPaths } from 'astro';
import { obtenerCatalogo } from '../../../lib/catalogoDatos';
import { imagenComparacion } from '../../../lib/imagenesSociales';
import type { Par } from '../../../lib/catalogo';

/** Imagen para compartir de cada comparación fija: /og/comparador/<par>.jpg */
export const getStaticPaths = (async () => {
  const { pares } = await obtenerCatalogo();
  return pares.map((par) => ({ params: { par: par.slug }, props: { par } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { par } = props as { par: Par };
  const imagen = await imagenComparacion(par.va, par.a.nombre, par.vb, par.b.nombre);
  return new Response(new Uint8Array(imagen), { headers: { 'Content-Type': 'image/jpeg' } });
};
