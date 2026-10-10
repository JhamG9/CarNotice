# Revista de carros

Sitio web tipo revista de carros: últimas noticias, lanzamientos, eléctricos y de combustión. Más adelante tendrá un comparador de carros.

## Alcance actual

- Fase 1 (ahora): la revista. Portada, página de artículo y página de sección.
- Fase 2 (después): el comparador. No construir nada del comparador todavía.

## Público

- Personas de 25 a 40 años con gusto por los vehículos.
- Audiencia general hispanohablante, no solo Colombia.
- Todo el texto de la interfaz va en español ("Cargar más", no "Load more").

## Stack

- Astro para las páginas (contenido renderizado en servidor, pensado para SEO).
- React solo para componentes interactivos (islas).
- Fuentes autoalojadas con Fontsource, no desde el CDN de Google.

## Estructura de página

Referencia: elcarrocolombiano.com. Se copia la estructura, no el aspecto.

- Portada: las notas aparecen de inmediato, sin banner ni publicidad antes del contenido.
- Lista de notas a la izquierda y barra lateral a la derecha.
- Tarjeta de nota: foto, categoría, titular, resumen de 2 o 3 líneas y fecha.
- Barra lateral: "Lo más reciente", categorías y etiquetas.
- Artículo: columna de texto de 710 px de ancho máximo.
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

## Color

Base clara por defecto, con modo oscuro. Un solo color de acento (naranja quemado) y un verde reservado para señalar contenido eléctrico. Las fotos ponen el resto del color.

```css
:root {
  --bg: #F7F6F2;            /* fondo de página, blanco cálido */
  --surface: #FFFFFF;       /* tarjetas y cajas */
  --ink: #14171C;           /* titulares y texto */
  --muted: #5A616B;         /* resúmenes, fechas, metadatos */
  --border: #E3E1DA;        /* líneas y bordes */
  --accent: #C23508;        /* enlaces, categorías, botones (texto blanco encima) */
  --accent-bright: #E8430A; /* solo decoración y texto grande, no texto pequeño */
  --ev: #0B7A5B;            /* etiqueta "Eléctrico" y datos de eléctricos */
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0F1114;
    --surface: #181B20;
    --ink: #ECEAE4;
    --muted: #9BA1AA;
    --border: #2A2E35;
    --accent: #FF6A33;        /* texto oscuro (#0F1114) encima en botones */
    --accent-bright: #FF6A33;
    --ev: #35C69A;
  }
}
```

Reglas de uso:

- El acento se usa poco: categoría, enlaces, un botón principal por pantalla.
- El verde `--ev` no es decorativo: solo marca contenido eléctrico o híbrido.
- No usar rojo como color de marca ni fondos degradados.
- Todas las combinaciones de texto de la tabla cumplen contraste AA (4.5:1 o más).

## Reglas de calidad

- Un solo `h1` por página.
- Los titulares nunca se parten a mitad de palabra: nada de `word-break: break-all`, y probar columnas angostas.
- Los ítems del menú no deben ocupar más de una línea; si no caben, van al menú desplegable.
- Probar cada plantilla a 375, 768, 1024 y 1440 px.
- Fotos con proporción fija por tipo de tarjeta, para que la lista no salte al cargar.
- Fotos de vehículos: salas de prensa oficiales de los fabricantes, no fotos de stock.
