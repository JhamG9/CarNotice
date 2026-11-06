/**
 * Textos de la interfaz en español. Cada texto nuevo de la interfaz se escribe aquí y en en.ts
 * (TypeScript avisa si falta en alguno). Los textos del comparador y de las fichas siguen dentro de
 * sus componentes hasta que se traduzcan esas páginas.
 */
export const es = {
  saltarAlContenido: 'Saltar al contenido',
  cabecera: {
    logoAria: 'Mejor Eléctrico, inicio',
    navAria: 'Principal',
    inicio: 'Inicio',
    carros: 'Carros',
    comparador: 'Comparador',
    blog: 'Blog y noticias',
    /** Enlace a la otra versión de la página. */
    otroIdioma: 'EN',
    otroIdiomaAria: 'Read in English',
  },
  menuMovil: { abrir: 'Menú', cerrar: 'Cerrar', navAria: 'Categorías' },
  tema: { aClaro: 'Cambiar a tema claro', aOscuro: 'Cambiar a tema oscuro' },
  pie: {
    lema: 'Revista de carros: noticias, lanzamientos, eléctricos y pruebas para quienes disfrutan manejar.',
    carros: 'Carros',
    carrosAria: 'Carros en el pie',
    fichas: 'Fichas técnicas',
    comparador: 'Comparador',
    categorias: 'Categorías',
    categoriasAria: 'Categorías en el pie',
    sitio: 'Sobre el sitio',
    nosotros: 'Nosotros',
    avisoLegal: 'Aviso legal',
    privacidad: 'Política de privacidad',
    cookies: 'Cookies',
    derechos: 'Todos los derechos reservados.',
  },
  lateral: {
    aria: 'Barra lateral',
    recientes: 'Lo más reciente',
    categorias: 'Categorías',
    etiquetas: 'Etiquetas',
    notas: (n: number) => `${n} notas`,
  },
  nota: {
    por: 'Por',
    leerNota: 'Leer nota',
    minutos: (n: number) => `${n} min de lectura`,
    foto: 'Foto:',
    electrico: 'Eléctrico',
    fichas: 'Ficha técnica completa',
    enlaceFicha: (modelo: string) => `${modelo}: versiones, autonomía y rivales →`,
    etiquetas: 'Etiquetas',
    compartir: 'Compartir',
    relacionadas: 'Notas relacionadas',
  },
  compartir: {
    /** {red} es el nombre de la red: va como texto porque las islas de React no reciben funciones. */
    en: 'Compartir en {red} (abre una pestaña nueva)',
    copiar: 'Copiar enlace',
    copiado: 'Enlace copiado',
  },
  portada: {
    titulo: 'Mejor Eléctrico: noticias y comparador de carros',
    descripcion:
      'Noticias, lanzamientos, carros eléctricos y pruebas de manejo, en español. Y un comparador para ver dos carros lado a lado.',
    blog: 'Blog y noticias',
    verTodas: 'Ver todas las notas',
  },
  seccion: {
    blog: 'Blog y noticias',
    blogDescripcion: 'Todas las notas de Mejor Eléctrico: lanzamientos, mercado, eléctricos y pruebas de manejo.',
    etiqueta: 'Etiqueta',
    etiquetaDescripcion: (nombre: string) => `Todas las notas de Mejor Eléctrico con la etiqueta "${nombre}".`,
    totalNotas: (n: number) => (n === 1 ? '1 nota' : `${n} notas`),
    paginaDe: (pagina: number, total: number) => `Página ${pagina} de ${total}`,
    sufijoPagina: (pagina: number) => `, página ${pagina}`,
    paginaDeSeo: (pagina: number, total: number) => `Página ${pagina} de ${total}.`,
    vacioTitulo: 'Todavía no hay notas aquí.',
    vacioTexto: 'Estamos preparando contenido para esta sección. Mientras tanto, mira lo más reciente en la portada.',
    irPortada: 'Ir a la portada',
    paginacion: 'Paginación',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    filtroAria: 'Categorías del blog',
    todas: 'Todas',
  },
};

/** Forma que debe cumplir cada idioma: los mismos textos, con el mismo tipo. */
export type Textos = typeof es;
