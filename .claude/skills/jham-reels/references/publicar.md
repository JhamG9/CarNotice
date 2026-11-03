# Portada y textos para publicar

## Portada

Se rellena en `plan.json`:

```json
"portada": {
  "etiqueta": "TRUCOS",
  "lineas": ["3 TRUCOS", "*DEL SÚPER*", "QUE NADIE USA"],
  "icono": "shopping-cart",
  "pegatina": "−50 € al mes",
  "pose": "sorpresa",
  "oscura": false
}
```

| Campo | |
|---|---|
| `lineas` | 1–4 líneas; la primera sale enorme y las demás más pequeñas. `*así*` va en color de acento. La línea más larga decide el tamaño de todo el título: 10–12 letras por línea como mucho (el resumen avisa si te pasas), para que se lea en la miniatura del perfil. |
| `etiqueta` | píldora pequeña encima del título (tema o serie). |
| `icono` o `imagenes` | un icono grande o hasta 4 imágenes en abanico debajo del título. |
| `pegatina` | etiqueta inclinada del color de acento (un dato, un precio, «gratis»). |
| `pose` | el personaje abajo a la izquierda (si hay poses). En fondos oscuros lleva una luz detrás para que no parezca recortado. |
| `oscura` | true: fondo oscuro con el texto claro, para que en la cuadrícula se distinga de la anterior. Solo en estilos claros (en uno oscuro no hace nada). |

`node render.mjs portada` crea `salida/portada.png` (1080×1920) y `salida/portada_check.png` con tres vistas:
la portada entera, el recorte 3:4 que enseña la cuadrícula del perfil de Instagram (solo la franja central, de
y=240 a y=1680) y la miniatura pequeña. El título y la cara tienen que verse en las tres.

Ideas que funcionan: el número o la promesa del gancho en grande, una sola palabra en color de acento, el personaje
con cara de sorpresa mirando al título. Alterna fondo claro y oscuro entre reels para que la cuadrícula no sea monótona.

## Textos

Dáselos al usuario en el chat, listos para copiar, en bloques separados.

**Instagram (descripción):**
- La primera línea es lo único que se ve sin pulsar «más»: repite o completa el gancho (≤125 caracteres).
- 3–6 líneas cortas con lo que aprende quien lo vea, con algún emoji si encaja con la cuenta.
- La llamada a la acción del vídeo, igual («Comenta LISTA y te la mando por privado»).
- 3–5 hashtags del tema, mezclando generales y concretos. No 30.

**TikTok (descripción):**
- Empieza con las palabras que alguien buscaría («trucos para ahorrar en el súper»): TikTok funciona mucho como
  buscador.
- 1–3 líneas, la llamada a la acción y 3–5 hashtags.

**Título corto** (para la portada en TikTok o para YouTube Shorts, si lo sube allí): ≤60 caracteres, con la promesa.

**Fuentes:** añade una línea con las fuentes de los datos y de las imágenes, sacadas de `salida/FUENTES.md` y del guion.
Antes de entregar, recuerda al usuario lo que hay que volver a comprobar (datos que pueden cambiar) y los permisos de
uso de cada recurso (references/recursos.md).

## Al subirlo

- Sube `reel.mp4` tal cual (1080×1920, H.264, AAC): no hace falta convertirlo.
- Instagram: «Editar portada» → «Añadir desde la galería» → `portada.png`.
- TikTok: «Editar portada» → sube `portada.png` desde la galería antes de publicar (después ya no se puede cambiar).
- El vídeo ya lleva música propia (scripts/musica.py). Si prefiere otra, borra `public/musica.wav` y renderiza otra vez.
- Si la voz está hecha con IA, que active la etiqueta de contenido generado con IA al publicar (las dos apps la
  piden para voces sintéticas realistas).

## Publicar en Facebook e Instagram

Sale directo por la API de Meta, con la app `Mejor Electrico Reels`, en la página `facebook.com/mejorelectrico` y en
`@mejorelectrico`. Por defecto va a las dos; `--solo-facebook` o `--solo-instagram` limitan el destino.

```bash
node .claude/skills/jham-reels/scripts/publicar-meta.mjs verificar
node .claude/skills/jham-reels/scripts/publicar-meta.mjs borrador ~/reel/salida/reel.mp4 "Descripción"
node .claude/skills/jham-reels/scripts/publicar-meta.mjs publicar ~/reel/salida/reel.mp4 "Descripción" --confirmo
```

- Muestra primero el vídeo y el texto. `publicar --confirmo` se usa solo cuando la persona aprobó ese reel en el chat.
- `borrador` sirve para probar: en Facebook queda como borrador y en Instagram sube el vídeo sin publicarlo. Nada se ve
  en público.
- En Facebook, Meta pide 9:16, de 3 a 90 segundos, y permite 30 publicaciones por API cada 24 horas.
- En Instagram, la subida por API falló el 2026-10-31 con `ProcessingFailedError` en todos los intentos con reels de 58 y 85 segundos, y a veces con uno de 44 con el mismo archivo. Pasó con fragmentos de hasta 45 segundos y con un vídeo sintético de 59, y reels reales de 57 y 58 segundos salieron al séptimo y al primer intento. Nada de 60 segundos o más ha pasado: un reel de 89,6 segundos falló 30 de 30 intentos el 2026-11-01. No se debe al peso, al formato ni al tipo de token, y la causa sigue sin aclararse. Hasta 59 segundos, el script reintenta solo hasta 15 veces (`--intentos-ig=N`); si se agotan, no publica. Si ya salió en Facebook, repite con `--solo-instagram`. Un reel más largo se sube desde la app.
- `--ia` marca el reel de Facebook como generado con IA y `--portada=archivo.png` sube su portada. En Instagram, `--miniatura-ms=1800` solo elige un fotograma del vídeo como portada; la etiqueta de IA y una portada propia se ponen en la app.
- Si el token deja de servir, Claude abre `scripts/meta-token.mjs` y la persona pega en `http://127.0.0.1:4390/` un token
  nuevo del Explorador y la clave secreta de la app. Claude no escribe ninguno de los dos. En el Explorador se marcan
  `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`,
  `business_management`, `read_insights` e `instagram_manage_insights` (estos dos, para leer las estadísticas de cada
  reel), y en la ventana de Meta solo la página y el Instagram de Mejor Eléctrico.

## Publicar en YouTube Shorts

Sale directo por la API de YouTube, con el proyecto de Google Cloud `mejor-electrico-reels`, en
`youtube.com/@mejorelectrico`. Va en la categoría Autos y vehículos, en español.

```bash
node .claude/skills/jham-reels/scripts/publicar-youtube.mjs verificar
node .claude/skills/jham-reels/scripts/publicar-youtube.mjs borrador ~/reel/salida/reel.mp4 "Título #Shorts" "Descripción"
node .claude/skills/jham-reels/scripts/publicar-youtube.mjs publicar ~/reel/salida/reel.mp4 "Título #Shorts" "Descripción" --ia --portada=$HOME/reel/salida/portada.png --confirmo
```

- Título de 100 caracteres como mucho: el gancho, sin emojis, terminado en `#Shorts`. La descripción puede ser la
  misma de Instagram.
- `--ia` declara contenido sintético (la voz es generada). `borrador` lo sube privado.
- Hasta que Google apruebe la auditoría del proyecto (formulario «YouTube API Services - Audit and Quota Extension»),
  todo lo subido por API queda privado aunque se pida público: se pasa a público en YouTube Studio.
- La portada propia exige el canal verificado con un teléfono (YouTube Studio → Configuración → Canal → Funciones
  aptas). Sin eso, el Short sale igual y la portada falla con un aviso.
- La cuota diaria de la API (10.000 unidades) alcanza para unas 6 subidas al día.
- Si la conexión deja de servir, se repite `scripts/youtube-token.mjs`. Con `--json=` lee el archivo
  `client_secret_….json` que da Google al crear un cliente de escritorio, sin pegar nada; ese archivo se borra después.

## «Comenta PALABRA» con respuesta automática

- **Instagram**: herramientas como ManyChat (socio oficial de Meta) mandan un mensaje privado a quien comente una
  palabra. Se configura una vez por palabra y funciona solo.
- **TikTok**: no deja escribir por privado a quien comenta, y su API de mensajes no está disponible en el Espacio
  Económico Europeo, Suiza ni Reino Unido. Alternativa: enlace en la bio (una cuenta de empresa, que es gratis,
  permite ponerlo sin llegar a 1.000 seguidores), un comentario fijado que lleve a la bio, o pedir que escriban la
  palabra por mensaje y contestar a mano.
- Antes de publicar, comprueba que lo que se promete existe y está listo para enviar.
