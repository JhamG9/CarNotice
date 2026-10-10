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
      fecha: z.coerce.date(),
      categoria: z.enum(clavesCategoria),
      etiquetas: z.array(z.string().min(1)).min(1).max(5),
      imagen: image(),
      // Vacío mientras la imagen sea un marcador de posición decorativo.
      imagenAlt: z.string().default(''),
      destacada: z.boolean().default(false),
    }),
});

export const collections = { notas };
