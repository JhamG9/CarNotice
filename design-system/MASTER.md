# Sistema de diseño de Garash

Resumen de trabajo para las próximas sesiones. La fuente de verdad es `CLAUDE.md`: si algo de aquí lo contradice, gana `CLAUDE.md` y este archivo se corrige.

La skill `ui-ux-pro-max` se usa solo para UX, accesibilidad y pautas de Astro. Su paleta, sus fuentes y su patrón de página no se aplican.

## Dónde vive cada cosa

| Qué | Archivo |
|---|---|
| Tokens de color y escala tipográfica | `src/styles/global.css` |
| Carga de fuentes (Fontsource) | `src/layouts/Base.astro` |
| Categorías (clave, nombre, slug, eléctrica) | `src/data/categorias.ts` |
| Rutas y slugs | `src/lib/rutas.ts` |
| Esquema de las notas | `src/content.config.ts` |

## Color

Variables CSS en `:root`. El tema claro es el predeterminado siempre; el oscuro se activa solo con `data-theme="dark"` en `<html>`, nunca por `prefers-color-scheme`. En Tailwind se usan como `bg-surface`, `text-muted`, `border-border`, `text-accent`, `text-ev`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F7F6F2` | `#0F1114` | Fondo de página |
| `--surface` | `#FFFFFF` | `#181B20` | Cabecera, pie, cajas |
| `--ink` | `#14171C` | `#ECEAE4` | Texto |
| `--heading` | `#14284B` | `#ECEAE4` | Titulares, logo y nombre del autor |
| `--muted` | `#5A616B` | `#9BA1AA` | Resúmenes, fechas, metadatos |
| `--border` | `#E3E1DA` | `#2A2E35` | Líneas y bordes |
| `--accent` | `#C23508` | `#FF6A33` | Categoría, enlaces, botón principal |
| `--accent-bright` | `#E8430A` | `#FF6A33` | Solo decoración y texto grande |
| `--ev` | `#0B7A5B` | `#35C69A` | Solo la etiqueta "Eléctrico" |
| `--tint` | `#E4E9F1` | `#1F242C` | Fondo de los marcadores de imagen |
| `--on-accent` | `#FFFFFF` | `#0F1114` | Texto sobre `--accent` |

`--on-accent` no está en la lista de `CLAUDE.md`; nombra la regla que allí va como comentario.

Contraste medido (mínimo AA 4.5:1):

| Combinación | Claro | Oscuro |
|---|---|---|
| `--ink` sobre `--bg` | 16.61 | 15.72 |
| `--muted` sobre `--bg` | 5.78 | 7.27 |
| `--accent` sobre `--bg` | 5.10 | 6.63 |
| `--ev` sobre `--bg` | 4.92 | 8.73 |
| `--on-accent` sobre `--accent` | 5.52 | 6.63 |

`--accent-bright` sobre `--surface` da 4.01 en claro: por eso no se usa en texto pequeño.

## Cambio de tema

- Botón en la cabecera, a la derecha del menú: `src/components/BotonTema.tsx`. Muestra una luna en claro y un sol en oscuro, con `aria-label` según el tema al que cambia.
- Guarda la elección en `localStorage` con la clave `tema` (`light` o `dark`).
- Un script en línea en el `<head>` de `Base.astro` pone `data-theme="dark"` antes del primer pintado, para que no parpadee.
- El icono lo decide el CSS con la variante `dark:` de Tailwind, redefinida para leer `data-theme`.

## Tipografía

Utilidades propias definidas con `@utility`, así que aceptan variantes (`md:t-articulo`).

| Clase | Elemento | Fuente | Tamaño / interlineado | Peso |
|---|---|---|---|---|
| `t-articulo` | Titular de artículo y nota destacada | Poppins | 37 / 48 px | 600 |
| `t-seccion` | Título de sección, mayúsculas | Poppins | 32 / 35 px | 700 |
| `t-tarjeta` | Titular de tarjeta | Poppins | 26 / 29 px | 700 |
| `t-lateral` | Título de barra lateral | Poppins | 22 / 24 px | 700 |
| `t-texto` | Texto de artículo y resumen | Lato | 20 / 30 px | 400 |
| `t-menu` | Menú, mayúsculas, espaciado 1.5 px | Lato | 14 px | 700 |
| `t-meta` | Categoría y fecha | Lato | 12 px | 400 |
| `t-item` | Ítems de listas en barra lateral | Lato | 17 / 24 px | 700 |

`t-item` no está en la tabla de `CLAUDE.md`; se añadió para las listas de la barra lateral.

## Estructura

- Contenedor de página: 1240 px (`max-w-pagina`). Columna de artículo: 710 px (`max-w-articulo`).
- Márgenes laterales: 16 px en móvil, 24 px desde 768 px.
- Portada: lista a la izquierda y barra lateral de 320 px a la derecha desde 1024 px. Por debajo, la barra lateral baja al final.
- Menú en una línea desde 768 px; por debajo, menú desplegable (`MenuMovil.tsx`).
- Islas de React: `MenuMovil.tsx`, `BotonTema.tsx` y `Compartir.tsx`.
- Tarjeta de nota: foto arriba en móvil; foto a la izquierda (2/5) y texto a la derecha (3/5) desde 768 px.
- Fotos siempre en 16:9 (`aspect-video`), con `<Image />` de Astro, a través de `ImagenNota.astro`.
- Nota sin foto: `ImagenNota.astro` pinta un marcador 16:9 con fondo `--tint`, borde `--border` e icono en `--muted`.
- Fotos reales: van en `src/assets/notas/` (ver su `LEEME.md`) y se enlazan con `imagen` e `imagenAlt`. `imagen` es opcional; si está, `imagenAlt` es obligatorio.

## Reglas de componentes

- Un solo `h1` por página. En la portada es el logo; en las demás, el titular.
- Jerarquía en la portada: nota destacada y títulos de bloque en `h2`, tarjetas en `h3`.
- Todos los titulares van en `--heading`. Sus enlaces usan `enlace-titular`: sin subrayado; al pasar el cursor cambian a `--accent`.
- Barra corta de 32 × 3 px en `--accent-bright`: bajo la categoría de cada nota y bajo los títulos de la barra lateral (utilidad `barra-corta`).
- Pie de tarjeta (`PieNota.astro`): "Por" y autor en `--heading`, fecha en `--muted`, y enlace "Leer nota" con flecha en `--accent`. Ese enlace repite el del titular, así que va con `aria-hidden` y fuera del orden de tabulación.
- Menú: el ítem de la sección activa lleva `aria-current="page"` y una línea inferior de 2 px en `--accent`. Se deduce de la URL o de la prop `seccionActiva` de `Base.astro`. El menú incluye "Inicio".
- `enlace` (cambio a `--accent` al pasar el cursor) queda para menú, categorías y enlaces que no son titulares.
- La categoría se pinta siempre con `--accent`. La etiqueta "Eléctrico" (en `--ev`) aparece junto a ella si la categoría es eléctrica o si la nota lleva `electrico: true`.
- Toda la tarjeta es clicable por el enlace del titular; la categoría es un enlace aparte.
- Área táctil mínima de 44 px en enlaces y botones.
- Foco visible con contorno de 2 px en `--accent`.
- Transiciones de 150 ms solo en color; se anulan con `prefers-reduced-motion`.
- Titulares con `text-wrap: balance` y sin `word-break: break-all`.
- Resumen de tarjeta recortado a 3 líneas.

## Página de artículo

Plantilla: `src/pages/es/notas/[slug].astro`. Genera una página por cada nota de la colección.

- Encabezado, imagen, cuerpo, etiquetas, compartir y relacionadas van en una columna de 710 px (`max-w-articulo`), dentro de la misma rejilla de la portada (barra lateral de 320 px desde 1024 px).
- Titular (`h1`): `t-articulo` (37 / 48) desde 768 px; 30 / 38 en móvil. El logo deja de ser `h1`.
- Línea de datos: "Por" y autor en `--heading`, fecha y tiempo de lectura (220 palabras por minuto, mínimo 1), a 14 px en `--muted`.
- Imagen principal: `<figure>` con `ImagenNota` y `<figcaption>` con `imagenPie` y "Foto: `imagenCredito`".
- Cuerpo: clase `cuerpo-nota` en `global.css`. Da estilo al HTML del Markdown:

| Elemento | Estilo |
|---|---|
| Párrafo | Lato 20 / 30 |
| Subtítulo `h2` | Poppins 26 / 32, peso 700, en `--heading` |
| Subtítulo `h3` | Poppins 22 / 28, peso 700, en `--heading` |
| Listas | Viñetas y números en `--accent-bright` |
| Cita | Barra izquierda de 3 px en `--accent-bright`, Poppins 22 / 32 peso 600; el segundo párrafo es la atribución, a 15 px en `--muted` |
| Imagen intermedia | Ancho completo de la columna; el pie es una línea en cursiva justo debajo, en el mismo párrafo |
| Tabla | 17 / 24; encabezado con línea de 2 px en `--heading`; en pantallas angostas se desplaza dentro de su caja |
| Enlace | `--accent`, subrayado |

- Compartir (`Compartir.tsx`, isla): WhatsApp, X, Facebook y "Copiar enlace", como botones de texto con borde.
- Notas relacionadas: `notasRelacionadas()` en `src/lib/notas.ts`. Primero las de la misma categoría; si son menos de 3, completa con las más recientes. Tres columnas desde 768 px.
- Menú: marca la categoría de la nota con `seccionActiva`.
- SEO: `Base.astro` pone título, descripción, canónica, Open Graph y `twitter:card`. La nota añade `article:*` y el JSON-LD `NewsArticle` por el slot `head`. `og:image` solo sale si la nota tiene foto.
- El dominio se define en `astro.config.mjs` (`SITIO`). Hoy es un marcador (`https://www.example.com`) y hay que cambiarlo por el real.

## Página de sección

Plantilla compartida: `src/layouts/Seccion.astro`. La usan `src/pages/es/categoria/[slug]/[...page].astro` y `src/pages/es/etiqueta/[slug]/[...page].astro`.

- Encabezado: `h1` en `t-seccion` con `barra-corta`, descripción en `t-texto` y conteo de notas a 14 px. Las etiquetas llevan el antetítulo "Etiqueta".
- La descripción de cada categoría está en `src/data/categorias.ts`. La de las etiquetas se genera sola.
- Primera página: la nota más reciente va con `NotaDestacada` y el resto con `TarjetaNota` (`nivel="h2"`, porque cuelgan directo del `h1`). Las demás páginas solo llevan tarjetas.
- Paginación: `NOTAS_POR_PAGINA = 10` en `src/lib/notas.ts`. El parámetro de la ruta debe llamarse `page` (lo exige `paginate()` de Astro). Los enlaces "Anterior" y "Siguiente" solo aparecen si hay más de una página.
- SEO: título "Nombre | Garash" o "Nombre, página 2 | Garash"; la descripción añade "Página 2 de N". Cada página es su propia canónica y lleva `rel="prev"` y `rel="next"`.
- Estado vacío: mensaje y botón principal "Ir a la portada". Una categoría sin notas sigue generando su página; una etiqueta sin notas no existe.
- Etiquetas: se agrupan por slug con `obtenerEtiquetas()`.
- 404: `src/pages/404.astro`. Número "404" grande en `--accent-bright` (decorativo, oculto a lectores de pantalla), `h1`, botón principal a la portada, lista de secciones y las 3 notas más recientes. Usa `sinIndexar` de `Base.astro`: lleva `noindex` y no declara URL canónica.

## URL

Todo bajo prefijo de idioma. Por ahora solo existe `/es/`, y `/` redirige ahí.

| Página | Ruta | Estado |
|---|---|---|
| Portada | `/es/` | Construida |
| Nota | `/es/notas/<slug>/` | Construida |
| Categoría | `/es/categoria/<slug>/` y `/es/categoria/<slug>/2/` | Construida |
| Etiqueta | `/es/etiqueta/<slug>/` y `/es/etiqueta/<slug>/2/` | Construida |
| 404 | `/404.html` | Construida |

El slug de la nota es el nombre de su archivo Markdown.
