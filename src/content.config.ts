import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { clavesCategoria } from './data/categorias';

const notas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notas' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string().min(1).max(110),
      resumen: z.string().min(1).max(220),
      autor: z.string().min(1),
      fecha: z.coerce.date(),
      categoria: z.enum(clavesCategoria),
      etiquetas: z.array(z.string().min(1)).min(1).max(5),
      // Marca la nota con la etiqueta "Eléctrico" aunque esté en otra categoría (p. ej. un híbrido en Lanzamientos).
      electrico: z.boolean().default(false),
      // Foto en src/assets/images/, en 16:9. Sin imagen, la plantilla pinta un marcador de posición.
      imagen: image().optional(),
      imagenAlt: z.string().default(''),
      // Pie de foto y crédito de la imagen principal (p. ej. "Foto: sala de prensa de la marca").
      imagenPie: z.string().optional(),
      imagenCredito: z.string().optional(),
      destacada: z.boolean().default(false),
    })
    .refine((nota) => !nota.imagen || nota.imagenAlt.trim() !== '', {
      message: 'Una nota con imagen necesita imagenAlt (descripción de la foto).',
      path: ['imagenAlt'],
    }),
});

/**
 * Fichas del comparador, leídas de Supabase una vez por compilación. Con ellas se generan las páginas
 * de cada modelo y de cada comparación, para que Google las vea como HTML. Solo trae las publicadas
 * (lo exige RLS; el filtro lo deja explícito). Sin las variables de Supabase, la colección queda vacía
 * y esas páginas no se generan: el resto del sitio compila igual.
 */
const vehiculos = defineCollection({
  loader: async () => {
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const clave = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !clave) {
      console.warn('[vehiculos] Faltan las variables de Supabase: no se generan páginas de carros.');
      return [];
    }
    const respuesta = await fetch(`${url}/rest/v1/vehicles?select=*&published=eq.true&order=brand,model,version`, {
      headers: { apikey: clave },
    });
    if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status} al leer los vehículos`);
    const filas: Record<string, unknown>[] = await respuesta.json();
    return filas.map((fila) => ({ ...fila, id: String(fila.slug) }));
  },
  // Solo se validan los campos de identidad; el resto de columnas pasa tal cual (ver README).
  schema: z
    .object({
      slug: z.string(),
      brand: z.string(),
      model: z.string(),
      version: z.string(),
      model_year: z.number(),
      market: z.string(),
      segment: z.string(),
      body_style: z.string(),
      powertrain: z.string(),
    })
    .passthrough(),
});

export const collections = { notas, vehiculos };
