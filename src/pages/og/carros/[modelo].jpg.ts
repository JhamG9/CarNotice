import type { APIRoute, GetStaticPaths } from 'astro';
import { obtenerCatalogo } from '../../../lib/catalogoDatos';
import { imagenModelo } from '../../../lib/imagenesSociales';
import type { Modelo } from '../../../lib/catalogo';

/** Imagen para compartir de cada página de modelo: /og/carros/<modelo>.jpg */
export const getStaticPaths = (async () => {
  const { modelos } = await obtenerCatalogo();
  return modelos.map((modelo) => ({ params: { modelo: modelo.slug }, props: { modelo } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { modelo } = props as { modelo: Modelo };
  const imagen = await imagenModelo(modelo.representativa, modelo.nombre);
  return new Response(new Uint8Array(imagen), { headers: { 'Content-Type': 'image/jpeg' } });
};
