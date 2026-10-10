const formato = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatearFecha = (fecha: Date) => formato.format(fecha);
export const fechaISO = (fecha: Date) => fecha.toISOString().slice(0, 10);
