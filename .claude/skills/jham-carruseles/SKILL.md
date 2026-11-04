---
name: jham-carruseles
description: Crea carruseles (publicaciones de varias imágenes) de principio a fin - tema, datos con fuente, láminas de 1080×1350, verificación, texto y publicación por la API de Meta. Abierta a cualquier tema (carros, comida, mascotas, viajes…) y a cualquier tipo - rankings, guías, comparaciones, mitos, noticias. Por defecto usa la marca y las cuentas de Mejor Eléctrico, con datos de la tabla vehicles cuando el tema es de carros. Úsala siempre que pidan un carrusel, un post de varias imágenes, láminas o diapositivas para redes.
---

# jham-carruseles

Hace carruseles de 2 a 10 láminas, en 1080×1350 (4:5), con la misma tipografía y los mismos colores de los reels
(estilo `noche`: Space Grotesk, Inter y verde lima). Las láminas se escriben en un `carrusel.json` y un script las
pinta con Chrome sin ventana. Una carpeta por carrusel, fuera del proyecto: `~/carrusel-<slug>`.

**La regla de esta skill: algo que valga la pena guardar.** Un carrusel no compite con el reel en alcance: gana
cuando la gente lo guarda o lo comparte. Cada lámina dice una sola cosa, con un dato que se pueda comprobar, y la
última dice qué hacer después (guardarlo, comparar en el sitio).

## Cualquier tema

El motor no sabe de carros: pinta láminas con textos, cifras e imágenes. Un carrusel de las mejores comidas de
Latinoamérica o de juguetes para perros se hace igual, con estas diferencias:

- **Datos:** salen de la web, no de la base. Cada afirmación con su fuente en `guion.md`; en un ranking, el criterio
  escrito (premios, estudios, ventas, una lista publicada por alguien con nombre). Si es una opinión, se dice de quién.
- **Imágenes:** las de la página oficial de lo que se muestra, igual que en los carros (ver «Imágenes» abajo).
- **Marca:** `marca` y `web` en `carrusel.json` cambian el nombre de arriba y la dirección del cierre (`""` los
  quita). Por defecto son los de Mejor Eléctrico.
- **Dónde se publica:** `publicar-carrusel.mjs` solo publica en las cuentas de Mejor Eléctrico. Un tema que no es
  de carros no va ahí salvo que la persona lo pida: si es para otra cuenta, se entregan las láminas para subirlas
  desde la app, o se conecta esa cuenta con su propio token.

## Quién hace qué

| Tarea | Quién |
|---|---|
| Elegir el tipo y el tema, sacar los datos, escribir las láminas | Claude |
| Comprobar cada dato contra su fuente | Agente `carruseles-verificador` |
| Pintar las láminas, medir que el texto quepa, hacer los JPG y la hoja | `scripts/render.mjs` |
| Mirar la hoja y corregir lo que se vea mal | Claude |
| Aprobar y publicar | Usuario (Claude publica solo con su aprobación para ese carrusel) |

## Flujo

```
- [ ] 1. Tipo y tema (references/tipos.md); revisar carruseles-publicados.md para no repetir
- [ ] 2. Datos con fuente en guion.md (con la consulta SQL si salen de la base)
- [ ] 3. carrusel.json (references/laminas.md)
- [ ] 4. Agente carruseles-verificador hasta LISTO PARA RENDER (máx. 5 rondas)
- [ ] 5. render.mjs sin problemas + mirar salida/hoja.png y las láminas a tamaño completo
- [ ] 6. salida/texto-publicar.txt (references/publicar.md)
- [ ] 7. Enseñar la hoja y el texto; publicar solo con aprobación; anotar en carruseles-publicados.md
```

`SKILL` en los comandos es la carpeta de este archivo (`.claude/skills/jham-carruseles`, como ruta absoluta).

### 1. Tipo y tema

Lee `references/tipos.md`: qué tipos funcionan (ranking, guía, comparación, mito, noticia) y la estructura de cada
uno. Mira `carruseles-publicados.md` y `../jham-reels/temas-publicados.md`: un carrusel puede ampliar el tema de un
reel de la misma semana, pero no repetir un carrusel anterior.

### 2. Datos

Ningún dato sale de memoria. Escribe `guion.md` en la carpeta con una tabla: lámina, dato, fuente.

- **De la base (`vehicles`):** solo filas con `published = true`, por el conector `supabase-garash`, solo lectura.
  Pega la consulta en `guion.md`. Compara solo cifras del mismo ciclo (WLTP con WLTP) y di el mercado. Lee antes la
  sección de la tabla en el `README.md` del proyecto.
- **De la web:** el documento oficial antes que la noticia sobre él. Di lo que no pudiste confirmar.

### Imágenes

Quien administra decidió el 2026-11-03 que los carruseles usen las imágenes de la **página oficial** de lo que se
muestra (fabricante, marca, restaurante, oficina de turismo, sala de prensa), como hacen los reels con los vídeos
oficiales: el carrusel les hace publicidad. La condición es que **siempre lleve el crédito**.

- **Orden:** 1) la página o sala de prensa oficial de eso mismo; 2) para carros, las fotos del comparador
  (`"vehiculo:<slug>"`, con su `image_credit`); 3) una foto con licencia libre (Wikimedia Commons, Unsplash, Pexels).
- **No sirven:** fotos de otra marca para hablar de esta, ni fotos de tiendas, blogs o reseñadores que no son la
  fuente oficial ni tienen licencia libre.
- **Crédito en la lámina** (`credito`): de quién es la imagen, corto. Oficial: «Imagen: Zeekr Colombia (sitio
  oficial)». Libre: «Foto: autor, licencia». Si la imagen no es exactamente lo que se dice (otro año, otro país), empieza
  por «Imagen de referencia».
- **En `FUENTES.md`** de la carpeta: cada imagen con el archivo, la página exacta de donde salió y la fecha en que se
  bajó.
- Se bajan a la carpeta del carrusel (`imagenes/`). Si la página dice expresamente que no se pueden usar, no se usa.

### 3. Láminas

Escribe `~/carrusel-<slug>/carrusel.json` según `references/laminas.md`. Hay siete tipos de lámina: `portada`,
`ranking`, `comparacion`, `dato`, `lista`, `texto` y `cierre`. Cualquier carrusel se arma combinándolos.

### 4. Verificar

Lanza el agente `carruseles-verificador` con la ruta de la carpeta. Corrige todo lo que marque y repite hasta que
termine en `LISTO PARA RENDER`, como mucho cinco rondas. Si un dato no se sostiene, cámbialo o quita la lámina.

### 5. Pintar y mirar

```bash
node SKILL/scripts/render.mjs ~/carrusel-<slug>          # todas las láminas
node SKILL/scripts/render.mjs ~/carrusel-<slug> --solo=3 # solo una, al corregirla
```

Deja en `salida/` cada lámina en PNG (para mirar) y JPG (para publicar) y `hoja.png` con todas. Mide cada texto con
las fuentes cargadas: si algo no cabe o toca el borde, lo dice y termina con error. Arregla acortando el texto, no
achicando la letra. Después mira la hoja y abre a tamaño completo la portada y cualquier lámina con mucho texto:
que se lea en el celular, que nada tape la foto y que las láminas seguidas no se vean iguales.

### 6. Texto para publicar

`salida/texto-publicar.txt`, según `references/publicar.md`.

### 7. Publicar

Enseña `hoja.png`, la portada a tamaño completo y el texto. **Publicar es decisión del usuario, para cada carrusel.**
La única excepción son las tareas programadas de `references/automatico.md` (lunes, miércoles y viernes), que
publican solas si pasan el verificador y el render. Con su aprobación:

```bash
node SKILL/scripts/publicar-carrusel.mjs publicar ~/carrusel-<slug> --confirmo
```

Sale en Facebook (publicación de varias fotos) y en Instagram (carrusel). La API no permite música en carruseles:
si la quiere, se publica desde la app (ver `references/publicar.md`). Al publicar, añade una fila a
`carruseles-publicados.md` con fecha, tema, tipo, láminas, carpeta y enlaces.

## Referencias

| Archivo | Cuándo |
|---|---|
| `references/tipos.md` | Siempre, al elegir el tema |
| `references/laminas.md` | Siempre, al escribir `carrusel.json` |
| `references/publicar.md` | Al escribir el texto y al publicar |
| `references/automatico.md` | En las tareas programadas del carrusel automático |

Las fuentes (Space Grotesk e Inter, licencia OFL) están en `assets/fuentes`. Los colores, en `scripts/estilos.mjs`:
son los del estilo `noche` de jham-reels, y si ese estilo cambia, se cambia también ahí.
