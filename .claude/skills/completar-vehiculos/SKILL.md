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
| 2 | `vehiculos-investigador` | Busca en la web los campos faltantes de una familia | No |
| 3 | `vehiculos-verificador` | Comprueba cada dato contra su fuente y contra la ficha | No |
| 4 | `vehiculos-escritor` | Escribe los datos aprobados, solo en campos vacíos | **Sí** |
| 5 | `vehiculos-completitud` | Relee las filas y confirma qué quedó completo | No |

El verificador va **antes** de escribir: a la base solo llega lo comprobado. Entre el paso 3 y el 4 está la aprobación de quien administra.

## Flujo

### 1. Auditar

Lanza `vehiculos-auditor`. Si pidieron un alcance concreto (un slug, una marca, un mercado, "los de Colombia"), pásaselo. Muestra a quien administra el resumen y los lotes, y pregunta por cuáles empezar si no lo dijo. Por defecto, de menos a más completos.

### 2. Investigar

Trabaja por lotes de hasta **3 familias** (unos 10 vehículos). Lanza un `vehiculos-investigador` **por familia**, en paralelo en el mismo mensaje. A cada uno le pasas, del informe del auditor:

- marca, modelo, año, mercado, `powertrain` y `latam_name` si lo hay;
- cada slug con su versión, su `source_url` actual y sus campos faltantes.

No le pases las conclusiones de otro investigador: cada familia se busca por separado.

### 3. Verificar

Si un investigador dice que la ficha oficial es un PDF en imágenes que no pudo leer, conviértelo antes a PNG (ver "Fuentes aceptadas" en `campos.md`) y pasa las rutas al verificador.

Junta las propuestas del lote y lanza `vehiculos-verificador` con ellas (uno por familia, en paralelo, si son muchas filas). Que no sea el mismo agente que investigó: la verificación tiene que ser independiente.

### 4. Pedir aprobación

Muestra a quien administra, por vehículo:

- los datos **aprobados** y **corregidos** que se van a escribir (campo, valor, fuente);
- cuántos se rechazaron y por qué, en una línea;
- las **posibles correcciones** a valores ya guardados, en una lista aparte, para aprobar una por una.

Recuerda que estos vehículos están publicados (`published = true`): lo que se escriba se ve en el comparador al instante. Espera un sí claro antes del paso 5. La aprobación vale para este lote, no para los siguientes. Si quien administra quita o cambia algún dato, respétalo.

### 5. Escribir

Lanza `vehiculos-escritor` con la tabla final aprobada, diciendo expresamente que quien administra la aprobó en el chat (y qué correcciones, si aprobó alguna). Si no hubo aprobación, no lo lances.

### 6. Revisar completitud

Lanza `vehiculos-completitud` con los slugs tocados, la tabla de aprobados y el % de antes (del auditor). Muestra su tabla.

### 7. Siguiente lote

Pregunta si se sigue con el siguiente lote. Al terminar, resume: vehículos tocados, campos llenados, % promedio antes y después, campos que nadie pudo llenar y la ruta de `supabase/completado/AAAA-MM-DD.md`. Ofrece hacer commit de ese registro (no hagas commit sin que lo pidan).

## Lo que no hace esta skill

- No inserta vehículos nuevos ni cambia la identidad de uno existente (marca, modelo, versión, año, mercado, slug).
- No cambia `published`.
- No crea migraciones ni cambia la estructura de la tabla. Si un dato real no cabe en los valores permitidos, se reporta.
- No busca ni descarga fotos: `image_url`, `image_credit` e `image_source_url` faltantes se reportan para hacerlos aparte con las reglas de "Imagen del vehículo" de `CLAUDE.md`.
- No publica el sitio. Los datos del comparador se leen en vivo de Supabase, así que no hace falta compilar para verlos.
