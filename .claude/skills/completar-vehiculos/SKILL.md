---
name: completar-vehiculos
description: Orquesta la tabla vehicles de Supabase (comparador de Mejor Eléctrico) con cinco agentes - auditor, investigador, verificador, escritor y revisor de completitud. Usar cuando pidan completar, rellenar, auditar o revisar fichas incompletas de vehículos, buscar en la web los datos que faltan de un carro ya insertado, o crear un carro nuevo con su ficha completa.
---

# Completar fichas de vehículos

Coordina a cinco agentes para encontrar fichas incompletas en `vehicles`, buscar los datos en la web, verificarlos y escribirlos. También sirve para **crear un carro nuevo** con su ficha (ver "Carro nuevo" al final). Tú (la sesión principal) eres el orquestador: lanzas a los agentes, juntas lo que devuelven y hablas con quien administra. Los agentes no hablan entre sí; todo pasa por ti.

Reglas comunes, conexión, qué campos aplican a cada motorización y **campos clave del comparador**: [campos.md](campos.md). Léelo antes de empezar. Los campos clave van primero: un carro sin ellos sale "sin datos" en el comparador.

## Agentes

| Paso | Agente (`subagent_type`) | Hace | Escribe en la base |
|---|---|---|---|
| 1 | `vehiculos-auditor` | Encuentra los registros incompletos y los agrupa por familia | No |
| 2 | `vehiculos-investigador` | Busca en la web los campos faltantes de una familia y comprueba cada dato | No |
| 3 | `vehiculos-verificador` | Solo si hace falta: revisa los datos dudosos y las correcciones a datos guardados | No |
| 4 | `vehiculos-escritor` | Escribe los datos aprobados, solo en campos vacíos | **Sí** |
| 5 | `vehiculos-completitud` | Relee las filas y confirma qué quedó completo | No |

El investigador comprueba cada dato antes de proponerlo y lo marca `firme` o `dudoso`. El verificador solo entra para lo `dudoso` y para las correcciones a valores ya guardados: así un lote cuesta más o menos la mitad. Antes de escribir siempre está la aprobación de quien administra.

## Flujo

### 1. Auditar

Lanza `vehiculos-auditor`. Si pidieron un alcance concreto (un slug, una marca, un mercado, "los de Colombia"), pásaselo. Muestra a quien administra el resumen y los lotes, y pregunta por cuáles empezar si no lo dijo.

**Los lotes se arman por marca y mercado, no por porcentaje.** Las familias de una misma marca en el mismo mercado comparten fuentes (la lista de precios del país, el ADAC, la garantía de la marca, Euro NCAP), así que juntas se investigan con menos búsquedas. Por defecto, empieza por la marca y el mercado con el promedio más bajo.

### 2. Investigar

Trabaja por lotes de hasta **2 familias** de la misma marca y mercado (unos 6 vehículos): los lotes más grandes chocan con el límite de búsquedas web de la sesión y se cortan a la mitad. Lanza un `vehiculos-investigador` **por familia**, en paralelo en el mismo mensaje. A cada uno le pasas, del informe del auditor:

- marca, modelo, año, mercado, `powertrain` y `latam_name` si lo hay;
- cada slug con su versión, su `source_url` actual y sus campos faltantes.

Si un lote anterior ya encontró fuentes de esa marca y mercado (la lista de precios del país, la página de garantía, la ficha ADAC), pásale las URL al investigador: así no las vuelve a buscar. Pásale solo las URL, no los valores: cada dato se comprueba de nuevo para su versión.

### 3. Verificar (solo lo necesario)

Si un investigador dice que la ficha oficial es un PDF en imágenes que no pudo leer, descárgalo y conviértelo a PNG (ver "Fuentes aceptadas" en `campos.md`). Pasa las rutas al verificador, o a un investigador nuevo si con eso se pueden llenar más campos.

Lanza `vehiculos-verificador` **solo** con las propuestas marcadas `dudoso` y con las posibles correcciones a valores guardados. Junta las de todo el lote en un solo verificador; si son muchas, uno por familia en paralelo. Las propuestas `firme` pasan directo al paso 4. Si no hay nada dudoso ni correcciones, salta este paso.

### 4. Pedir aprobación

Muestra a quien administra, por vehículo:

- los datos que se van a escribir (campo, valor, fuente): los `firme` del investigador y los que el verificador aprobó o corrigió;
- cuántos se rechazaron y por qué, en una línea;
- las **posibles correcciones** a valores ya guardados, en una lista aparte, para aprobar una por una;
- los **campos clave con una sola fuente de prensa**, con su valor y su fuente, para aprobar uno por uno (ver `campos.md`);
- **qué áreas del comparador quedarían "sin datos"** en cada vehículo con lo que se va a escribir.

Recuerda que estos vehículos están publicados (`published = true`): lo que se escriba se ve en el comparador al instante. Espera un sí claro antes del paso 5. La aprobación vale para este lote, no para los siguientes. Si quien administra quita o cambia algún dato, respétalo.

### 5. Escribir

Lanza `vehiculos-escritor` con la tabla final aprobada, diciendo expresamente que quien administra la aprobó en el chat (y qué correcciones, si aprobó alguna). Si no hubo aprobación, no lo lances.

### 6. Revisar completitud

Lanza `vehiculos-completitud` con los slugs tocados, la tabla de aprobados y el % de antes (del auditor). Muestra su tabla. En un lote pequeño (hasta 4 vehículos), puedes hacerlo tú: ejecuta `auditoria.sql` filtrado a esos slugs y compara con lo aprobado.

### 7. Siguiente lote

Pregunta si se sigue con el siguiente lote. Al terminar, resume: vehículos tocados, campos llenados, % promedio antes y después, campos que nadie pudo llenar y la ruta de `supabase/completado/AAAA-MM-DD.md`. Ofrece hacer commit de ese registro (no hagas commit sin que lo pidan).

## Lo que no hace esta skill

- No cambia la identidad de un vehículo existente (marca, modelo, versión, año, mercado, slug).
- No cambia `published` sin que quien administra lo pida.
- No crea migraciones ni cambia la estructura de la tabla. Si un dato real no cabe en los valores permitidos, se reporta.
- No busca ni descarga fotos: `image_url`, `image_credit` e `image_source_url` faltantes se reportan para hacerlos aparte con las reglas de "Imagen del vehículo" de `CLAUDE.md`.
- No publica el sitio. Los datos del comparador se leen en vivo de Supabase, así que no hace falta compilar para verlos.

## Carro nuevo

Cuando pidan crear un carro que no está en la tabla. Las reglas de inserción de `CLAUDE.md` ("Insertar un vehículo en `vehicles`") siguen valiendo.

1. **Comprobar que no existe** (misma marca, modelo, versión, año y mercado). Si existe, preguntar si se completa en vez de crear.
2. **Confirmar los obligatorios** con quien administra: mercado, motorización, versión y año. Si no los dio, preguntarlos juntos, en una sola pregunta, antes de investigar.
3. **Investigar:** un `vehiculos-investigador` por carro (o uno para las versiones de un mismo modelo y mercado). En el encargo, decirle que la fila no existe, que confirme la identidad (nombre exacto de la versión, `segment`, `body_style`, slug) y que dé prioridad a los campos clave del comparador.
4. **Verificar** solo lo `dudoso` con `vehiculos-verificador`. Los PDF de imágenes se descargan con `curl` y se abren con Read.
5. **Mostrar la fila** completa a quien administra: identidad, datos con su fuente, campos clave con una sola fuente para aprobar uno por uno, campos que quedan vacíos y **qué áreas del comparador quedarían "sin datos"**. Esperar un sí.
6. **Insertar** con `published = false` (la sesión principal, con `execute_sql`) y leer la fila para confirmarla.
7. **Revisar completitud:** lanzar `vehiculos-completitud` con el slug y lo aprobado. Su informe dice qué campos clave faltan; si falta alguno, ofrecer buscarlo antes de publicar.
8. **Foto:** buscarla aparte, con las reglas de "Imagen del vehículo" de `CLAUDE.md`, mostrarla y esperar un sí.
9. **Publicar** (`published = true`), hacer commit, push y desplegar solo cuando quien administra lo pida.

Todo queda en el registro `supabase/completado/AAAA-MM-DD.md`, bajo "Vehículo nuevo: <slug>".

