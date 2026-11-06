import { LOCALE, type Idioma } from '../i18n/idiomas';

const formatos = new Map<Idioma, Intl.DateTimeFormat>();

/** Fecha larga en el idioma de la página: "5 de noviembre de 2026", "November 5, 2026". */
export function formatearFecha(fecha: Date, idioma: Idioma = 'es') {
  let formato = formatos.get(idioma);
  if (!formato) {
    formato = new Intl.DateTimeFormat(LOCALE[idioma], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    formatos.set(idioma, formato);
  }
  return formato.format(fecha);
}

export const fechaISO = (fecha: Date) => fecha.toISOString().slice(0, 10);
