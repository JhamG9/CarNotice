---
name: agregar-vehiculos
description: Orquesta la creación de uno o varios vehículos nuevos en la tabla vehicles de Supabase (comparador de Mejor Eléctrico), de la revisión en la base a la publicación, con el mismo flujo de agentes de completar-vehiculos (revisar, investigar, verificar, escribir, revisar completitud) y un candado que no deja publicar mientras falte algún campo clave del comparador. Usar cuando pidan agregar, crear, insertar o subir uno o varios carros nuevos al comparador; primero revisa en la base cuáles ya existen. Para completar carros que ya existen se usa completar-vehiculos.
---

# Agregar vehículos

Crea uno o varios carros nuevos con su ficha lo más completa posible. Sigue el mismo flujo que `completar-vehiculos`: primero se revisa la base, después se investiga en la web, se verifica lo dudoso, se escribe y se comprueba qué quedó. Tú (la sesión principal) eres el orquestador: lanzas a los agentes, juntas lo que devuelven y hablas con quien administra.

Antes de empezar, lee:
- `CLAUDE.md`, sección "Insertar un vehículo en `vehicles`": obligatorios, slug y reglas de inserción.
- [`../completar-vehiculos/campos.md`](../completar-vehiculos/campos.md): fuentes, reglas de los datos y **campos clave del comparador**. Incluye "Primero la ficha técnica", "Fuentes dudosas: la cifra más pequeña" y la regla de carga rápida (`dc_charging = false` cuando el carro no tiene carga DC).
- [`../completar-vehiculos/SKILL.md`](../completar-vehiculos/SKILL.md), sección "Aprobación o decisión delegada".

## Agentes

Los mismos de `completar-vehiculos` (`.claude/agents/`):

| Paso | Quién | Hace |
|---|---|---|
| 1 | Sesión principal (SQL) | Revisa de una vez si cada carro pedido ya existe, con otro nombre o en otra versión, y cómo están escritos la marca y el modelo (`buscar-existentes.sql`) |
| 3 | `vehiculos-investigador` | Busca en la web la ficha de cada versión y comprueba cada dato |
| 4 | `vehiculos-verificador` | Solo lo `dudoso` |
| 6 | Sesión principal (SQL) | Inserta la fila nueva con `published = false` |
| 7 | `vehiculos-auditor`, investigador, verificador y `vehiculos-escritor` | Lo que faltó después de insertar, igual que `completar-vehiculos` |
| 9 | `vehiculos-completitud` | Relee la fila y confirma qué áreas quedan vacías |

## El candado

Un vehículo **no se publica** (`published = true`) hasta que [`campos-clave.sql`](campos-clave.sql) diga `listo_para_publicar = true`: las siete áreas del comparador (autonomía, potencia, aceleración, carga rápida, espacio, seguridad y confort) con dato y la foto con crédito. Un carro sin carga DC (`dc_charging = false`) tiene el área de carga resuelta.

- Sí se puede **insertar sin publicar** con lo que haya: así no se pierde lo investigado.
- Quien administra puede publicar con un área vacía, pero solo si lo dice expresamente para ese vehículo después de ver qué área falta. Anótalo en el registro.
- Nunca se llena un campo inventando, estimando o calculando. Si no hay fuente, el campo queda vacío y el comparador lo muestra como "Sin dato".

## Aprobación o decisión delegada

Funciona igual que en `completar-vehiculos`. Por defecto, quien administra aprueba la fila antes de insertarla (paso 5) y la foto (paso 8).

En **modo delegado** (un mensaje de quien administra como "decide tú", una memoria que lo recoja con su cita, o la regla "Decisión delegada" de `CLAUDE.md`):

- Decides tú la identidad propuesta por el investigador (segmento, carrocería, nombre exacto de la versión), qué datos se escriben (incluidos los de una sola fuente y los que salen por la regla de la cifra más pequeña), la inserción con `published = false` y la foto.
- Se aplican igual todas las reglas de `campos.md`. Ante la duda, el campo queda vacío.
- Al escritor se le pasa la cita textual de la delegación.
- Al terminar, informas lo escrito, lo descartado y qué áreas quedan "sin datos".
- La delegación **no cubre** publicar (`published = true`) ni desplegar: se piden en el momento, como dice `CLAUDE.md`. Sí cubre el commit y el push del registro y de la foto.

## Flujo

### 1. Revisar la base (todos los pedidos de una vez)

Quien administra suele pedir varios carros juntos ("agrega el Xpeng G6, el BYD Seagull y el Kia EV4"). Antes de investigar nada, revísalos **todos** en la base con una sola consulta: [`buscar-existentes.sql`](buscar-existentes.sql), con la lista de pedidos `(número, marca, modelo)` en el `values`. Solo lee. Compara sin tildes ni mayúsculas y busca el modelo también en `latam_name`.

Con el resultado, decide qué pasa con cada pedido:

| Lo que sale | Qué se hace |
|---|---|
| `nuevo` | Se crea con el flujo de esta skill. La marca se escribe como en las demás filas de esa marca ("BYD", no "Byd"). |
| `mismo modelo`, y está la misma versión y mercado pedidos | No se crea: si le faltan datos, se completa con `completar-vehiculos`; si está completo, se informa y no se hace nada. |
| `mismo modelo`, pero en otra versión o mercado | Se crea la versión o el mercado nuevos con **exactamente** la misma escritura de `brand` y `model` que las filas existentes: de ahí sale la página `/es/carros/<marca-modelo>/` que agrupa sus versiones. |
| `otro nombre (latam_name)` | Es el mismo carro con otro nombre (el Seagull es el Dolphin Mini). Si es el mismo mercado, se completa el existente. Si es otro, se crea con el nombre de ese mercado y se llena `latam_name` en las dos fichas, solo con dato confirmado. |
| `nombre parecido: revisar` | Solo un candidato ("Kona" encuentra "Kona Electric", pero "Dolphin Mini" encuentra también "Dolphin", que es otro carro). Decide si es el mismo; si lo es, usa su escritura. |

Antes de seguir, muestra (o, en modo delegado, informa) una tabla con cada pedido y su decisión: **nuevo**, **versión o mercado nuevo de un modelo existente**, **ya existe: se completa** o **ya existe: completo**. Los que van a `completar-vehiculos` se hacen con esa skill al terminar los nuevos, o antes si no hay nuevos.

Después arma los lotes como en `completar-vehiculos`: por marca y mercado, hasta 2 modelos por lote y un lote a la vez (más agentes en paralelo agotan el límite de búsquedas de la sesión). Los pasos 2 a 9 se hacen lote por lote; el paso 10, al final, para todos.

Si piden un solo carro, es la misma consulta con un solo pedido.

### 2. Obligatorios

Mercado, motorización, versión y año. Si quien administra no los dijo:
- Por defecto, pregúntalos juntos en una sola pregunta.
- En modo delegado, el investigador propone las versiones que se venden y el mercado con ficha oficial disponible. Tú eliges y lo dices en el informe. Si piden "el carro" sin versión, se agregan las versiones que se venden en ese mercado.

`segment`, `body_style`, el nombre exacto de la versión y el slug los propone el investigador. El slug se arma con marca, modelo, versión, año y mercado (`deepal-s05-620-premium-lidar-2027-cn`).

### 3. Investigar

Lanza un `vehiculos-investigador` por modelo y mercado (en paralelo si son dos modelos del lote). Si el mercado vende varias versiones, una sola investigación las cubre todas. En el encargo, dile:

- que la fila todavía no existe, y la escritura de `brand` y `model` que debe usar si el modelo ya está en la tabla;
- que confirme la identidad y las versiones que se venden en ese mercado;
- que busque **primero la ficha técnica oficial** de cada versión en ese mercado (PDF, folleto, lista de precios, página de la versión), y después bases técnicas y prensa;
- que los **campos clave** van primero, con segunda búsqueda dirigida si falta alguno;
- la regla de fuentes dudosas: una sola fuente de prensa se propone marcada; con fuentes en conflicto o un rango, la cifra más pequeña; en un sí o no contradictorio, `false`; lo que la ficha no menciona no es `false`;
- que si el carro no tiene carga rápida en DC (la ficha solo trae carga AC), lo diga para guardar `dc_charging = false`;
- la autonomía: la del ciclo del mercado y, si la marca publica oficialmente otro ciclo para **la misma batería y el mismo motor**, también esa, cada una en su columna;
- que los PDF se leen con `pdftotext -layout` y, si son imágenes, con OCR local (ver `campos.md`). Si WebFetch no puede bajar un PDF grande, que avise y lo descargas con `curl`.

Si un lote anterior encontró fuentes de esa marca y mercado (lista de precios, garantía, ADAC), pásale las URL.

### 4. Verificar

Lanza `vehiculos-verificador` **solo** con las propuestas marcadas `dudoso`, como en `completar-vehiculos`. Si no hay nada dudoso, salta este paso.

### 5. Aprobar o decidir

Arma la fila con identidad, slug y los datos aprobados o decididos, cada uno con su fuente.

- **Por defecto:** muéstrala a quien administra con los campos clave de una sola fuente para aprobar uno por uno, los campos que quedan vacíos y **qué áreas del comparador quedarían "sin datos"**. Espera un sí.
- **En modo delegado:** decides tú con los mismos criterios y sigues. La lista va en el informe final.

### 6. Insertar

Inserta con `published = false` y `on conflict (slug) do nothing`. Lee la fila completa y compárala con lo aprobado. Deja el registro (ver "Registro").

### 7. Completar lo que falte

Igual que `completar-vehiculos`, pero solo con el slug nuevo:

1. Ejecuta `../completar-vehiculos/auditoria.sql` filtrado al slug: dice qué campos que aplican a su motorización siguen vacíos.
2. Si faltan campos clave o hay campos que valga la pena buscar, lanza otro `vehiculos-investigador` solo para esos campos, sin repetir las fuentes ya vistas.
3. Lo `dudoso` va al verificador, y lo aprobado o decidido lo escribe `vehiculos-escritor`, que solo llena campos vacíos y deja el registro.
4. Una ronda basta. Lo que no aparezca queda vacío ("Sin dato"): no se insiste con las mismas búsquedas.

### 8. Foto

Sigue la sección "Imagen del vehículo" de `CLAUDE.md`:
- Fotos de sala de prensa del fabricante o de Wikimedia Commons con licencia libre (CC0, CC BY o CC BY-SA). En Commons, revisa autor, licencia y que no haya solicitud de borrado (`{{delete}}` o `{{copyvio}}`).
- Compara con el diseño que se vende en ese mercado. Si no hay foto del modelo exacto, sirve la de un modelo hermano, y `image_credit` empieza por su nombre.
- Recorta a 1600 × 900 en WebP y comprueba que pese menos de 300 KB.
- Por defecto, muéstrala y espera un sí. En modo delegado, revísala tú (Read de la imagen) y decide.
- Guárdala en `public/vehicles/<slug>.webp` y llena `image_url`, `image_credit` e `image_source_url`.
- Varias versiones del mismo modelo pueden usar la misma foto: se copia con el slug de cada una.

### 9. Candado y completitud

Ejecuta `campos-clave.sql` con el slug y lanza `vehiculos-completitud` (o compara tú si el escritor no reportó errores).
- Si falta algún área, di cuál y por qué no se encontró.
- Si `listo_para_publicar` es `true`, di que ya se puede publicar.

### 10. Publicar y desplegar (solo cuando quien administra lo pida)

- Cambiar `published = true` solo cuando quien administra lo pida para ese carro.
- Commit y push de la foto y del registro (en modo delegado, sin preguntar).
- Desplegar solo cuando lo pidan en ese momento: `npx astro dev stop`, `npm run build` y `npm run deploy:pages`. Las páginas del carro se generan al compilar: hasta desplegar no existen `/es/carros/<marca-modelo>/` ni sus comparaciones fijas `/es/comparador/<a>-vs-<b>/`. El comparador libre sí lo muestra al instante, porque lee la base en vivo.
- Después del despliegue, comprueba que respondan la página del modelo y alguna de sus comparaciones, y que la foto cargue en `https://mejorelectrico.com/es/comparador/?a=<slug>&b=<otro>`. Si justo después no carga, recarga una vez antes de investigar.

## Registro

Todo queda en `supabase/completado/AAAA-MM-DD.md`, bajo "Vehículo nuevo: <slug>":
- qué se encontró en la base en el paso 1 (si el modelo ya existía y con qué escritura);
- cada dato con su fuente y su verificación;
- los de una sola fuente, marcados "prensa, una fuente", y los de la regla de la cifra más pequeña, con las cifras que se compararon;
- la foto con su crédito;
- si se publicó con un área vacía, quién lo autorizó.
