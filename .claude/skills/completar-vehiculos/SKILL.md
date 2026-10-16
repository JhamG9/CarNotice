---
name: completar-vehiculos
description: Orquesta el llenado de datos faltantes en la tabla vehicles de Supabase (comparador de Mejor Eléctrico) con cinco agentes - auditor, investigador, verificador, escritor y revisor de completitud. Usar cuando pidan completar, rellenar, auditar o revisar fichas incompletas de vehículos, o buscar en la web los datos que faltan de un carro ya insertado. No sirve para insertar carros nuevos (eso sigue las reglas de CLAUDE.md).
---

# Completar fichas de vehículos

Coordina a cinco agentes para encontrar fichas incompletas en `vehicles`, buscar los datos en la web, verificarlos y escribirlos. Tú (la sesión principal) eres el orquestador: lanzas a los agentes, juntas lo que devuelven y hablas con quien administra. Los agentes no hablan entre sí; todo pasa por ti.

Reglas comunes, conexión y qué campos aplican a cada motorización: [campos.md](campos.md). Léelo antes de empezar.

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
- las **posibles correcciones** a valores ya guardados, en una lista aparte, para aprobar una por una.

Recuerda que estos vehículos están publicados (`published = true`): lo que se escriba se ve en el comparador al instante. Espera un sí claro antes del paso 5. La aprobación vale para este lote, no para los siguientes. Si quien administra quita o cambia algún dato, respétalo.

### 5. Escribir

Lanza `vehiculos-escritor` con la tabla final aprobada, diciendo expresamente que quien administra la aprobó en el chat (y qué correcciones, si aprobó alguna). Si no hubo aprobación, no lo lances.

### 6. Revisar completitud

Lanza `vehiculos-completitud` con los slugs tocados, la tabla de aprobados y el % de antes (del auditor). Muestra su tabla. En un lote pequeño (hasta 4 vehículos), puedes hacerlo tú: ejecuta `auditoria.sql` filtrado a esos slugs y compara con lo aprobado.

### 7. Siguiente lote

Pregunta si se sigue con el siguiente lote. Al terminar, resume: vehículos tocados, campos llenados, % promedio antes y después, campos que nadie pudo llenar y la ruta de `supabase/completado/AAAA-MM-DD.md`. Ofrece hacer commit de ese registro (no hagas commit sin que lo pidan).

## Lo que no hace esta skill

- No inserta vehículos nuevos ni cambia la identidad de uno existente (marca, modelo, versión, año, mercado, slug).
- No cambia `published`.
- No crea migraciones ni cambia la estructura de la tabla. Si un dato real no cabe en los valores permitidos, se reporta.
- No busca ni descarga fotos: `image_url`, `image_credit` e `image_source_url` faltantes se reportan para hacerlos aparte con las reglas de "Imagen del vehículo" de `CLAUDE.md`.
- No publica el sitio. Los datos del comparador se leen en vivo de Supabase, así que no hace falta compilar para verlos.
