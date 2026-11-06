import { en } from './en';
import { es, type Textos } from './es';
import type { Idioma } from './idiomas';

export * from './idiomas';
export type { Textos };

const TEXTOS: Record<Idioma, Textos> = { es, en };

/** Textos de la interfaz en un idioma. */
export const textos = (idioma: Idioma): Textos => TEXTOS[idioma];
