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
      // Foto en src/assets/notas/, en 16:9. Sin imagen, la plantilla pinta un marcador de posición.
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

export const collections = { notas };
