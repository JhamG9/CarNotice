# Mejor Eléctrico

Sitio: [mejorelectrico.com](https://mejorelectrico.com). El proyecto se llamó "Garash" durante el desarrollo; por eso la carpeta, el proyecto de Supabase y el conector conservan ese nombre.

Revista de carros: noticias, lanzamientos, eléctricos y pruebas. Incluye un comparador de carros (`/es/comparador/`), que lee sus datos de la tabla `vehicles` descrita en este documento.

- Reglas del proyecto, diseño y forma de trabajo: [CLAUDE.md](CLAUDE.md).
- Detalle de diseño de cada plantilla: [design-system/MASTER.md](design-system/MASTER.md).

## Cómo correr el sitio

```bash
npm install
```

```bash
npx astro dev --background --port 4330
```

El sitio queda en `http://localhost:4330/es/`. Se detiene con `npx astro dev stop`.

Para conectarse a la base de datos, copia `.env.example` como `.env` y completa los valores.

## Base de datos: tabla `vehicles`

Guarda las fichas técnicas del comparador de carros. Vive en Supabase, en el proyecto `garash`.

- Estructura exacta en SQL: [supabase/migrations/20261011_create_vehicles.sql](supabase/migrations/20261011_create_vehicles.sql) y [20261011_add_vehicle_image_credit_and_latam_name.sql](supabase/migrations/20261011_add_vehicle_image_credit_and_latam_name.sql).
- Reglas para insertar un vehículo: [CLAUDE.md](CLAUDE.md), sección "Base de datos (Supabase)".

Cada fila es una versión de un carro, en un año modelo y para un mercado. El mismo carro puede tener varias filas: una por versión y una por país.

### Cómo leer las tablas

- Los nombres de columna y los valores guardados van en inglés.
- **Obligatorio** significa que la fila no se puede guardar sin ese dato. Todo lo demás es opcional y queda vacío si no se conoce.
- En los campos de sí o no, vacío significa "no se sabe" y "no" significa "el carro no lo tiene". No son lo mismo.
- Los valores numéricos no aceptan cero ni negativos, salvo donde se indique.
- No se guardan precios.

Si la tabla cambia, este documento se actualiza en el mismo cambio.

### 1. Identidad

| Campo | Qué guarda |
|---|---|
| `id` | Identificador interno. Se genera solo; no se escribe. |
| `slug` | **Obligatorio.** Identificador legible y único, armado con marca, modelo, versión, año y mercado. Ejemplo: `deepal-s05-620-premium-lidar-2027-cn`. |
| `brand` | **Obligatorio.** Marca, siempre escrita igual ("BYD", no "Byd"). |
| `model` | **Obligatorio.** Modelo. Ejemplo: S05. |
| `version` | **Obligatorio.** Versión o nivel de equipamiento. Ejemplo: 620 Premium LiDAR. |
| `model_year` | **Obligatorio.** Año modelo, entre 1990 y 2100. |
| `market` | **Obligatorio.** País al que corresponde la ficha, con su código de dos letras en mayúsculas: `CN` (China), `CO` (Colombia), `DE` (Alemania). Se usa `EU` para una ficha válida en toda Europa. La misma versión cambia de batería y equipamiento según el país. |
| `segment` | **Obligatorio.** Tamaño del carro. Valores: `mini`, `small`, `compact`, `midsize`, `large`, `luxury`. |
| `body_style` | **Obligatorio.** Forma de la carrocería. Valores: `hatchback`, `sedan`, `suv`, `coupe_suv`, `wagon`, `coupe`, `convertible`, `pickup`, `minivan`, `van`. Un SUV compacto es `segment` "compact" y `body_style` "suv". |
| `powertrain` | **Obligatorio.** Tipo de motorización. Ver la lista de abajo. |
| `warranty_years` | Garantía general del carro, en años. |
| `warranty_km` | Garantía general del carro, en kilómetros. |
| `image_url` | Ruta de la imagen del vehículo, sin dominio. Ejemplo: `/vehicles/deepal-s05-620-premium-lidar-2027-cn.webp`. El archivo va en la carpeta `public/vehicles/`. |
| `image_credit` | Autor y licencia de la foto, por ejemplo `Alexander Migl, CC BY-SA 4.0`. Si la foto muestra un modelo hermano (el mismo carro con otro nombre en otro país), empieza por ese nombre: `Baojun Yep Plus · KitsuneDP, CC0`. El comparador lo muestra bajo la foto como "Foto de referencia". |
| `image_source_url` | Página donde se publicó la foto (por ejemplo, su página en Wikimedia Commons). El crédito enlaza ahí. |
| `latam_name` | Nombre con que se vende el carro en Latinoamérica, solo cuando es distinto de marca y modelo. Ejemplo: el BYD Dolphin Surf europeo se vende como `BYD Seagull`. Si tiene varios nombres según el país, van separados por " / ": `BYD Seagull / BYD Dolphin Mini`. En una ficha latinoamericana guarda el otro nombre con que se conoce en la región (el Seagull colombiano es `BYD Dolphin Mini` en México, Brasil y Chile). Se deja vacío si el nombre es el mismo o no se conoce. |
| `source_url` | Enlace de donde salió la ficha, para poder verificarla después. |
| `article_slug` | Slug de la nota de la revista que habla de este carro, si existe. Ejemplo: `deepal-s05-lidar-2027`. |

Valores de `powertrain`:

| Valor | Significado |
|---|---|
| `electric` | Eléctrico de batería. |
| `range_extender` | Eléctrico de rango extendido: un motor de gasolina solo recarga la batería. |
| `plug_in_hybrid` | Híbrido enchufable. |
| `hybrid` | Híbrido convencional, no se enchufa. |
| `mild_hybrid` | Híbrido ligero. |
| `gasoline` | Gasolina. |
| `diesel` | Diésel. |

### 2. Rendimiento

| Campo | Qué guarda |
|---|---|
| `power_kw` | Potencia máxima en kilovatios. Es el dato base de potencia. Si la fuente da hp o CV, se convierte a kW antes de guardar. |
| `power_hp` | Potencia en caballos de fuerza. Se calcula sola a partir de `power_kw`; no se escribe. |
| `torque_nm` | Torque máximo, en newton metro. |
| `acceleration_0_100_s` | Segundos de 0 a 100 km/h. Admite dos decimales (6,28). |
| `top_speed_kmh` | Velocidad máxima, en km/h. |
| `drivetrain` | Tracción. Valores: `fwd` (delantera), `rwd` (trasera), `awd` (total). |
| `motor_count` | Número de motores eléctricos. |

### 3. Batería y autonomía

| Campo | Qué guarda |
|---|---|
| `battery_kwh` | Capacidad de la batería, en kWh. |
| `battery_chemistry` | Química de la batería. Valores: `LFP`, `NMC`, `NCA`, `LMFP`, `sodium_ion`, `solid_state`, `other`. |
| `range_wltp_km` | Autonomía total en ciclo WLTP (Europa), en km. |
| `range_cltc_km` | Autonomía total en ciclo CLTC (China), en km. Suele ser más alta que la WLTP del mismo carro. |
| `range_epa_km` | Autonomía total en ciclo EPA (Estados Unidos), en km. |
| `range_nedc_km` | Autonomía total en ciclo NEDC (ciclo antiguo), en km. |
| `consumption_kwh_100km` | Consumo eléctrico, en kWh cada 100 km. |
| `battery_warranty_years` | Garantía de la batería, en años. |
| `battery_warranty_km` | Garantía de la batería, en kilómetros. |

Hay una columna de autonomía por cada ciclo de medición porque las cifras no son comparables entre ciclos. Solo se compara WLTP con WLTP, CLTC con CLTC, y así. Nunca se convierte una cifra de un ciclo a otro.

### 4. Combustión e híbridos

| Campo | Qué guarda |
|---|---|
| `displacement_cc` | Cilindrada del motor, en centímetros cúbicos. |
| `cylinder_count` | Número de cilindros. |
| `turbo` | Sí o no: tiene turbo. |
| `transmission` | Tipo de caja. Valores: `manual`, `automatic`, `cvt`, `dual_clutch` (doble embrague), `single_speed` (una sola relación, típica de los eléctricos). |
| `gear_count` | Número de marchas. |
| `fuel_consumption_l_100km` | Consumo combinado, en litros cada 100 km. |
| `fuel_consumption_city_l_100km` | Consumo en ciudad, en litros cada 100 km. |
| `fuel_consumption_highway_l_100km` | Consumo en carretera, en litros cada 100 km. |
| `fuel_tank_l` | Capacidad del tanque, en litros. |
| `electric_range_km` | Autonomía solo eléctrica, en km. Para híbridos enchufables y rango extendido. |
| `electric_range_cycle` | Ciclo con que se midió `electric_range_km`. Valores: `WLTP`, `CLTC`, `EPA`, `NEDC`. |
| `combined_range_km` | Autonomía total sumando batería y tanque, en km. Para híbridos enchufables y rango extendido. |
| `co2_g_km` | Emisiones de CO2, en gramos por km. Acepta cero. |
| `emission_standard` | Norma de emisiones que cumple. Valores: `euro_4`, `euro_5`, `euro_6`, `euro_7`, `china_6`, `epa_tier_3`, `other`. |

### 5. Carga

| Campo | Qué guarda |
|---|---|
| `dc_charge_kw` | Potencia máxima de carga rápida (corriente continua), en kW. |
| `ac_charge_kw` | Potencia máxima de carga lenta (corriente alterna), en kW. |
| `dc_charge_from_pct` | Porcentaje de batería donde empieza la medición de carga rápida. |
| `dc_charge_to_pct` | Porcentaje donde termina. Debe ser mayor que el anterior. |
| `dc_charge_min` | Minutos que tarda la carga rápida entre esos dos porcentajes. |
| `connector` | Tipo de conector de carga. Valores: `CCS1`, `CCS2`, `GBT`, `NACS`, `CHAdeMO`, `Type1`, `Type2`. |
| `v2l` | Sí o no: puede alimentar aparatos externos desde la batería. |

Ejemplo: una carga del 30 al 80 % en 15 minutos se guarda como `dc_charge_from_pct` 30, `dc_charge_to_pct` 80 y `dc_charge_min` 15.

### 6. Medidas y espacio

Las medidas van en milímetros, como en la ficha del fabricante.

| Campo | Qué guarda |
|---|---|
| `length_mm` | Largo. |
| `width_mm` | Ancho. |
| `height_mm` | Alto. |
| `wheelbase_mm` | Distancia entre ejes. |
| `trunk_l` | Baúl trasero con los asientos en uso, en litros. |
| `front_trunk_l` | Baúl delantero, en litros. Común en eléctricos. |
| `curb_weight_kg` | Peso en vacío: el carro sin pasajeros ni carga, en kilos. |
| `ground_clearance_mm` | Altura libre al suelo. |
| `seats` | Número de puestos. |

### 7. Seguridad

| Campo | Qué guarda |
|---|---|
| `airbags` | Número de bolsas de aire. Acepta cero. |
| `autonomous_emergency_braking` | Sí o no: frenado autónomo de emergencia. |
| `adaptive_cruise_control` | Sí o no: control de crucero adaptativo. |
| `lane_keeping_assist` | Sí o no: asistente de mantenimiento de carril. |
| `blind_spot_monitor` | Sí o no: alerta de punto ciego. |
| `camera_360` | Sí o no: cámara de 360 grados. |
| `isofix` | Sí o no: anclajes ISOFIX para sillas de niños. |
| `ncap_stars` | Estrellas en pruebas de choque, de 0 a 5. |
| `ncap_body` | Organismo que hizo la prueba. Valores: `euro_ncap`, `latin_ncap`, `c_ncap`, `ancap`, `asean_ncap`, `global_ncap`, `nhtsa`. Las estrellas de un organismo no equivalen a las de otro. |

### 8. Confort y tecnología

| Campo | Qué guarda |
|---|---|
| `screen_inches` | Tamaño de la pantalla central, en pulgadas. |
| `apple_carplay` | Sí o no: Apple CarPlay. |
| `android_auto` | Sí o no: Android Auto. |
| `panoramic_roof` | Sí o no: techo panorámico. |
| `ventilated_seats` | Sí o no: asientos ventilados. |
| `heated_seats` | Sí o no: asientos con calefacción. |
| `wireless_charger` | Sí o no: cargador inalámbrico para el celular. |
| `heat_pump` | Sí o no: bomba de calor. |

### 9. Control

| Campo | Qué guarda |
|---|---|
| `published` | Sí o no. Solo los vehículos con "sí" se ven en el sitio. Toda fila nueva entra con "no" y se publica cuando quien administra lo pida. |
| `created_at` | Fecha y hora en que se creó la fila. Se llena sola. |
| `updated_at` | Fecha y hora del último cambio. Se actualiza sola. |

### Reglas de la tabla

- No puede haber dos filas con la misma marca, modelo, versión, año y mercado.
- El `slug` no se puede repetir.
- El sitio solo puede leer, y solo las filas publicadas. Nadie puede insertar, modificar ni borrar desde el sitio; eso lo hace quien administra.
- Las listas de valores permitidos son cerradas. Si falta una opción (un conector nuevo, otro organismo de pruebas), se agrega con una migración.
