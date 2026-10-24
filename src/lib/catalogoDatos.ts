import { getCollection } from 'astro:content';
import { agruparModelos, generarPares, type Modelo, type Par } from './catalogo';
import type { Vehiculo } from './vehiculos';

export interface Catalogo {
  vehiculos: Vehiculo[];
  modelos: Modelo[];
  pares: Par[];
}

// Una sola lectura por compilación: lo usan cientos de páginas
let catalogo: Promise<Catalogo> | null = null;

/** Modelos y comparaciones con página propia, a partir de la colección `vehiculos`. Solo en el servidor. */
export function obtenerCatalogo(): Promise<Catalogo> {
  catalogo ??= getCollection('vehiculos').then((entradas) => {
    const vehiculos = entradas.map((entrada) => entrada.data as Vehiculo);
    const modelos = agruparModelos(vehiculos);
    return { vehiculos, modelos, pares: generarPares(modelos) };
  });
  return catalogo;
}
