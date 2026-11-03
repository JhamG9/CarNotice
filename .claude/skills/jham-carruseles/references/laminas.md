# carrusel.json

```json
{
  "titulo": "Más autonomía en Colombia",
  "estilo": "noche",
  "etiqueta": "Ranking",
  "credito": "Datos: fichas del comparador de mejorelectrico.com",
  "laminas": [
    { "tipo": "portada", "titulo": "Los 5 eléctricos / con *más autonomía* / en Colombia", "subtitulo": "Cifras WLTP de los carros del comparador.", "imagenes": ["vehiculo:zeekr-7x-premium-rwd-2026-co"] },
    { "tipo": "ranking", "puesto": 5, "nombre": "Zeekr X", "detalle": "Premium RWD", "imagen": "vehiculo:zeekr-x-premium-rwd-2026-co", "medida": "Autonomía WLTP", "valor": "440", "unidad": "km", "barra": 0.72, "notas": ["Batería de 69 kWh"], "credito": "Foto: User3204, CC BY-SA 4.0" },
    { "tipo": "cierre", "titulo": "Compara *cualquier* / carro", "texto": "Más de 100 versiones con su ficha completa.", "accion": "Guarda este ranking" }
  ]
}
```

## Campos generales

| Campo | |
|---|---|
| `estilo` | `noche` (el de los reels). Los colores están en `scripts/estilos.mjs`. |
| `marca` | Nombre arriba a la derecha. Por defecto «Mejor Eléctrico»; `""` lo quita. |
| `web` | Dirección grande del `cierre`. Por defecto `mejorelectrico.com`; `""` la quita. |
| `etiqueta` | Píldora verde arriba a la izquierda en todas las láminas («Ranking», «Guía», «Comparación»). Una lámina puede cambiarla con su propia `etiqueta` o quitarla con `""`. |
| `credito` | Texto pequeño abajo de la portada. Cada lámina puede llevar el suyo (`credito`) con el autor y la licencia de su foto. |
| `laminas` | De 2 a 10. |

En todos los textos, `*así*` sale en verde y, en los títulos, `/` parte la línea. Pártelos a mano: un título se lee
mejor en líneas cortas de 2 o 3 palabras.

**Imágenes:** `"vehiculo:<slug>"` es la foto del comparador (`public/vehicles/<slug>.webp`). Una ruta relativa se
lee desde la carpeta del carrusel; también sirve una absoluta.

Todas las láminas llevan arriba la marca y abajo el número (3/7) y «Desliza →», menos la última.

## Tipos de lámina

| Tipo | Campos | Para |
|---|---|---|
| `portada` | `titulo`, `subtitulo`, `imagenes` (1 a 3) o `imagen` | La promesa del carrusel. Título enorme. |
| `ranking` | `puesto`, `nombre`, `detalle`, `imagen`, `medida`, `valor`, `unidad`, `barra` (0 a 1), `notas` (lista corta) | Un puesto de una lista: un carro, un plato, un juguete. `medida`, `valor` y `barra` se omiten si el ranking no tiene cifra. |
| `comparacion` | `titulo`, `a` y `b` (`nombre`, `detalle`, `imagen`), `filas` (`medida`, `a`, `b`, `unidad`, `gana`: `"a"`, `"b"` o nada) | Dos cosas frente a frente. |
| `dato` | `titulo`, `valor`, `unidad`, `texto`, `imagen` | Una cifra enorme en verde y qué significa. |
| `lista` | `titulo`, `items` (`titulo`, `texto`) | Pasos o consejos numerados, 3 a 5 por lámina. |
| `texto` | `titulo`, `texto`, `imagen` | Una idea explicada en 2 o 3 frases. |
| `cierre` | `titulo`, `texto`, `accion`, `web` (por defecto mejorelectrico.com) | La acción final. |

Los campos que no necesites se omiten. Si una foto ocupa demasiado y el texto no cabe, `render.mjs` lo avisa:
acorta el texto o quita la foto de esa lámina.

## Cuánto texto cabe

- Título de `portada` y `cierre`: 3 líneas de unas 14 letras.
- Título de las demás: 2 o 3 líneas de unas 20 letras.
- `texto` y `parrafo`: unas 45 palabras sin foto, unas 25 con foto.
- `notas` de un ranking: 1 o 2, de una línea cada una.
- `lista`: 3 a 5 ítems; con texto debajo de cada uno, 3 o 4.
