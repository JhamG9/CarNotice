---
name: agregar-vehiculo
description: Orquesta la creación de un vehículo nuevo en la tabla vehicles de Supabase (comparador de Mejor Eléctrico), de la identidad a la publicación, con un candado que no deja publicar mientras falte algún campo clave del comparador. Usar cuando pidan agregar, crear, insertar o subir un carro nuevo al comparador. Para completar carros que ya existen se usa completar-vehiculos.
---

# Agregar un vehículo

Crea un carro nuevo con su ficha completa. Tú (la sesión principal) eres el orquestador: usas los agentes de `completar-vehiculos`, juntas lo que devuelven y hablas con quien administra.

Antes de empezar, lee:
- `CLAUDE.md`, sección "Insertar un vehículo en `vehicles`": obligatorios, slug y reglas de inserción.
- [`../completar-vehiculos/campos.md`](../completar-vehiculos/campos.md): fuentes, reglas de los datos y **campos clave del comparador**.

## El candado

Un vehículo **no se publica** (`published = true`) hasta que [`campos-clave.sql`](campos-clave.sql) diga `listo_para_publicar = true`. Eso pasa cuando el comparador puede puntuar sus siete áreas (autonomía, potencia, aceleración, carga rápida, espacio, seguridad y confort) y además tiene foto con crédito.

- Sí se puede **insertar sin publicar** con lo que haya: así no se pierde lo investigado.
- Quien administra puede publicar con un área vacía, pero solo si lo dice expresamente para ese vehículo después de ver qué área falta. Anótalo en el registro.
- Nunca se llena un campo clave inventando, estimando o calculando. Si no hay fuente, se busca más o se queda sin publicar.

## Agentes

Son los de `completar-vehiculos`:
- `vehiculos-investigador`: busca y comprueba cada dato.
- `vehiculos-verificador`: revisa solo lo dudoso.
- `vehiculos-completitud`: relee la fila y dice qué áreas quedan vacías.

La inserción, la foto y la publicación las hace la sesión principal.

## Flujo

1. **¿Ya existe?** Busca la misma marca, modelo, versión, año y mercado. Si existe, ofrece completarlo con `completar-vehiculos` en vez de crearlo.
2. **Obligatorios.** Si faltan mercado, motorización, versión o año, pregúntalos juntos en una sola pregunta. Lo demás (`segment`, `body_style`, nombre exacto de la versión, slug) lo propone el investigador.
3. **Investigar.** Lanza un `vehiculos-investigador` por modelo y mercado. Si el mercado vende varias versiones, una sola investigación las cubre todas. En el encargo, dile:
   - que la fila todavía no existe;
   - que confirme la identidad y las versiones que se venden en ese mercado;
   - que los **campos clave** van primero, con segunda búsqueda dirigida si falta alguno;
   - la autonomía: la del ciclo del mercado y, si la marca publica oficialmente otro ciclo para **la misma batería y el mismo motor**, también esa, cada una en su columna (ver `campos.md`);
   - que los PDF de imágenes se abren con Read y el parámetro `pages`. Si WebFetch no puede bajar un PDF grande, avisa y lo descargas con `curl`.
4. **Verificar** solo lo `dudoso` con `vehiculos-verificador`. Si ningún dato es dudoso, salta este paso.
5. **Mostrar la fila** a quien administra:
   - identidad y slug;
   - datos con su fuente;
   - campos clave con una sola fuente, para aprobar uno por uno;
   - campos que quedan vacíos;
   - **qué áreas del comparador quedarían "sin datos"**.

   Espera un sí.
6. **Insertar** con `published = false` y `on conflict do nothing`. Lee la fila completa y compárala con lo aprobado.
7. **Foto.** Sigue la sección "Imagen del vehículo" de `CLAUDE.md`:
   - En Wikimedia Commons, revisa autor, licencia y que no haya solicitud de borrado (`{{delete}}` o `{{copyvio}}`).
   - Compara con el diseño que se vende en ese mercado.
   - Recorta a 1600 × 900 en WebP y comprueba que pese menos de 300 KB.
   - Muéstrala y espera un sí antes de guardarla en `public/vehicles/<slug>.webp` y de llenar `image_url`, `image_credit` e `image_source_url`.
8. **Candado.** Ejecuta `campos-clave.sql` con el slug y lanza `vehiculos-completitud`.
   - Si falta algún área, di cuál y ofrece buscarla. Vuelve al paso 3 solo para esos campos.
   - Si `listo_para_publicar` es `true`, di que ya se puede publicar.
9. **Publicar,** hacer commit y push, y desplegar **solo cuando quien administra lo pida**:
   - Commit de la foto y del registro.
   - `npx astro dev stop` y luego `npm run deploy`.
   - Abre `https://mejorelectrico.com/es/comparador/?a=<slug>&b=<otro>` y confirma que la foto carga. Si justo después del despliegue no carga, recarga una vez antes de investigar.

## Registro

Todo queda en `supabase/completado/AAAA-MM-DD.md`, bajo "Vehículo nuevo: <slug>":
- cada dato con su fuente y su verificación;
- los de una sola fuente, marcados "prensa, una fuente";
- la foto con su crédito;
- si se publicó con un área vacía, quién lo autorizó.
