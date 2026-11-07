---
name: jham-videos
description: Crea vídeos largos horizontales para YouTube (de 8 a 15 minutos, 1920×1080) sobre cualquier tema - carros, productos para perros, zapatos, viajes, finanzas - con guion por capítulos y datos con fuente, imágenes y vídeos oficiales o con licencia libre, voz local, música propia, capítulos de YouTube, miniatura de 1280×720, descripción y subida por la API. Usa el mismo motor de jham-reels en horizontal. Úsala siempre que pidan un vídeo largo, un vídeo para YouTube que no sea Short, un vídeo explicativo, una guía en vídeo o "convertir esta nota en vídeo".
---

# jham-videos

Hace vídeos largos para YouTube de principio a fin: guion por capítulos con datos comprobados, imágenes reales con
crédito, voz local sincronizada palabra a palabra, subtítulos, música propia, capítulos, miniatura y textos para
publicar. Se monta con el motor de `jham-reels` (React + Remotion) en horizontal.

**Sirve para cualquier tema.** Nada del motor es de carros: el tema lo ponen el guion, las fuentes y las imágenes. Si
el pedido es de otro nicho (productos para perros, zapatos, cocina…), se hace igual.

**Comparte con jham-reels**: los scripts de voz, alineado, música, ritmo y revisión (`../jham-reels/scripts/`), el
diccionario de pronunciación (`../jham-reels/assets/voz/pronunciacion.json`), los estilos y el catálogo de escenas
(`../jham-reels/references/escenas.md`). Lo propio de esta skill: la plantilla horizontal (`assets/plantilla`),
`scripts/preparar.py`, `scripts/video.py`, `scripts/capitulos.py` y `scripts/publicar-video.mjs`.

## Dos formatos

| Formato | Para qué | Cómo llega la gente | Guía |
|---|---|---|---|
| `noticia` | Una noticia contada como historia: conflicto, protagonistas, giro y desenlace, con mucho vídeo real. **El que más retiene.** | Inicio y sugerencias de YouTube | `references/noticia.md` |
| `explicativo` (por defecto) | Responder una pregunta que se busca («¿LFP o NMC?») por capítulos. | Búsqueda de YouTube y Google | `references/guion-largo.md` |

Se elige con `"formato"` en el plan. Si piden algo «que enganche», «que retenga» o sobre una noticia, es `noticia`.
`scripts/enganche.py` (lo corre `video.py`) mide con los tiempos reales cuánto es vídeo en movimiento, los tramos sin
un golpe y las escenas quietas, y avisa según las reglas del formato: en `noticia`, dos de cada tres escenas con vídeo,
un golpe cada 40 s como mucho y el gancho en vídeo.

## Cómo es un vídeo de esta skill

- 1920×1080, 30 fps, **de 8 a 15 min, sin excepción** (`"duracionMax"` en el plan; por defecto 900 s). Desde 8 min YouTube permite
  anuncios en medio del vídeo, y la prioridad del canal es monetizar (decisión del 2026-11-07). Hacen falta **unas 1.250
  palabras de guion como mínimo** (con la voz y las pausas salen unas 2,6 palabras por segundo). `video.py` se detiene antes
  de generar la voz si el guion no llega, y otra vez si con la voz dura menos de 8 min; `enganche.py` lo marca como
  PROBLEMA. Se llega con más capítulos con datos y fuente, nunca estirando frases (ver `references/guion-largo.md`).
- 4 a 8 capítulos. Cada frase que abre uno lleva `"capitulo": "Nombre"`; `capitulos.py` los arma para YouTube.
- **Casi todo imagen.** Escena principal: `Clips` a pantalla completa con vídeo o foto real (`"imagen"` en vez de
  `"video"` hace un zoom lento), **sin texto encima**: los datos los cuenta la voz. Crédito arriba a la derecha.
- **Texto grande solo en el gancho y en 3–5 golpes** (5 hasta 10 min, 7 en vídeos más largos): las cifras clave de la
  historia, como tarjeta (contador, tachado, barras, comparación, pregunta) o como `lineas` sobre el vídeo. Cuentan
  igual. `enganche.py` lo revisa.
- **Etiquetas `texto` de los clips**: solo para nombrar lo que se ve (marca o modelo cuando no es obvio), una cada
  15 s como mucho. Nada de resumir con ellas lo que dice la voz.
- **Golpes sin texto**: un dato fuerte dicho sobre el vídeo también es un golpe. Márcalo con `"golpe": true` en la
  frase (con una pausa antes, si se puede); cuenta para el ritmo sin poner nada escrito.
- Sin personaje con poses (en horizontal no cabe bien).
- Miniatura de 1280×720: título de 2–3 líneas cortas a la izquierda e imagen real a la derecha.

## Flujo

```
- [ ] 1. Formato (noticia o explicativo), tema y fuentes (references/noticia.md o references/guion-largo.md)
- [ ] 2. Guion por capítulos, con la fuente de cada dato
- [ ] 3. Datos verificados: agente reels-verificador sobre el guion, y corregir lo que marque
- [ ] 4. Proyecto: python3 SKILL/scripts/preparar.py ~/video-<tema>
- [ ] 5. Recursos: vídeos e imágenes oficiales o con licencia libre, con crédito (FUENTES.md)
- [ ] 6. Plan: una escena por frase, capítulos, portada y bloque "youtube"
- [ ] 7. Validar sin voz (alinear.py --sin-voz + node render.mjs resumen + scripts/enganche.py) hasta que no haya PROBLEMAS ni avisos de enganche
- [ ] 8. video.py --hasta fotos (voz, música, capítulos, hoja) y revisar salida/hoja.png
- [ ] 9. video.py (render largo en segundo plano, ritmo, miniatura, revisión, salida/youtube.txt)
- [ ] 10. Entregar: vídeo, miniatura, título, descripción con capítulos. Publicar solo si la persona lo pide
```

`SKILL` es la carpeta de esta skill (en un proyecto, `.claude/skills/jham-videos`, como ruta absoluta). Los comandos
del proyecto de vídeo se lanzan desde su carpeta (`cd ~/video-<tema> && …`).

### 1–3. Tema, guion y verificación

Lee `references/guion-largo.md`. Si hay una nota del sitio sobre el tema, parte de ella: ya tiene los datos con
fuente y el vídeo la enlaza en la descripción. Enseña el guion en el chat con la fuente de cada dato, pásalo por el
agente `reels-verificador` y corrige lo que marque. Después sigue sin esperar aprobación, como en los reels.

### 4. Proyecto

```bash
python3 SKILL/scripts/preparar.py ~/video-baterias
```

Copia la plantilla horizontal, instala (1–2 min la primera vez) y comprueba navegador y ffmpeg. Termina con «LISTO».

### 5. Recursos

- Vídeo oficial: `python3 ../jham-reels/scripts/buscar_recursos.py URL --marca x --proyecto ~/video-…` (references/recursos.md
  de jham-reels). En horizontal el vídeo se ve entero: `foco` casi nunca hace falta.
- **No te quedes con las webs en español.** Busca también la web oficial del país de la marca, aunque esté en chino u
  otro idioma (Deepal, Avatr, BYD, XPeng… en su web china): suele tener más vídeos y de más calidad, y un vídeo largo
  necesita muchas tomas. Cómo hacerlo, con sus reglas (dominio oficial, crédito, CLTC sin convertir, nada de redes
  chinas), en «Fuentes en chino u otros idiomas» de `../jham-reels/references/recursos.md`.
- Fotos con licencia libre: Wikimedia Commons (CC0, CC BY, CC BY-SA), con autor y licencia en `fuente` y la página en
  `salida/FUENTES.md`. Imágenes de la persona: a `public/imagenes/`.
- **No uses vídeos de canales de YouTube de las marcas**: YouTube los reclama por Content ID aunque sean oficiales. Sí
  los de salas de prensa, con su crédito.
- Apunta a que un tercio de las escenas o más enseñen imagen real; el resumen avisa cuando hay pocas.

### 6. Plan

Igual que el de los reels (`../jham-reels/references/escenas.md`) más estos campos:

```json
{
  "titulo": "Batería LFP, NMC o de sodio",
  "estilo": "noche", "transicion": "suave", "subtitulos": "no", "efectos": "pocos", "pausaCapitulo": 1.2, "personaje": false,
  "duracionMax": 900, "pesoMax": 0,
  "capituloInicial": "Introducción",
  "formato": "noticia",
  "youtube": { "titulo": "≤100 caracteres", "descripcion": "2–3 frases", "enlace": "https://…/nota/", "categoria": "2",
               "fuentes": [["Ficha del carro (ev-database)", "https://…"], ["Imágenes y vídeos", "Tesla y BYD Europa, webs oficiales"]] },
  "frases": [
    { "texto": "…", "capitulo": "El precio", "entrada": "semitono", "escena": { … } }
  ],
  "portada": { "etiqueta": "BATERÍAS", "lineas": ["LFP, NMC", "o *SODIO*"], "imagenes": ["imagenes/celda.webp"] }
}
```

- Marca con `capitulo` la primera frase de cada bloque y ponle `"entrada": "semitono"`: así se nota el cambio.
- La primera frase es el gancho (titular grande, `sinSubtitulos`). La última, la `cta` (comentar y suscribirse).
- Categorías de YouTube (`youtube.categoria`): 2 Autos y vehículos, 15 Mascotas y animales, 17 Deportes, 19 Viajes,
  22 Personas y blogs, 26 Consejos y estilo, 27 Educación, 28 Ciencia y tecnología.

### 7. Validar sin voz

```bash
cd ~/video-… && ~/.cache/jham-reels/venv/bin/python SKILL/../jham-reels/scripts/alinear.py --sin-voz --proyecto . && node render.mjs resumen
```

Después `python3 SKILL/scripts/enganche.py --proyecto .` con esos mismos tiempos. Corrige todos los PROBLEMAS, casi todos
los AVISOS y los avisos de enganche antes de generar la voz: es mucho más barato.

### 8–9. Voz, hoja y render

```bash
python3 SKILL/scripts/video.py --proyecto ~/video-… --hasta fotos   # voz, música, capítulos, resumen y hoja
python3 SKILL/scripts/video.py --proyecto ~/video-…                 # todo, incluido el render (en segundo plano)
```

- La voz local necesita leer `jham-reels/assets/voz` y `~/.cache`: si el sandbox lo bloquea, lánzalo fuera de él.
- Revisa `salida/hoja.png` y fotogramas sueltos (`node render.mjs foto 30 95.5`) antes del render completo.
- El render de 1 minuto tarda unos 5 minutos: 8 minutos de vídeo son unos 40 de render. Se hace por trozos y se
  puede relanzar. `video.py` no recomprime (YouTube vuelve a codificar).
- Al terminar: `salida/video.mp4`, `salida/portada.png` (y `portada_check.png` con la miniatura a los tamaños de
  YouTube), `salida/capitulos.txt`, `salida/youtube.txt` y `salida/informe.md`.

### 10. Entregar y publicar

- Dale a la persona el vídeo, la miniatura y, en el chat, título y descripción (de `salida/youtube.txt`). Para mejorar
  el título y la miniatura usa `yt-package`; para la descripción y las búsquedas, `yt-seo`.
- Publicar lo decide la persona en cada vídeo. Con su aprobación:

```bash
node SKILL/scripts/publicar-video.mjs borrador salida/video.mp4 "Título" salida/descripcion.txt --portada=salida/portada.png --ia --categoria=2
```

  `borrador` lo deja privado; `oculto … --confirmo`, sin listar; `publicar … --confirmo`, público. `--ia` marca el
  contenido como alterado o sintético en YouTube. Usa la conexión de YouTube de jham-reels (`youtube-token.mjs`, el
  mismo `.env`).
- **Subtítulos:** se suben solos con el vídeo (`salida/subtitulos.srt`, en español, como subtítulos CC). Necesitan el
  permiso `youtube.force-ssl`: la primera vez, la persona reconecta el canal con
  `node ../jham-reels/scripts/youtube-token.mjs --reconectar` (abre `http://127.0.0.1:4391/` y acepta con
  mejorelectrico9@gmail.com). Para un vídeo ya subido: `publicar-video.mjs subtitulos <id> --subtitulos=salida/subtitulos.srt`.
- **Descripción:** lleva las fuentes de los datos (`"youtube": {"fuentes": [["nombre", "url"], …]}` en el plan) y el
  crédito de las imágenes. Citar fuentes no afecta a la monetización y da credibilidad. No hace falta escribir en la
  descripción que la voz es de IA (decisión de quien administra del 2026-11-07); lo que pide YouTube es la casilla
  de contenido alterado o sintético cuando el contenido realista pueda confundirse con real.
- Después de 2–3 días, `yt-retention` con la exportación de retención de YouTube Studio dice dónde se fue la gente.

## Ritmo tranquilo (por defecto)

Un vídeo largo no es un reel estirado: lo que en 50 s da energía, en 5 minutos cansa. Por eso `video.py` ya hace esto
sin pedirlo (cada cosa se cambia en el plan):

| Qué | Por defecto | En el plan |
|---|---|---|
| Música | `musica_fondo.py`: 84 bpm, colchón y arpegio suave, ~13 dB bajo la voz; con pulso solo en el gancho y el cierre; sin subidas de ruido | `"musica": {"tension": [n]}` oscurece antes del giro; `{"estilo": "reel"}` vuelve a la rápida |
| Efectos de sonido | Pocos: el arranque, la entrada de cada capítulo y el golpe de las cifras que sorprenden, más bajos. Nada de swoosh en cada toma | `"efectos": "pocos" \| "todos" \| "ninguno"` |
| Pausa entre capítulos | 1,2 s de silencio antes de cada capítulo (`pausas.py`), con la música subiendo un poco | `"pausaCapitulo": 1.2` (0 la quita) |
| Voz | La de los reels (VoxCPM2 con voz02) con hasta 0,6 s entre frases; `"exageracion"` solo cuenta con `"motorVoz": "chatterbox"` | `"pausaFrases"`, `"exageracion"` |
| Subtítulos | Fuera de la imagen (`"subtitulos": "no"` en el plan) y `salida/subtitulos.srt` para subirlo a YouTube como subtítulos (CC): quien quiera los activa, YouTube los indexa y la imagen queda limpia | `"subtitulos": "linea"` los vuelve a pintar |

### Lo que se aprendió de un vídeo de referencia que funciona

Compara Motors, «¡Así es el NUEVO DEEPAL S05 2027!» (5:11, revisado el 2026-11-06). Se tomó el ritmo, no el contenido:
- **Todo es imagen real a pantalla completa**: vídeo oficial y tomas de recorrido del carro, sin tarjetas. Los datos
  solo los dice la voz. Aquí igual: imagen limpia y texto grande solo en el gancho y en 3–5 cifras clave.
- **Corta cada 2,2 s de media** (cada 1,2 s en el primer minuto) y la toma enseña lo que se dice: la pantalla cuando
  habla de la pantalla. `enganche.py` avisa si la media pasa de 4,5 s (noticia) o 6 s (explicativo).
- **Música constante y presente** (unos 6–8 dB bajo la voz), sin efectos de sonido. La nuestra va unos 10 dB por debajo.
- **Sin subtítulos en la imagen.**
- **Lo que no se copia**: abre con «sean bienvenidos a este canal», no tiene capítulos ni preguntas abiertas, lee la
  ficha sin decir qué significa cada dato y pide suscribirse solo al final.
- **Para 5 minutos hacen falta unas 100 tomas**: busca vídeos largos de recorrido (b-roll) en las salas de prensa,
  no solo los bucles de la web de producto.

Patrones de energía para el guion (de la guía de retención de `AgriciDaniel/claude-youtube`, MIT; sus cifras son
de la guía, sin fuente verificada):
- **Calma con picos**: tramos tranquilos y un golpe (cifra, giro, pregunta) cada 30–60 s, no cada frase.
- **Ancla**: cada 2–3 min, volver en una frase a la pregunta del título («¿y por qué cayó Tesla?»).
- **Pausa antes de lo importante**: una frase corta y un respiro antes del dato clave.
- **Bucles abiertos**: cada capítulo termina dejando una pregunta que responde el siguiente.
- **Una petición pronto**: la de suscribirse o comentar después del primer valor (1–3 min), no solo al final, porque
  pocos llegan al cierre.

## Lo que hace que un vídeo largo funcione

1. **Los primeros 15 s.** Confirman lo que prometió el título, abren una pregunta y prueban que la respuesta existe.
   Sin presentación del canal ni «antes de empezar».
2. **Un capítulo, una pregunta.** Cada capítulo responde algo que la gente busca; su nombre lo dice.
3. **Imagen real cada pocos segundos.** Las tarjetas sostienen los datos; las fotos y vídeos sostienen la atención.
4. **Cada dato con su consecuencia** (las reglas de redacción del proyecto valen también aquí).
5. **Un cierre concreto y una sola petición** (comentar o suscribirse, no tres cosas).
6. **Valor propio.** YouTube no paga por vídeos hechos en serie con plantilla: análisis propio, datos verificados y
   variedad de imágenes. La voz grabada por la persona (`video.py --audio voz.mp3`) ayuda más que la sintética.
