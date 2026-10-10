# Revista de carros

Sitio web tipo revista de carros: últimas noticias, lanzamientos, eléctricos y de combustión. Más adelante tendrá un comparador de carros.

## Alcance actual

- Fase 1 (construida): la revista. Portada, página de artículo, página de sección (categorías y etiquetas) y página 404.
- Fase 2 (después): el comparador. No construir nada del comparador todavía.

## Público

- Personas de 25 a 40 años con gusto por los vehículos.
- Audiencia internacional, no solo Colombia. El sitio tendrá cinco idiomas: español, inglés, francés, alemán y portugués. El español es el primero y, por ahora, el único construido.
- En la versión en español, todo el texto de la interfaz va en español ("Cargar más", no "Load more").
- Los textos de interfaz están escritos dentro de los componentes. Para sumar idiomas habrá que sacarlos a un archivo de traducciones.
- Idioma y país son cosas distintas: el prefijo `/es/` indica el idioma de la página, no de dónde viene la noticia.

## Stack

- Astro para las páginas (contenido renderizado en servidor, pensado para SEO).
- React solo para componentes interactivos (islas).
- Fuentes autoalojadas con Fontsource, no desde el CDN de Google.
- Tailwind 4 para los estilos, con los tokens de este archivo.

## Reglas de trabajo

- Páginas y layouts en `.astro`; componentes interactivos en `.tsx`. No crear páginas `.md` ni `.mdx` dentro de `src/pages`.
- El contenido de las notas va en Markdown dentro de la content collection `notas`. Las notas solo llevan texto y datos; el diseño lo pone la plantilla `.astro`.
- El slug de una nota es el nombre de su archivo, no su titular.
- Las categorías son fijas (Lanzamientos, Noticias, Eléctricos y Pruebas) y dicen qué tipo de nota es. Los países van como etiqueta ("Colombia", "Alemania"), no como categoría, y solo cuando el país es el tema de la nota.
- La skill `ui-ux-pro-max` (en `.claude/skills/`) se usa para UX, accesibilidad y pautas de Astro. Su paleta, sus fuentes y su patrón de página no se usan: si contradice este archivo, gana este archivo. No usar su `--persist`.
- El detalle de diseño de cada plantilla está en `design-system/MASTER.md`.

## Entorno de desarrollo

- El puerto 4321 lo ocupa otro proyecto. Garash corre en el 4330, en segundo plano:

```bash
npx astro dev --background --port 4330
```

- Se detiene con `npx astro dev stop` y los registros se ven con `npx astro dev logs`.
- Tras cambiar el esquema o mover notas, el servidor puede mostrar datos viejos (campos vacíos o la colección vacía). Se arregla deteniéndolo, borrando `.astro` y `node_modules/.astro`, y arrancándolo de nuevo.
- No compilar (`npm run build`) mientras el servidor de desarrollo está corriendo: detenerlo primero.
- En las rutas paginadas el parámetro del archivo debe llamarse `page` (`[...page].astro`); Astro falla con cualquier otro nombre.
- `astro check` no está instalado y se queda esperando una confirmación. Para validar, usar `npm run build`.

## Estructura de página

Referencia: elcarrocolombiano.com. Se copia la estructura, no el aspecto.

- Portada: las notas aparecen de inmediato, sin banner ni publicidad antes del contenido.
- Lista de notas a la izquierda y barra lateral a la derecha.
- Tarjeta de nota: foto, categoría, titular, resumen de 2 o 3 líneas, autor (en `--heading`), fecha y enlace "Leer nota" con flecha (en `--accent`).
- Barra lateral: "Lo más reciente", categorías y etiquetas.
- Artículo (`/es/notas/<slug>/`): columna de texto de 710 px de ancho máximo, con la misma barra lateral de la portada, que en celular baja al final.
  - Encabezado: categoría, titular (`h1`), resumen, autor, fecha y tiempo de lectura.
  - Imagen principal a lo ancho de la columna, con pie de foto y crédito.
  - Al final: etiquetas, botones para compartir y "Notas relacionadas" (3 notas de la misma categoría; si no alcanzan, se completa con las más recientes).
  - SEO por nota: título, descripción, URL canónica, Open Graph y datos estructurados `NewsArticle`.
- Sección (`/es/categoria/<slug>/` y `/es/etiqueta/<slug>/`): una sola plantilla para categorías y etiquetas.
  - Encabezado: nombre (`h1`), una línea de descripción y el número de notas.
  - Listado con la tarjeta de la portada y la nota más reciente destacada arriba.
  - Paginación de 10 notas por página (`/2/`, `/3/`...), con enlaces "Anterior" y "Siguiente". Cada página paginada es su propia URL canónica.
  - Estado vacío cuando no hay notas.
- Página 404 con enlaces a la portada y a las secciones.
- Todas las rutas van bajo el prefijo de idioma y terminan en `/`. Por ahora solo existe `/es/`.
- Las categorías van también en el menú superior.

## Tipografía

Dos familias: Poppins para titulares y Lato para todo lo demás.

```bash
npm install @fontsource/poppins @fontsource/lato
```

```js
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
```

| Elemento | Fuente | Tamaño / interlineado | Peso |
|---|---|---|---|
| Titular de artículo (h1) | Poppins | 37 / 48 px | 600 |
| Título de sección | Poppins, mayúsculas | 32 / 35 px | 700 |
| Titular de tarjeta | Poppins | 26 / 29 px | 700 |
| Título de barra lateral | Poppins | 22 / 24 px | 700 |
| Texto de artículo | Lato | 20 / 30 px | 400 |
| Resumen en tarjeta | Lato | 20 / 30 px | 400 |
| Menú | Lato, mayúsculas, espaciado 1.5 px | 14 px | 700 |
| Categoría y fecha | Lato | 12 px | 400 |

Lato no tiene peso 600: usar 400 o 700.

Excepciones a la tabla:

- El titular de artículo baja a 30 / 38 px en celular (menos de 768 px), para que no ocupe media pantalla.
- Los ítems de las listas de la barra lateral usan Lato 17 / 24 px, peso 700 (clase `t-item`).

## Color

Tema claro por defecto siempre, sin importar la preferencia del sistema. El tema oscuro se activa solo con `data-theme="dark"` en `<html>`. Un solo color de acento (naranja quemado) y un verde reservado para señalar contenido eléctrico. Las fotos ponen el resto del color.

```css
:root {
  --bg: #F7F6F2;            /* fondo de página, blanco cálido */
  --surface: #FFFFFF;       /* tarjetas y cajas */
  --ink: #14171C;           /* texto */
  --heading: #14284B;       /* titulares, logo y nombre del autor (azul profundo) */
  --muted: #5A616B;         /* resúmenes, fechas, metadatos */
  --border: #E3E1DA;        /* líneas y bordes */
  --accent: #C23508;        /* enlaces, categorías, botones (texto blanco encima) */
  --accent-bright: #E8430A; /* solo decoración y texto grande, no texto pequeño */
  --ev: #0B7A5B;            /* etiqueta "Eléctrico" y datos de eléctricos */
  --tint: #E4E9F1;          /* fondo de los marcadores de imagen */
  --on-accent: #FFFFFF;     /* texto sobre --accent */
}

:root[data-theme="dark"] {
  --bg: #0F1114;
  --surface: #181B20;
  --ink: #ECEAE4;
  --heading: #ECEAE4;       /* en oscuro, igual que --ink */
  --muted: #9BA1AA;
  --border: #2A2E35;
  --accent: #FF6A33;        /* texto oscuro (#0F1114) encima en botones */
  --accent-bright: #FF6A33;
  --ev: #35C69A;
  --tint: #1F242C;
  --on-accent: #0F1114;
}
```

Reglas de uso:

- El acento se usa poco: categoría, enlaces, un botón principal por pantalla.
- Todos los titulares usan `--heading`. Los titulares enlazados no llevan subrayado y cambian a `--accent` al pasar el cursor.
- La categoría de cada nota va en `--accent`, con una barra corta de 32 × 3 px en `--accent-bright` debajo.
- Los títulos de la barra lateral llevan la misma barra corta debajo, no una línea de ancho completo.
- El menú marca la sección activa con una línea inferior en `--accent`.
- El verde `--ev` no es decorativo: solo se usa en la etiqueta "Eléctrico" (contenido eléctrico o híbrido), nunca en el nombre de la categoría.
- No usar rojo como color de marca ni fondos degradados.
- Todas las combinaciones de texto de la tabla cumplen contraste AA (4.5:1 o más).

Cambio de tema:

- No usar `@media (prefers-color-scheme: dark)`.
- La cabecera lleva, a la derecha del menú, un botón para alternar el tema: icono de sol o luna, con `aria-label`.
- La elección se guarda en `localStorage` (clave `tema`).
- Un script en línea en el `<head>` aplica el tema guardado antes de que la página se pinte, para que no parpadee.

Marcadores de imagen (notas sin foto): fondo `--tint`, borde `--border` e icono en `--muted`, para que se adapten a los dos temas.

## Reglas de calidad

- Un solo `h1` por página.
- Los titulares nunca se parten a mitad de palabra: nada de `word-break: break-all`, y probar columnas angostas.
- Los ítems del menú no deben ocupar más de una línea; si no caben, van al menú desplegable.
- Probar cada plantilla a 375, 768, 1024 y 1440 px.
- Fotos con proporción fija por tipo de tarjeta, para que la lista no salte al cargar.
- Fotos de vehículos: salas de prensa oficiales de los fabricantes, no fotos de stock. Se guardan en `src/assets/notas/` y se enlazan con los campos `imagen` e `imagenAlt` de la nota.
