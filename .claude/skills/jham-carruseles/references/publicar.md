# Texto y publicación

## Texto para publicar

Va en `salida/texto-publicar.txt` y sirve igual para Instagram y Facebook.

- **Primera línea:** la promesa de la portada con otras palabras (≤125 caracteres: es lo único que se ve sin
  pulsar «más»).
- **2 a 4 líneas cortas** con lo que trae el carrusel, sin repetir lámina por lámina.
- **El criterio**, si es un ranking o una comparación («Cifras WLTP de las fichas colombianas del comparador»).
- **Una pregunta para comentar** o «Guárdalo para cuando lo necesites».
- **Una línea de fuentes** (datos y fotos, con licencia) y otra con `mejorelectrico.com`.
- **3 a 5 hashtags** del tema.

Las reglas de redacción de `CLAUDE.md` valen aquí. Emojis, como mucho uno o dos si ayudan a leer.

## Publicar

Por la API de Meta, con el mismo token de los reels (`META_PAGE_TOKEN`, `META_PAGE_ID` y `META_IG_ID` en `.env`).

```bash
node .claude/skills/jham-carruseles/scripts/publicar-carrusel.mjs verificar
node .claude/skills/jham-carruseles/scripts/publicar-carrusel.mjs borrador ~/carrusel-x
node .claude/skills/jham-carruseles/scripts/publicar-carrusel.mjs publicar ~/carrusel-x --confirmo
```

- `publicar --confirmo` se usa solo cuando la persona aprobó ese carrusel en el chat.
- `borrador` sube las láminas a Facebook como fotos sin publicar y prepara el carrusel de Instagram sin publicarlo.
  Nada se ve en público; sirve para probar que Meta acepta las imágenes.
- Instagram pide cada imagen por una dirección pública y en JPG. El script sube primero cada lámina a Facebook como
  foto sin publicar (no aparece en la página) y le pasa a Instagram esa dirección.
- Si Instagram rechaza una lámina, no se publica en ninguna red. `--solo-facebook` o `--solo-instagram` limitan el
  destino, por ejemplo para repetir solo la que falló.
- Instagram limita las publicaciones por API cada 24 horas, contando reels y carruseles: `verificar` dice cuántas
  van.

## Música

La API no deja poner música a un carrusel. Si la persona la quiere:

1. Se le pasan las láminas (`salida/01.jpg`, `02.jpg`…) y el texto.
2. Publica desde la app de Instagram, elige la canción y marca «Compartir también en Facebook».
3. Se anota igual en `carruseles-publicados.md`, con «(desde la app)».
