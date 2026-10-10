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

Variables CSS en `:root`, con modo oscuro por `prefers-color-scheme`. En Tailwind se usan como `bg-surface`, `text-muted`, `border-border`, `text-accent`, `text-ev`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F7F6F2` | `#0F1114` | Fondo de página |
| `--surface` | `#FFFFFF` | `#181B20` | Cabecera, pie, cajas |
| `--ink` | `#14171C` | `#ECEAE4` | Titulares y texto |
| `--muted` | `#5A616B` | `#9BA1AA` | Resúmenes, fechas, metadatos |
| `--border` | `#E3E1DA` | `#2A2E35` | Líneas y bordes |
| `--accent` | `#C23508` | `#FF6A33` | Categoría, enlaces, botón principal |
| `--accent-bright` | `#E8430A` | `#FF6A33` | Solo decoración y texto grande |
| `--ev` | `#0B7A5B` | `#35C69A` | Solo contenido eléctrico o híbrido |
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
- Menú en una línea desde 768 px; por debajo, menú desplegable (`MenuMovil.tsx`, única isla de React).
- Tarjeta de nota: foto arriba en móvil; foto a la izquierda (2/5) y texto a la derecha (3/5) desde 768 px.
- Fotos siempre en 16:9 (`aspect-video`), con `<Image />` de Astro.

## Reglas de componentes

- Un solo `h1` por página. En la portada es el logo; en las demás, el titular.
- Jerarquía en la portada: nota destacada y títulos de bloque en `h2`, tarjetas en `h3`.
- La categoría se pinta con `--accent`, salvo las categorías eléctricas, que usan `--ev`.
- Toda la tarjeta es clicable por el enlace del titular; la categoría es un enlace aparte.
- Área táctil mínima de 44 px en enlaces y botones.
- Foco visible con contorno de 2 px en `--accent`.
- Transiciones de 150 ms solo en color; se anulan con `prefers-reduced-motion`.
- Titulares con `text-wrap: balance` y sin `word-break: break-all`.
- Resumen de tarjeta recortado a 3 líneas.

## URL

Todo bajo prefijo de idioma. Por ahora solo existe `/es/`, y `/` redirige ahí.

| Página | Ruta | Estado |
|---|---|---|
| Portada | `/es/` | Construida |
| Nota | `/es/notas/<slug>/` | Pendiente |
| Categoría | `/es/categoria/<slug>/` | Pendiente |
| Etiqueta | `/es/etiqueta/<slug>/` | Pendiente |

El slug de la nota es el nombre de su archivo Markdown.
