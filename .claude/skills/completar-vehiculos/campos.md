# Reglas para completar `vehicles`

Referencia común para la skill `completar-vehiculos` y sus agentes. Lo que dice cada campo, su unidad y sus valores permitidos está en `README.md`, sección "Base de datos: tabla `vehicles`". Si este archivo contradice a `CLAUDE.md` o al `README.md`, ganan ellos.

## Conexión

- Proyecto de Supabase: `garash`, ref `sfdwbgmydjfwmtdkarmi`. Ningún otro.
- Conector preferido: `supabase-garash` (de `.mcp.json`). Si no está autorizado, se usa el conector de Supabase de claude.ai pasando siempre `project_id: "sfdwbgmydjfwmtdkarmi"`. Nunca listar ni tocar otros proyectos.
- Solo `execute_sql`. Nada de migraciones: completar datos no cambia la estructura.

## Qué campos aplican a cada motorización

Un campo vacío solo cuenta como faltante si aplica a la motorización del carro. La consulta `auditoria.sql` aplica estas reglas.

| Grupo | Motorizaciones | Campos |
|---|---|---|
| Todos | todas | `warranty_years`, `warranty_km`, `image_url`, `image_credit`, `image_source_url`, `power_kw`, `torque_nm`, `acceleration_0_100_s`, `top_speed_kmh`, `drivetrain`, `transmission`, `co2_g_km`, `length_mm`, `width_mm`, `height_mm`, `wheelbase_mm`, `trunk_l`, `curb_weight_kg`, `seats`, `autonomous_emergency_braking`, `adaptive_cruise_control`, `lane_keeping_assist`, `blind_spot_monitor`, `camera_360`, `isofix`, `screen_inches`, `apple_carplay`, `android_auto`, `heated_seats`, `wireless_charger` |
| Electrificado | todas menos `gasoline` y `diesel` | `motor_count` |
| Enchufable | `electric`, `range_extender`, `plug_in_hybrid` | `battery_kwh`, `battery_chemistry`, `consumption_kwh_100km`, `battery_warranty_years`, `battery_warranty_km`, `dc_charge_kw`, `ac_charge_kw`, `dc_charge_from_pct`, `dc_charge_to_pct`, `dc_charge_min`, `connector`, `v2l`, `heat_pump` |
| Híbrido enchufable | `range_extender`, `plug_in_hybrid` | `electric_range_km`, `electric_range_cycle`, `combined_range_km` |
| Combustión | todas menos `electric` | `displacement_cc`, `cylinder_count`, `turbo`, `gear_count`, `fuel_consumption_l_100km`, `fuel_tank_l`, `emission_standard` |
| Autonomía | `electric` | La del ciclo del mercado: `EU` y países europeos → `range_wltp_km`; `CN` → `range_cltc_km`; `US` → `range_epa_km`. En los demás mercados (Colombia y Latinoamérica) basta con un ciclo, el que publique la marca. |

Campos opcionales, que nunca cuentan como faltantes: `airbags`, `ground_clearance_mm`, `panoramic_roof` y `ventilated_seats` (casi ninguna fuente los da por versión: el total de airbags, la altura en vacío y el equipo que cambia por acabado), `latam_name`, `article_slug`, `front_trunk_l` (muchos carros no tienen), `ncap_stars` y `ncap_body` (solo si el carro fue probado), `fuel_consumption_city_l_100km`, `fuel_consumption_highway_l_100km`, y las autonomías de ciclos distintos al del mercado. Se llenan si aparecen, pero no se buscan a la fuerza.

Campos que nunca se escriben: `id`, `slug`, `power_hp` (se calcula sola), `created_at`, `updated_at`, `published`. Tampoco se tocan los obligatorios de identidad (`brand`, `model`, `version`, `model_year`, `market`, `segment`, `body_style`, `powertrain`).

## Campos clave del comparador

El comparador puntúa siete áreas. Si a un carro le falta el dato de un área, esa área sale "sin datos" y el carro queda mal parado frente a cualquier otro. Estos campos tienen prioridad sobre todos los demás:

| Área | Campos que necesita para puntuar |
|---|---|
| Autonomía | `electric`: una autonomía en `range_wltp_km`, `range_cltc_km`, `range_epa_km` o `range_nedc_km`. `range_extender` y `plug_in_hybrid`: `combined_range_km` (batería y gasolina) con su ciclo en `electric_range_cycle`; el comparador la puntúa como autonomía total de ese ciclo y la marca "con gasolina". Para que se pueda comparar con más carros, conviene tener más de un ciclo (ver "Reglas de los datos"). |
| Potencia | `power_kw` |
| Aceleración | `acceleration_0_100_s` |
| Carga rápida | `dc_charge_from_pct`, `dc_charge_to_pct` y `dc_charge_min`, los tres juntos |
| Espacio | `trunk_l` (`front_trunk_l` suma si existe) |
| Seguridad | Al menos **3** conocidos (sí o no) de `autonomous_emergency_braking`, `adaptive_cruise_control`, `lane_keeping_assist`, `blind_spot_monitor`, `camera_360`, `isofix`; mejor los seis |
| Confort | Al menos **3** conocidos (sí o no) de `apple_carplay`, `android_auto`, `panoramic_roof`, `ventilated_seats`, `heated_seats`, `wireless_charger` |

Además, `image_url` con `image_credit`: sin foto, el carro se ve vacío en el comparador.

La consulta `../agregar-vehiculo/campos-clave.sql` comprueba todo esto por vehículo y dice si está `listo_para_publicar`.

Reglas para los campos clave:

- Si falta uno, el investigador hace una **segunda búsqueda dirigida** solo para ese campo (catálogos como Autocosmos, pruebas de prensa, bases técnicas) antes de rendirse.
- Si al final solo hay **una fuente de prensa**, o las fuentes difieren poco (492 frente a 493 L), **no se rechaza en silencio**: va como `dudoso: una fuente` y la sesión principal se lo pregunta a quien administra, con la fuente y el valor. Si lo aprueba, se escribe y el registro lo marca como "prensa, una fuente".
- Lo que nunca se hace: inventar, estimar, calcular o tomar la cifra de otra versión o de otro ciclo.
- Antes de pedir la aprobación de un lote o de un carro nuevo, la sesión principal dice **qué áreas del comparador quedarían "sin datos"** con lo que se va a escribir.

## Fuentes aceptadas

En orden de preferencia:

1. Ficha técnica oficial de la marca **para ese mercado** (PDF o página de la versión, sala de prensa).
2. Base de datos técnica reconocida: ev-database.org (Europa), fueleconomy.gov (EPA), MIIT o dongchedi/autohome (China), Euro NCAP / Latin NCAP / C-NCAP para seguridad.
3. Prensa especializada que cite la ficha (motor.es, km77, elcarrocolombiano.com, carwow…). Sola no basta: necesita una segunda fuente que coincida.

Muchas fichas oficiales son PDF hechos de imágenes. Con `poppler` instalado (`brew install poppler`), los agentes los abren directo con Read y el parámetro `pages` (por ejemplo `"1-5"`): primero se descargan con WebFetch, que deja el archivo en local, y luego se leen por páginas. Si Read falla porque falta `pdftoppm`, la sesión principal los convierte con `swift .claude/skills/completar-vehiculos/pdf2png.swift ficha.pdf ficha`. Un dato que solo está en un PDF que nadie pudo ver no se aprueba.

No sirven: foros, Wikipedia como fuente única, comparadores de precios, textos generados o páginas sin fecha que no nombran la versión.

## Reglas de los datos

- **Mismo mercado y misma versión.** El equipamiento, la garantía y la batería cambian según el país y la versión. Un dato de otro mercado solo vale para medidas, peso, motor y **autonomía en otro ciclo**, y solo si la fuente es oficial (la marca o la homologación) y confirma que es la misma batería y el mismo motor. Se marca "otro mercado" en el reporte.
- **Autonomía en varios ciclos.** La del ciclo del mercado va siempre. Si la marca publica oficialmente la misma batería y motor en otro ciclo (por ejemplo WLTP en Europa para una ficha colombiana en NEDC), también se guarda, cada cifra en su columna. Así el carro se puede comparar con más carros. Nunca se convierte una cifra de un ciclo a otro.
- **No inventar ni estimar.** Si no hay fuente, el campo queda vacío. Calcular un dato a partir de otros (consumo = batería / autonomía) tampoco vale.
- **Unidades de la tabla.** hp o CV → kW (1 hp = 0,7457 kW; 1 CV = 0,7355 kW, redondear a un decimal); lb-ft → Nm (× 1,3558); libras → kg (× 0,4536); millas → km (× 1,609); pulgadas cúbicas → cc (× 16,387); galones EE. UU. → litros (× 3,785). Toda conversión se anota en el reporte.
- **Ciclos de autonomía.** Cada cifra va en la columna de su ciclo. Nunca se pasa de un ciclo a otro. Si la fuente no dice el ciclo, la cifra no se usa.
- **Altura libre al suelo.** `ground_clearance_mm` guarda solo la medida en vacío (sin carga). Si la fuente da solo la medida a carga completa, el campo queda vacío, para no comparar condiciones distintas.
- **Garantía sin límite.** Si la garantía del carro no tiene límite de kilómetros, se guarda `warranty_km_unlimited = true` y `warranty_km` queda vacío (los años siguen en `warranty_years`). Si la de la batería no tiene límite de años ni de kilómetros, se guarda `battery_warranty_unlimited = true` y sus dos columnas quedan vacías. Nunca se pone una cifra inventada ni un cero.
- **Carga rápida.** `dc_charge_min` siempre con sus dos porcentajes (`dc_charge_from_pct`, `dc_charge_to_pct`). Sin los porcentajes, no se guarda el tiempo.
- **Sí o no.** `true` si la ficha de esa versión lo lista. `false` solo si la ficha de esa versión dice expresamente que no lo tiene (una "–" o "No" en la tabla de equipamiento, o la versión superior lo tiene y esta no). Que no aparezca mencionado **no** es `false`: queda vacío.
- **Valores permitidos.** Solo los de la lista cerrada del `README.md` (por ejemplo `connector`: `CCS1`, `CCS2`, `GBT`, `NACS`, `CHAdeMO`, `Type1`, `Type2`). Si el dato real no encaja en la lista, no se escribe y se reporta.
- **Restricciones de la tabla.** Números mayores que cero (salvo `airbags` y `co2_g_km`, que aceptan cero); `ncap_stars` de 0 a 5; `dc_charge_from_pct` < `dc_charge_to_pct`; precisión: `power_kw` y `battery_kwh` con un decimal, `acceleration_0_100_s` con dos, `consumption_kwh_100km`, `ac_charge_kw` y `screen_inches` con uno.
- **Un eléctrico** tiene `co2_g_km` = 0 y `transmission` = `single_speed` solo si la fuente lo dice (la mayoría de fichas lo dicen); no se asume.
- **No se pisa lo que ya hay.** El proceso llena campos vacíos. Si un valor existente parece errado, se reporta aparte como "posible corrección" y solo se cambia si quien administra lo aprueba de forma explícita.

## Formato de una propuesta

Cada dato encontrado viaja entre agentes como una fila con estas columnas:

| slug | campo | valor | unidad original y conversión | fuente (URL) | cita textual corta | tipo de fuente | mercado de la fuente |
|---|---|---|---|---|---|---|---|

- `valor` ya en la unidad y con el valor permitido de la tabla (`rwd`, `CCS2`, `true`).
- `cita textual corta`: el fragmento de la fuente donde aparece el dato (máximo 15 palabras), para que el verificador lo pueda encontrar.
- `tipo de fuente`: `oficial`, `base técnica` o `prensa`.

## Reporte de cambios

Cada corrida que escribe en la base deja un registro en `supabase/completado/AAAA-MM-DD.md` (si ya existe el del día, se agrega al final). Una tabla por vehículo con: campo, valor anterior (vacío), valor nuevo, fuente y verificación. Es la única traza de dónde salió cada dato, porque `source_url` guarda una sola fuente por fila.
