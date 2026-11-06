# Mejor Eléctrico

Sitio web de carros: un comparador de carros y una revista con noticias, lanzamientos, eléctricos y de combustión.

- Nombre del sitio: **Mejor Eléctrico**, dos palabras, con tilde. Así va en el logo, los títulos de página ("… | Mejor Eléctrico"), el pie y los datos estructurados.
- Dominio: `https://mejorelectrico.com`, sin `www`. Se define en `astro.config.mjs` (`SITIO`).
- El proyecto se llamó "Garash" durante el desarrollo. Ese nombre ya no se muestra en el sitio, pero sigue en identificadores internos que no se renombran: la carpeta del proyecto, el proyecto de Supabase (`garash`) y el conector (`supabase-garash`).

## Alcance actual

- Fase 1 (construida): la revista. Portada, página de artículo, página de sección (categorías y etiquetas) y página 404.
- Inglés (desde el 2026-11-05): todo el sitio existe en `/en/`: revista, carros, comparador, comparaciones, páginas institucionales, 404 e imágenes `/og/`. Ver "Idiomas".
- Fase 2 (en construcción): el comparador de carros, en `/es/comparador/`. Ya existe: elegir dos carros, gráfico de araña, ventajas de cada uno y ficha técnica. Además, cada modelo tiene su página (`/es/carros/<modelo>/`) y cada comparación entre rivales también (`/es/comparador/<modelo-a>-vs-<modelo-b>/`), generadas al compilar para que Google las encuentre. Ver "Páginas de carros y comparaciones".

## Público

- Personas de 25 a 40 años con gusto por los vehículos.
- Audiencia internacional, no solo Colombia. El sitio tendrá cinco idiomas: español, inglés, francés, alemán y portugués. El español es el primero y el inglés ya está completo.
- En cada idioma, todo el texto de la interfaz va en ese idioma ("Cargar más" en español, "Load more" en inglés).
- Los textos de interfaz están en `src/i18n/es.ts` y `src/i18n/en.ts`, también los del comparador, las fichas y los valores guardados en inglés en la tabla: un texto nuevo se escribe en los dos (TypeScript avisa si falta).
- Idioma y país son cosas distintas: el prefijo `/es/` indica el idioma de la página, no de dónde viene la noticia.

## Stack

- Astro para las páginas (contenido renderizado en servidor, pensado para SEO).
- React solo para componentes interactivos (islas).
- Fuentes autoalojadas con Fontsource, no desde el CDN de Google.
- Tailwind 4 para los estilos, con los tokens de este archivo.

## Idiomas

- `src/i18n/`: idiomas (`idiomas.ts`, con `idiomaDe(url)` que saca el idioma del prefijo de la ruta), textos de interfaz y `LOCALE` para `Intl`. Las fechas (`fechas.ts`) y el `lang`, `og:locale` e `hreflang` de `Base.astro` dependen del idioma de la página.
- Rutas por idioma en `src/lib/rutas.ts` (`SEGMENTOS`): en inglés `/en/news/<slug>/` (nota), `/en/blog/` (listado), `/en/category/<slug>/`, `/en/tag/<slug>/`, `/en/cars/`, `/en/compare/`. `/en/news/` redirige a `/en/blog/`. Cada función de ruta recibe el idioma (por defecto `es`).
- `CONSTRUIDAS` en `rutas.ts` dice qué secciones existen en cada idioma; en inglés ya están todas. Al sumar un idioma, sus secciones se añaden ahí a medida que existan: mientras tanto, sus enlaces llevan a la página en español.
- Las plantillas de carros, comparador, comparación y 404 están en `src/layouts/` (`PaginaModelo`, `IndiceCarros`, `ComparadorLibre`, `PaginaComparacion`, `Pagina404`) y sacan el idioma de la URL; las páginas de `src/pages/es/` y `src/pages/en/` solo las llaman. Las institucionales usan `Institucional.astro` con el texto de cada idioma en su página (`/en/about/`, `/en/legal-notice/`, `/en/privacy-policy/`).
- `Comparador.tsx` y sus componentes reciben `idioma` como prop y sacan los textos de `src/i18n/`. Las funciones de `src/lib/vehiculos.ts` y `catalogo.ts` reciben el idioma (por defecto `es`). Las áreas del gráfico se identifican por `clave` (`autonomia`…), no por su nombre.
- Los datos en la interfaz en inglés: km con millas al lado (`conMillas`), km/h con mph, potencia con hp, números con formato inglés. La tabla guarda en español `image_credit` ("foto oficial", "Kia España") y la versión "Única": `creditoFoto` y `nombreVersion` los traducen al mostrarlos. Un crédito con un país nuevo se añade a `CREDITOS` en `vehiculos.ts`.
- La 404 en inglés se compila en `/en/404/` y una integración de `astro.config.mjs` la copia a `dist/en/404.html`, que Cloudflare sirve para las rutas de `/en/` que no existen.
- Imágenes para compartir en inglés: `/og/en/cars/<modelo>.jpg` y `/og/en/compare/<par>.jpg`.
- Las categorías tienen nombre, slug y descripción en inglés en `src/data/categorias.ts` (`textoCategoria`). La clave (`lanzamientos`…) no cambia.
- Notas en inglés: colección `notasEn`, en `src/content/notas-en/<slug-en-ingles>.md`. Mismos campos que las de español, más `original` con el slug de la nota en español (la compilación falla si no existe). El slug se elige para búsquedas en inglés; la imagen es la misma de la original. Las etiquetas van en inglés, con el glosario de las ya usadas.
- Dentro del texto, las notas traducidas dejan los enlaces internos como en español (`/es/notas/…`, `/es/carros/…`): `CuerpoTraducido.astro` los cambia por la página en inglés si existe.
- Cada página traducida se enlaza con su original por `hreflang` (prop `alternativas` de `Base.astro`); `x-default` apunta al inglés. La cabecera lleva un enlace al otro idioma (a la misma página si está traducida, si no a la portada).
- Se traduce todo: cada nota en español tiene su versión en inglés, también las de Colombia (impuestos, crédito, pico y placa), que dicen "Colombia" en el titular y explican en una línea cada institución local (DIAN, RUNT, SOAT). Una nota nueva se publica en los dos idiomas. En la traducción: km y kW con millas y hp entre paréntesis (no en la potencia de carga), precios en su moneda sin convertir (`COP 89.99 million`), y las mismas reglas de redacción.
- Las plantillas de nota (`layouts/Articulo.astro`) y portada (`layouts/Portada.astro`) son una sola para los dos idiomas; las páginas de `src/pages/es/` y `src/pages/en/` solo las llaman.

## Reglas de trabajo

- Páginas y layouts en `.astro`; componentes interactivos en `.tsx`. No crear páginas `.md` ni `.mdx` dentro de `src/pages`.
- El contenido de las notas va en Markdown dentro de la content collection `notas`. Las notas solo llevan texto y datos; el diseño lo pone la plantilla `.astro`.
- El slug de una nota es el nombre de su archivo, no su titular.
- Las categorías son fijas (Lanzamientos, Noticias, Eléctricos y Pruebas) y dicen qué tipo de nota es. Los países van como etiqueta ("Colombia", "Alemania"), no como categoría, y solo cuando el país es el tema de la nota.
- La skill `ui-ux-pro-max` (en `.claude/skills/`) se usa para UX, accesibilidad y pautas de Astro. Su paleta, sus fuentes y su patrón de página no se usan: si contradice este archivo, gana este archivo. No usar su `--persist`.
- El detalle de diseño de cada plantilla está en `design-system/MASTER.md`.

## Redacción de notas y artículos

Toda nota o artículo se escribe siguiendo estas reglas de forma estricta, sin excepción:

1. No usar comentario editorial de relleno ("es importante señalar que", "vale la pena destacar que", "ninguna discusión estaría completa sin", "cabe mencionar que"). Afirmar el punto directamente.
2. No cerrar con conclusiones estereotipadas ("en conclusión", "en resumen", "en general", "para finalizar"). Terminar con una idea concreta.
3. No usar calificativos promocionales o exagerados ("impresionante", "revolucionario", "extraordinario", "fascinante") a menos que estén justificados por un dato o ejemplo en la misma oración.
4. No hacer afirmaciones vagas o grandilocuentes sin evidencia. Si falta evidencia, reducir el alcance de la afirmación.
5. No hacer análisis superficial: cada hecho va acompañado de una interpretación, causa o consecuencia, no solo enumerado.
6. Nunca inventar referencias, DOI, ISBN o enlaces. Si no hay una fuente verificada, decirlo explícitamente en vez de inventarla.
7. No dejar frases de chatbot en el texto final ("aquí está tu artículo sobre...", "espero que esto ayude", "¿necesitas algo más?").
8. Cuidar el formato: comillas correctas, sin marcado roto, sin errores repetidos. Usar rayas largas (—) solo cuando sean gramaticalmente necesarias; preferir coma o punto y seguido.
9. No abusar de conectores de relleno ("además", "por otra parte", "asimismo", "moreover"). Máximo uno por párrafo y solo si aporta una transición real.
10. Variar la longitud y estructura de los párrafos. No repetir el mismo patrón en cada uno. Evitar las listas de tres elementos como recurso automático.
11. No dejar residuos técnicos: sin placeholders sin rellenar, sin fragmentos de código ni enlaces rotos.

## Imágenes de las notas

Quien publica suele pasar las imágenes por el chat, junto con el texto de la nota. Todas se guardan en `src/assets/images/`.

Al recibir una imagen:

1. Guardarla en `src/assets/images/` con el slug de la nota como nombre y en formato WebP (`suv-electrico-compacto.webp`). Si la nota lleva varias, añadir un sufijo: `-2`, `-interior`.
2. Convertirla a WebP y reducirla antes de guardarla: unos 2.000 px de ancho y menos de 300 KB por imagen. Si no baja de 300 KB, bajar la calidad o el ancho (mínimo 1.600 px) hasta que cumpla. No guardar el original (JPG o PNG) en el proyecto.

   Se convierte con `sharp`, que ya viene con Astro:

   ```bash
   node -e "require('sharp')(process.argv[1]).rotate().resize({width:2000,withoutEnlargement:true}).webp({quality:80}).toFile(process.argv[2])" entrada.jpg src/assets/images/slug-de-la-nota.webp
   ``` Las de sala de prensa suelen pesar entre 5 y 20 MB, y git las guarda para siempre.
3. Enlazarla en el Markdown de la nota con `imagen` e `imagenAlt` (obligatorio), y con `imagenPie` e `imagenCredito` si se conocen. Las imágenes intermedias van en el cuerpo, con su pie en cursiva en la línea siguiente.
4. Preguntar de dónde viene la foto si no lo dicen: el crédito no se inventa.
5. Compilar con `npm run build` para comprobar que la nota pasa el esquema.

Si la imagen llega pegada en el chat y no hay un archivo en disco para copiar, pedir la ruta del archivo o que la dejen en `src/assets/images/`.

No guardar imágenes de notas en `public/` ni enlazar directo a la web del fabricante: desde `src/assets/` Astro las optimiza, y los enlaces externos se rompen. La única excepción son las imágenes de los vehículos del comparador (ver "Imagen del vehículo").

## Base de datos (Supabase)

Supabase guarda los datos del comparador de carros. Las notas siguen en Markdown, no en la base de datos.

- El único proyecto de Supabase de este sitio es `garash` (ref `sfdwbgmydjfwmtdkarmi`). No leer ni modificar ningún otro proyecto de la organización, aunque el conector lo permita.
- El archivo `.mcp.json` define el conector `supabase-garash`, limitado a ese proyecto. Es el que se debe usar.
- Variables en `.env` (no se sube a git; la plantilla es `.env.example`): `SUPABASE_PROJECT_REF`, `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- En `.env` solo va la clave publicable. La clave secreta y la contraseña de la base de datos no se guardan en el proyecto ni se pegan en el chat.
- Permisos de Claude sobre la base de datos: van en `.claude/settings.local.json`, que es personal y no se sube a git. La plantilla es `.claude/settings.local.example.json`: se copia con ese nombre y permite a Claude leer y escribir datos y aplicar migraciones con el conector `supabase-garash`, sin que la app pregunte cada vez. No incluye crear, pausar ni borrar proyectos.
- Los cambios de estructura (tablas, columnas, políticas) se hacen como migraciones, no con SQL suelto.
- Los vehículos nuevos se agregan siempre con la skill `agregar-vehiculos` y los datos que les faltan se llenan con `completar-vehiculos` (ver más abajo).
- Toda tabla lleva seguridad por fila (RLS) activada. El sitio solo puede leer; escribir queda para quien administra.
- Antes de borrar o modificar varias filas, mostrar el cambio y esperar confirmación. Excepción: llenar y corregir fichas con la skill `completar-vehiculos`, donde quien administra delegó la decisión (ver "Completar fichas incompletas").

### Tabla `vehicles`

Guarda las fichas técnicas del comparador: una fila por versión, año modelo y mercado. La estructura completa está en `supabase/migrations/`. La explicación de cada campo, en lenguaje sencillo, está en `README.md`, en la raíz del proyecto. Nombres de columna y valores guardados van en inglés; la traducción la pone la interfaz.

- Antes de insertar, modificar o consultar vehículos, o de cambiar la tabla, leer la sección "Base de datos: tabla `vehicles`" del `README.md`: dice qué guarda cada campo, en qué unidad y qué valores acepta.
- No tiene precio: por ahora no se guardan precios.
- `latam_name` guarda el nombre con que se vende el carro en Latinoamérica cuando cambia (el Dolphin Surf europeo es el Seagull). Si son varios, van separados por " / ". En una ficha latinoamericana guarda el otro nombre de la región (el Seagull colombiano es el Dolphin Mini en México, Brasil y Chile). Solo se llena con un dato confirmado. El comparador lo muestra bajo el nombre del carro y en la lista: "En Latinoamérica: …" en fichas de fuera y "También se conoce como …" en las latinoamericanas.
- La autonomía tiene una columna por ciclo (`range_wltp_km`, `range_cltc_km`, `range_epa_km`, `range_nedc_km`). En la base no se convierte de un ciclo a otro; el comparador estima el equivalente WLTP solo cuando dos carros no comparten ciclo (ver "Comparador").
- `dc_charging = false` dice que el carro no tiene carga rápida en DC (solo AC). Sus columnas `dc_charge_*` quedan vacías y el comparador muestra "No tiene" y puntúa 0, en vez de "sin datos". Solo con una fuente que lo diga (la ficha solo trae carga AC, o la prensa dice que no tiene carga rápida).
- La potencia se guarda en kW (`power_kw`); `power_hp` se calcula sola y no se escribe.
- `updated_at` se actualiza sola con cada cambio.
- En los equipamientos (sí o no), vacío significa "no se sabe" y `false` significa "no lo trae de serie". Si la versión no nombra un acabado, la fila describe el acabado más básico con esa batería y motor en ese mercado.
- El sitio solo lee las filas con `published = true`.

### Insertar un vehículo en `vehicles`

**Todo vehículo que se agregue a la base se agrega con la skill `agregar-vehiculos`, por defecto y sin excepción**, venga como venga el pedido: un nombre en el chat, una lista separada por comas, un Excel o CSV, un PDF, una captura de pantalla o una página web ("mira los carros de esta página y agrega los que no estén"). Aunque no nombren la skill, se usa. Nunca con un `insert` suelto. La skill saca primero la lista del formato que llegue, revisa cuáles ya existen en la base para no duplicar fichas ni modelos, y sigue su flujo con los que falten.

Quien administra suele pedir por el chat que se inserte un carro. Se hace con la skill `agregar-vehiculos` (`.claude/skills/agregar-vehiculos/`), que sigue el mismo flujo de agentes de `completar-vehiculos`: revisa la base, investiga en la web, verifica lo dudoso, inserta, completa lo que falte, pone la foto y revisa el candado. Estos datos son obligatorios:

| Dato que se pide | Columna | Valores |
|---|---|---|
| Marca | `brand` | Texto, siempre escrita igual ("BYD", no "Byd") |
| Modelo | `model` | Texto |
| Versión | `version` | Texto |
| Año modelo | `model_year` | Número |
| Mercado de la ficha | `market` | Código de país de dos letras: `CN`, `CO`, `DE`. `EU` para una ficha europea |
| Tamaño | `segment` | `mini`, `small`, `compact`, `midsize`, `large`, `luxury` |
| Carrocería | `body_style` | `hatchback`, `sedan`, `suv`, `coupe_suv`, `wagon`, `coupe`, `convertible`, `pickup`, `minivan`, `van` |
| Motorización | `powertrain` | `electric`, `range_extender`, `plug_in_hybrid`, `hybrid`, `mild_hybrid`, `gasoline`, `diesel` |

El `slug` también es obligatorio, pero no se pide: se arma con marca, modelo, versión, año y mercado (`deepal-s05-620-premium-lidar-2027-cn`).

Reglas:

- Si falta alguno de los obligatorios, pedirlo antes de insertar.
- Los demás datos son opcionales: se llenan los que se conozcan y el resto queda vacío. No inventar ni estimar ninguno.
- Preguntar siempre de qué mercado es la ficha: la misma versión cambia de batería y equipamiento según el país.
- Preguntar bajo qué ciclo se midió cada autonomía y guardarla en su columna. No pasar una cifra de un ciclo a otro.
- Convertir a las unidades de la tabla si llegan en otras (hp o CV a kW, libras a kilos, lb-ft a Nm, millas a kilómetros) y decir qué conversión se hizo.
- Guardar en `source_url` de dónde salió la ficha.
- Antes de insertar, buscar si ya existe la misma marca, modelo, versión, año y mercado, y también el mismo modelo en otra versión o mercado o con otro nombre (`latam_name`). Si existe la misma ficha, se completa con `completar-vehiculos`. Si existe el modelo, la fila nueva usa exactamente la misma escritura de `brand` y `model`: de ahí sale la página `/es/carros/<marca-modelo>/` que agrupa sus versiones.
- Insertar con `published = false`. Se publica solo cuando quien administra lo pida **y** el carro pase el candado de `campos-clave.sql` (las siete áreas del comparador con datos y foto con crédito). Publicar con un área vacía solo si quien administra lo dice expresamente para ese carro.
- Mostrar la fila que se va a insertar y esperar confirmación, salvo en modo delegado: la decisión delegada de "Completar fichas incompletas" también vale para esta skill, para los datos, la inserción con `published = false` y la foto. Publicar (`published = true`) y desplegar se piden siempre en el momento.
- Después de insertar, leer la fila y confirmar el resultado con su `slug`.

Cuando la tabla cambie de columnas o de valores permitidos, actualizar esta sección y el `README.md` en el mismo cambio.

### Imagen del vehículo

Las imágenes del comparador se guardan en el proyecto, en `public/vehicles/`, y la tabla solo guarda la ruta en `image_url`.

- Van en `public/` y no en `src/assets/` porque la base de datos necesita una ruta que no cambie; Astro les cambia el nombre a los archivos de `src/assets/` en cada compilación.
- Una imagen por vehículo, con su `slug` como nombre: `public/vehicles/<slug>.webp`.
- En `image_url` va la ruta sin dominio: `/vehicles/<slug>.webp`. Así funciona igual en desarrollo y en producción.
- Astro no optimiza lo que está en `public/`: convertir antes a WebP, unos 1.600 px de ancho, menos de 300 KB y proporción 16:9, con el mismo comando de `sharp` de las notas.
- No renombrar ni mover un archivo ya referenciado sin actualizar `image_url` en el mismo cambio.
- La imagen solo se ve en el sitio publicado después de hacer commit y desplegar. Insertar la fila no basta.
- Lo mismo con las páginas de carros y comparaciones: se generan al compilar, así que un carro nuevo o un dato corregido solo llega a ellas al compilar y desplegar. El comparador interactivo sí lee la base en vivo.
- Origen: fotos de la página oficial de la marca o de su sala de prensa (decisión del 2026-11-05: es publicidad para la marca), primero la del país de la ficha y si no, la de otro país o la global. Exterior del carro completo, de frente o de tres cuartos, sin texto, precios ni avisos legales encima; las de fondo transparente van sobre blanco. Si la marca no tiene una foto que cumpla, una de referencia de Wikimedia Commons con licencia libre (CC0, CC BY o CC BY-SA). El crédito no se inventa: en `image_credit` va "Marca País, foto oficial" ("Kia España, foto oficial") o el autor y la licencia, y la página de la foto en `image_source_url`. El comparador los muestra bajo la foto.
- Si no hay foto del modelo exacto, sirve la de un modelo hermano (el mismo carro con otro nombre en otro país, como el Baojun Yep Plus para el Chevrolet Spark EUV), y `image_credit` empieza por el nombre de ese modelo. Si no hay ninguna, `image_url` queda vacío.
- Varias versiones del mismo modelo pueden usar la misma foto: se copia con el `slug` de cada una.

### Completar fichas incompletas

Para llenar los datos que les faltan a vehículos ya insertados se usa la skill `completar-vehiculos` (`.claude/skills/completar-vehiculos/`). Orquesta cinco agentes de `.claude/agents/`: `vehiculos-auditor` (encuentra fichas incompletas), `vehiculos-investigador` (busca en la web), `vehiculos-verificador` (comprueba cada dato contra su fuente), `vehiculos-escritor` (escribe) y `vehiculos-completitud` (relee y confirma).

- Un campo vacío solo es faltante si aplica a la motorización: a un eléctrico no le faltan cilindrada ni tanque. Las reglas están en `campos.md` de la skill y la consulta en `auditoria.sql`.
- Solo se llenan campos vacíos. Corregir un dato ya guardado necesita aprobación expresa de ese cambio.
- Nada se escribe sin una fuente comprobada y sin la aprobación de quien administra en el chat. El investigador comprueba cada dato; el verificador revisa solo los dudosos y las correcciones a datos guardados.
- Los **campos clave del comparador** (los que puntúan sus siete áreas: autonomía, potencia, aceleración, carga rápida, espacio, seguridad y confort) van primero. Si solo tienen una fuente de prensa, no se descartan: se le preguntan a quien administra. Antes de aprobar, siempre se dice qué áreas quedarían "sin datos". La lista está en `campos.md`.
- **Decisión delegada.** Quien administra (Jhampier Giron) decidió el 2026-10-22 que, al ejecutar esta skill, Claude toma todas las decisiones sin pedir aprobación: qué lote sigue, qué datos se escriben (incluidos los de una sola fuente), las correcciones a datos guardados, los cambios a varias filas de esas fichas, el commit y el push del registro. Siguen valiendo las reglas de fuentes de `campos.md` (nada inventado, verificador para lo dudoso y las correcciones). Lo único que no cubre es **desplegar** el sitio. Al terminar cada lote, Claude informa lo escrito, lo corregido y lo descartado. Detalle en "Aprobación o decisión delegada" del `SKILL.md`.
- `airbags`, `ground_clearance_mm`, `panoramic_roof` y `ventilated_seats` son opcionales: se llenan si aparecen, pero no cuentan para que una ficha esté completa.
- Cada escritura deja su registro, con la fuente de cada dato, en `supabase/completado/AAAA-MM-DD.md`.
- Si cambian las columnas de `vehicles`, actualizar también `campos.md` y `auditoria.sql`.

## Publicación

El sitio es estático y se publica en Cloudflare Pages, en el proyecto `mejorelectrico`. El dominio `mejorelectrico.com` también está en Cloudflare. Se compila en el computador y se sube el resultado; Cloudflare no compila ni está conectado a GitHub.

```bash
npm run build
npm run deploy:pages
```

- `npm run deploy:pages` sube la carpeta `dist` con `wrangler`. `npm run deploy` revisa el `.env` (`scripts/revisar-env.mjs`) y git (`scripts/revisar-git.mjs`), compila y sube.
- Publicar es una acción hacia afuera: Claude no ejecuta `deploy:pages` ni `deploy` sin que se lo pidan en ese momento.
- Todo lo necesario para desplegar va en `.env`: las dos variables `PUBLIC_SUPABASE_*`, `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` (token de Cloudflare con permiso Cloudflare Pages: Edit). wrangler lee el `.env` solo. Así otra persona despliega con `npm install` y `npm run deploy`. Detalle en "Cómo publicar el sitio" del `README.md`.
- Sin token, wrangler usa la sesión de `npx wrangler login`. Crear el token o iniciar sesión lo hace la persona, no Claude.
- Una variable vacía (`CLOUDFLARE_API_TOKEN=`) cuenta como puesta para wrangler y la publicación falla: si no hay token, la línea va comentada.
- Detener el servidor de desarrollo antes de compilar (`npx astro dev stop`).
- La compilación toma `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` del `.env` local. Sin ese archivo el sitio se publica, pero el comparador sale vacío.
- **Todo despliegue sale de lo que está subido a GitHub, en `github.com/JhamG9/CarNotice`, sin excepción.** Antes de publicar: commit y `git push` a ese repositorio. `npm run deploy` lo exige (`scripts/revisar-git.mjs`): se detiene si el remoto `origin` no es CarNotice, si hay cambios sin commit o si la rama no coincide con la de GitHub. No saltarse esa revisión con `deploy:pages` suelto ni con `--commit-dirty`.
- Pedir un despliegue incluye el commit y el push a CarNotice de lo pendiente.
- Desde la rama `main` se publica en producción; desde otra rama, Cloudflare crea una versión de prueba con su propia dirección.
- `public/_redirects` lleva la raíz `/` a `/es/` con una redirección de servidor. `public/_headers` da caché larga a `/_astro/`. Son archivos propios de Cloudflare Pages.
- Google Analytics (propiedad `G-3C05L6ZDMJ`) se carga desde `Base.astro`, solo en el sitio compilado y solo cuenta visitas en `mejorelectrico.com`: ni `localhost` ni las direcciones `.pages.dev`. La página 404 no lo lleva.
- El mapa del sitio (`sitemap-index.xml`) lo genera `@astrojs/sitemap` en cada compilación; `public/robots.txt` apunta a él. Deja fuera toda página con `noindex` (lo lee del HTML ya compilado en `dist/`).
- Páginas sin indexar: `noIndexar` en `Base.astro` pone `noindex, follow` y quita canónica y `hreflang`, pero conserva Analytics (lo usan las etiquetas con menos de 3 notas). `sinIndexar` es solo para la 404.
- `public/_headers` manda `X-Robots-Tag: noindex` en las direcciones `.pages.dev`. `www.mejorelectrico.com` debe redirigir con 301 a `mejorelectrico.com` mediante una regla de redirección en el panel de Cloudflare (Pages no lo hace desde el código). Si cambia el dominio, cambiarlo también en `robots.txt`.

## Reels para redes

**Todo vídeo que se pida se genera con la skill `jham-reels` (`.claude/skills/jham-reels/`), por defecto**, aunque no la nombren: reels, TikToks, shorts o cualquier pedido de "generar un video". No se usa otra skill de vídeo salvo que la pidan por su nombre. Hace vídeo vertical con imagen oficial, poco texto, voz local, música propia y datos con fuente, y se monta con Remotion.

- Cada reel se trabaja en su propia carpeta fuera del proyecto (`~/reel`, `~/reel2`). Vídeos, audios y dependencias no entran a este repositorio.
- Necesita Python 3 y Node 18+. La voz local solo funciona en Mac con Apple Silicon; en otro equipo se usa ElevenLabs o una grabación.
- Publicar un reel lo decide siempre la persona: Claude lo muestra y lo publica solo con su aprobación para ese reel.
- **Excepción: la tarea programada `reel-automatico`.** Quien administra (Jhampier Giron) decidió el 2026-11-02 que esa tarea elija el tema, haga el reel y lo publique sin pedir aprobación. Solo publica si el agente `reels-verificador` termina en `LISTO PARA VOZ` y `revisar.py` no marca fallos; si no, deja el reel hecho sin publicar y avisa. No hace commit, push ni despliegue. Sale un reel al día: a las 6 p. m. (hora de Colombia), salvo los miércoles, que sale a las 12 p. m. con la tarea `reel-automatico-mediodia`. Si el computador estaba apagado a esa hora, la tarea queda en cola y corre al encenderlo, sin pasar de un reel automático por día. Instrucciones en `.claude/skills/jham-reels/references/automatico.md`.
- Los temas ya publicados están en `.claude/skills/jham-reels/temas-publicados.md`. Antes de elegir tema se lee, para no repetir, y al publicar se añade una fila.
- Las cuentas son `facebook.com/mejorelectrico` e `instagram.com/mejorelectrico`, vinculadas entre sí. Los reels salen con `scripts/publicar-meta.mjs` de la skill, por la API de Meta (app `Mejor Electrico Reels`). El uso está en `references/publicar.md`.
- El token va en `.env` (`META_PAGE_TOKEN`). No se pega en el chat ni se sube a git; la clave secreta de la app no se guarda en el proyecto.
- YouTube: canal `youtube.com/@mejorelectrico`, de la cuenta de Google `mejorelectrico9@gmail.com`. Los Shorts salen con `scripts/publicar-youtube.mjs`, por la API de YouTube (proyecto de Google Cloud `mejor-electrico-reels`), y la conexión se hace con `scripts/youtube-token.mjs`. Los datos van en `.env` (`YOUTUBE_*`), con las mismas reglas que el token de Meta. Los Shorts salen públicos directo; si Google deja alguno privado, el script lo avisa y se pasa a público en YouTube Studio.
- TikTok: cuenta `tiktok.com/@mejorelectrico`, creada con `mejorelectrico9@gmail.com`. La API (app «Mejor Electrico Reels», en sandbox) solo sube borradores al buzón: `scripts/tiktok-token.mjs` conecta la cuenta (`--web` usa el inicio de sesión web con regreso a `https://mejorelectrico.com/es/`) y `scripts/publicar-tiktok.mjs` sube el borrador. Los datos van en `.env` (`TIKTOK_*`), con las mismas reglas que el token de Meta. La cuenta quedó conectada el 2026-11-04 por la vía web (la de escritorio daba `server_error`). La tarea del reel diario deja cada reel como borrador en el buzón de TikTok y quien administra lo publica desde la app; se anota en la columna TikTok de `temas-publicados.md`. Si hay que reconectar: `tiktok-token.mjs --web`, aceptar los permisos y llevar la dirección final a `http://localhost:4392/vuelta` (o pegarla en `/pegar`). Nunca subir a diario por automatización de navegador.

## Carruseles para redes

**Todo carrusel (publicación de varias imágenes) se hace con la skill `jham-carruseles` (`.claude/skills/jham-carruseles/`), por defecto**, aunque no la nombren: rankings, guías, comparaciones, mitos o noticias, de carros o de cualquier otro tema. Hace láminas de 1080×1350 con el mismo estilo de los reels, datos con fuente (de la tabla `vehicles` o de la web) y las publica por la API de Meta.

- Cada carrusel se trabaja en su propia carpeta fuera del proyecto (`~/carrusel-<slug>`). Las imágenes no entran al repositorio.
- Cada dato pasa por el agente `carruseles-verificador` antes de pintar las láminas.
- Imágenes: las de la página oficial de lo que se muestra (decisión del 2026-11-03: es publicidad para la marca), siempre con su crédito en la lámina y la página de origen en `FUENTES.md`. Si no hay oficial, las del comparador o una foto con licencia libre.
- Publicar un carrusel lo decide la persona, para cada carrusel. **Excepción: las tareas programadas `carrusel-automatico` (lunes y viernes, 12 p. m.) y `carrusel-automatico-miercoles` (miércoles, 9 a. m., para no cruzarse con el reel de mediodía).** Quien administra (Jhampier Giron) decidió el 2026-11-03 que elijan el tema, hagan el carrusel y lo publiquen sin pedir aprobación, solo si el verificador termina en `LISTO PARA RENDER` y `render.mjs` no marca problemas; si no, lo dejan hecho sin publicar y avisan. Solo temas de carros, no hacen commit, push ni despliegue, y no pasan de un carrusel automático por día. Instrucciones en `.claude/skills/jham-carruseles/references/automatico.md`.
- Un tema que no es de carros no se publica en las cuentas de Mejor Eléctrico salvo que se pida: se entregan las láminas o se conecta la otra cuenta. `marca` y `web` en `carrusel.json` cambian el nombre y la dirección que salen en las láminas.
- Salen en Facebook (publicación de varias fotos) e Instagram (carrusel) con `scripts/publicar-carrusel.mjs`, con el mismo token de Meta de los reels. La API no permite música en carruseles: si se quiere, se publica desde la app.
- Los temas publicados están en `.claude/skills/jham-carruseles/carruseles-publicados.md`.
- Los colores y las fuentes son los del estilo `noche` de los reels (`scripts/estilos.mjs`). Si cambia el estilo de los reels, se cambia también ahí.

## Entorno de desarrollo

- El puerto 4321 lo ocupa otro proyecto. El sitio corre en el 4330, en segundo plano:

```bash
npx astro dev --background --port 4330
```

- Se detiene con `npx astro dev stop` y los registros se ven con `npx astro dev logs`.
- Tras cambiar el esquema o mover notas, el servidor puede mostrar datos viejos (campos vacíos o la colección vacía). Se arregla deteniéndolo, borrando `.astro` y `node_modules/.astro`, y arrancándolo de nuevo.
- No compilar (`npm run build`) mientras el servidor de desarrollo está corriendo: detenerlo primero.
- En las rutas paginadas el parámetro del archivo debe llamarse `page` (`[...page].astro`); Astro falla con cualquier otro nombre.
- `astro check` no está instalado y se queda esperando una confirmación. Para validar, usar `npm run build`.

## Estructura de página

Referencia: elcarrocolombiano.com. Se copia la estructura, no el aspecto.

- Portada: solo la revista. Bajo el título "Blog y noticias" van la nota destacada, las 6 siguientes y el enlace "Ver todas las notas", con la barra lateral a la derecha. El comparador no va en la portada: tiene su propia página y su enlace en el menú. Sin banner ni publicidad antes del contenido.
- Lista de notas a la izquierda y barra lateral a la derecha.
- Tarjeta de nota: foto, categoría, titular, resumen de 2 o 3 líneas, autor (en `--heading`), fecha y enlace "Leer nota" con flecha (en `--accent`).
- Barra lateral: "Lo más reciente", categorías y etiquetas.
- Artículo (`/es/notas/<slug>/`): columna de texto de 710 px de ancho máximo, con la misma barra lateral de la portada, que en celular baja al final.
  - Encabezado: categoría, titular (`h1`), resumen, autor, fecha y tiempo de lectura.
  - Imagen principal a lo ancho de la columna, con pie de foto y crédito.
  - Al final: etiquetas, botones para compartir y "Notas relacionadas" (3 notas de la misma categoría; si no alcanzan, se completa con las más recientes).
  - SEO por nota: título, descripción, URL canónica, Open Graph y datos estructurados `NewsArticle`.
- Sección (`/es/categoria/<slug>/` y `/es/etiqueta/<slug>/`): una sola plantilla para categorías y etiquetas.
  - Encabezado: nombre (`h1`), una línea de descripción y el número de notas.
  - Listado con la tarjeta de la portada y la nota más reciente destacada arriba.
  - Paginación de 10 notas por página (`/2/`, `/3/`...), con enlaces "Anterior" y "Siguiente". Cada página paginada es su propia URL canónica.
  - Estado vacío cuando no hay notas.
- Página 404 con enlaces a la portada y a las secciones.
- Todas las rutas van bajo el prefijo de idioma (`/es/`, `/en/`) y terminan en `/`.
- Blog y noticias (`/es/blog/`): listado de todas las notas, con la plantilla de sección y paginado igual. Bajo el encabezado lleva una fila de botones con las categorías ("Todas" más las cuatro, con su número de notas), que también aparece en cada página de categoría con la suya marcada.
- Las categorías no van en el menú superior: se llega a ellas desde "Blog y noticias" y desde la barra lateral.
- Páginas institucionales (`Institucional.astro`): Nosotros (`/es/nosotros/`), Aviso legal (`/es/aviso-legal/`) y Política de privacidad (`/es/politica-de-privacidad/`, con la sección de cookies en `#cookies`). Van enlazadas en la columna "Sobre el sitio" del pie, que exige Google AdSense. El correo y el domicilio están en `src/data/contacto.ts`. Si se suma un proveedor que trate datos (otro servicio de anuncios, un formulario, comentarios), actualizar la política de privacidad y su fecha.

## Tipografía

Dos familias: Poppins para titulares y Lato para todo lo demás.

```bash
npm install @fontsource/poppins @fontsource/lato
```

```js
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
```

| Elemento | Fuente | Tamaño / interlineado | Peso |
|---|---|---|---|
| Titular de artículo (h1) | Poppins | 37 / 48 px | 600 |
| Título de sección | Poppins, mayúsculas | 32 / 35 px | 700 |
| Titular de tarjeta | Poppins | 26 / 29 px | 700 |
| Título de barra lateral | Poppins | 22 / 24 px | 700 |
| Texto de artículo | Lato | 20 / 30 px | 400 |
| Resumen en tarjeta | Lato | 20 / 30 px | 400 |
| Menú | Lato, mayúsculas, espaciado 1.5 px | 14 px | 700 |
| Categoría y fecha | Lato | 12 px | 400 |

Lato no tiene peso 600: usar 400 o 700.

Excepciones a la tabla:

- El titular de artículo baja a 30 / 38 px en celular (menos de 768 px), para que no ocupe media pantalla.
- Los ítems de las listas de la barra lateral usan Lato 17 / 24 px, peso 700 (clase `t-item`).

## Color

Tema claro por defecto siempre, sin importar la preferencia del sistema. El tema oscuro se activa solo con `data-theme="dark"` en `<html>`. Un solo color de acento (verde profundo) y un azul reservado para señalar contenido eléctrico. Las fotos ponen el resto del color.

```css
:root {
  --bg: #F7F6F2;            /* fondo de página, blanco cálido */
  --surface: #FFFFFF;       /* tarjetas y cajas */
  --ink: #14171C;           /* texto */
  --heading: #14284B;       /* titulares, logo y nombre del autor (azul profundo) */
  --muted: #5A616B;         /* resúmenes, fechas, metadatos */
  --border: #E3E1DA;        /* líneas y bordes */
  --accent: #1B6B43;        /* enlaces, categorías, botones (texto blanco encima) */
  --accent-bright: #23955C; /* solo decoración y texto grande, no texto pequeño */
  --ev: #1D5FB8;            /* etiqueta "Eléctrico" y datos de eléctricos */
  --tint: #E4E9F1;          /* fondo de los marcadores de imagen */
  --on-accent: #FFFFFF;     /* texto sobre --accent */
  --chart-a: #C23508;       /* gráficos: carro 1 del comparador */
  --chart-b: #2563C9;       /* gráficos: carro 2 del comparador */
}

:root[data-theme="dark"] {
  --bg: #0F1114;
  --surface: #181B20;
  --ink: #ECEAE4;
  --heading: #ECEAE4;       /* en oscuro, igual que --ink */
  --muted: #9BA1AA;
  --border: #2A2E35;
  --accent: #4CC38A;        /* texto oscuro (#0F1114) encima en botones */
  --accent-bright: #4CC38A;
  --ev: #5EA2F2;
  --tint: #1F242C;
  --on-accent: #0F1114;
  --chart-a: #E8632F;
  --chart-b: #4F8FEA;
}
```

Reglas de uso:

- El acento se usa poco: categoría, enlaces, un botón principal por pantalla.
- Todos los titulares usan `--heading`. Los titulares enlazados no llevan subrayado y cambian a `--accent` al pasar el cursor.
- La categoría de cada nota va en `--accent`, con una barra corta de 32 × 3 px en `--accent-bright` debajo.
- Los títulos de la barra lateral llevan la misma barra corta debajo, no una línea de ancho completo.
- El menú marca la sección activa con una línea inferior en `--accent`.
- El azul `--ev` no es decorativo: solo se usa en la etiqueta "Eléctrico" (contenido eléctrico o híbrido), nunca en el nombre de la categoría.
- No usar rojo como color de marca ni fondos degradados.
- `--chart-a` sigue en naranja aunque el acento sea verde: es un color solo para gráficos y contrasta mejor con `--chart-b`.
- Todas las combinaciones de texto de la tabla cumplen contraste AA (4.5:1 o más).

Cambio de tema:

- No usar `@media (prefers-color-scheme: dark)`.
- La cabecera lleva, a la derecha del menú, un botón para alternar el tema: icono de sol o luna, con `aria-label`.
- La elección se guarda en `localStorage` (clave `tema`).
- Un script en línea en el `<head>` aplica el tema guardado antes de que la página se pinte, para que no parpadee.

Marcadores de imagen (notas sin foto): fondo `--tint`, borde `--border` e icono en `--muted`, para que se adapten a los dos temas.

## Comparador

Página `/es/comparador/`. No aparece en la portada. Es una isla de React (`Comparador.tsx`) que lee la tabla `vehicles` desde el navegador con la clave publicable; solo ve los vehículos con `published = true`.

- Estructura inspirada en versus.com (se toma la estructura, no el aspecto): buscadores, encabezado "A vs B", veredicto, gráfico, mayores diferencias, ficha técnica y barra fija abajo.
- Dos buscadores (`BuscadorCarro.tsx`, patrón combobox de ARIA). Sobre cada uno va el nombre del carro elegido, no "Carro 1" o "Carro 2" (eso queda solo para lectores de pantalla). Sin texto escrito, la lista muestra cuántos carros y marcas hay, un botón por marca y un carro de cada marca, alternadas, para que no parezca que solo hay una. se escribe marca, modelo, versión, año, mercado o nombre en Latinoamérica, sin importar tildes ni mayúsculas, y se elige con el ratón o con flechas y Enter. Muestran hasta 8 resultados con foto. La comparación elegida queda en la dirección (`?a=<slug>&b=<slug>`) para poder compartirla.
- Encabezado: foto, nombre y un puntaje general en anillo por carro, separados por "VS". El puntaje general es el promedio de las áreas comparables (el mismo del veredicto).
- "¿En qué es mejor cada uno?": gráfico de araña de siete áreas (autonomía, potencia, aceleración, carga rápida, espacio, seguridad y confort). Un área sin dato no se dibuja en 0: la figura de ese carro la salta y une las áreas vecinas. La excepción es un carro sin carga rápida en DC (`dc_charging = false`): ahí sí puntúa 0 y la tabla dice "No tiene". Si ninguno de los dos tiene el dato, la píldora queda gris y punteada, con "sin datos". Los nombres de las áreas son botones en forma de píldora; al elegir una se abre debajo el detalle con sus filas de la ficha (`CAMPOS_POR_AREA` en `src/lib/vehiculos.ts`). Al lado va una tabla con el dato real de cada área ("571 km", "461 kW", "28 min del 10 al 80 %", "4 de 6 ayudas"), una barra corta con el puntaje y una columna "Gana" con la diferencia en palabras ("+181 km", "4× más", "Casi iguales" si es menor al 5 %). En celular esa columna va bajo el nombre del área. Las áreas sin datos en ninguno de los dos carros no ocupan fila: una nota dice cuáles faltan. Las filas también eligen el área. El puntaje de 0 a 100 no se muestra como número en la tabla: solo en el gráfico y en el anillo general.
- Los puntajes van de 0 a 100 y se calculan contra rangos fijos (en `src/lib/vehiculos.ts`), no contra el otro carro: el puntaje de un carro no cambia según con cuál se compare. Autonomía (0 a 800 km), potencia (0 a 400 kW) y espacio (0 a 900 L) empiezan en 0, para que un carro pequeño con dato real no quede en 0; la aceleración va de 16 a 3 s. Si un carro nuevo queda por fuera de un rango, se amplía el rango, no se deja en 0.
- El puntaje de autonomía sale siempre del equivalente WLTP de cada carro: su cifra WLTP o, si no la tiene, su mejor ciclo (NEDC, EPA, CLTC) convertido con `A_WLTP` en `src/lib/vehiculos.ts` (NEDC ÷ 1,21, CLTC ÷ 1,28, EPA × 1,22). Así no cambia según el rival. La fila de la tabla compara las cifras reales en un ciclo que tengan los dos (WLTP, luego CLTC, EPA y NEDC); si no comparten ninguno, muestra cada cifra con su ciclo y "≈ … km WLTP", dice que es estimado y no da ganador con menos del 10 % de diferencia. La conversión es solo del comparador: en la base cada cifra sigue en la columna de su ciclo. En rango extendido e híbridos enchufables, si no hay autonomía total por ciclo, se usa `combined_range_km` en el ciclo de `electric_range_cycle`, y la tabla dice "con gasolina".
- Veredicto, debajo del encabezado: "Tu elección: X. Va por delante en N de M áreas", según el promedio de los puntajes, y para qué conviene cada uno. Con menos de 2 puntos de diferencia dice que están parejos; con menos de 7, que gana "por poco". Siempre aclara que no tiene en cuenta el precio y qué categorías quedaron por fuera por falta de datos. No se muestra si hay menos de tres categorías comparables.
- "Mayores diferencias": las 5 filas donde un carro le saca más ventaja al otro en proporción, con una etiqueta de ventaja ("+120 km" o, desde el doble, "2,2×") del color del carro que gana.
- Ficha técnica por secciones. Cada tabla (y el detalle de un área del gráfico) empieza con una fila que dice qué carro va en cada columna: la marca del color del carro, el nombre del modelo y la versión. Solo aparecen las filas donde al menos un carro tiene el dato; el que falta dice "Sin dato". En los sí o no, el "Sí" lleva un punto del color del carro.
- Barra fija abajo con los dos carros, su puntaje y un botón "Cambiar" que lleva a los buscadores.
- Los dos carros se distinguen con `--chart-a` y `--chart-b`, que son colores solo para gráficos, y nunca solo por color: la leyenda lleva el nombre, el carro 2 usa línea punteada y marcas cuadradas, y el ganador de cada fila lleva la palabra "Mejor".
- Los valores guardados en inglés (`electric`, `rwd`) se traducen en `valores` de `src/i18n/`.
- Al agregar una columna a `vehicles`, añadirla a `BASE_SECCIONES` en `src/lib/vehiculos.ts` y a `filasFicha` en `src/i18n/es.ts` y `en.ts` para que aparezca en el comparador.

## Páginas de carros y comparaciones

Pensadas para que gente de todo el mundo llegue desde Google: el comparador interactivo se arma en el navegador y Google no lo ve, así que estas páginas lo repiten como HTML generado al compilar.

- Datos: la colección `vehiculos` (`src/content.config.ts`) lee de Supabase las fichas publicadas, una vez por compilación. Sin las variables de `.env` queda vacía y estas páginas no se generan. El catálogo (modelos y pares) se arma en `src/lib/catalogo.ts`, y `src/lib/catalogoDatos.ts` lo lee una sola vez para todas las páginas.
- Una página por modelo, no por versión: `/es/carros/<marca-modelo>/` (por ejemplo `/es/carros/kia-ev2/`). Las versiones de un modelo se parecen tanto que, por separado, serían contenido duplicado. Lleva foto, resumen, datos clave y puntaje por área de la versión representativa, una tabla de versiones, la ficha completa de cada versión (desplegable, con su anclaje), sus rivales y las notas que lo nombran. Datos estructurados `Car`.
- Versión representativa: la más básica (menos batería, luego menos potencia) del mercado con más versiones del modelo. No se prioriza ningún país: el sitio es para lectores de todas partes.
- Índice `/es/carros/`: todos los modelos agrupados por tamaño.
- Comparaciones con página propia: `/es/comparador/<modelo-a>-vs-<modelo-b>/`, en orden alfabético (cada par existe una vez). Solo entre rivales reales: tamaño igual o vecino y al menos 5 de las 7 áreas comparables. Se comparan las versiones más básicas de un mercado que tengan los dos; si no comparten mercado, la representativa de cada uno. La página pinta el comparador completo desde el servidor (`Comparador.tsx` con `inicialA` e `inicialB`), una frase con el veredicto, preguntas rápidas por área ("¿Cuál tiene más autonomía?"), enlaces a los dos modelos y otras comparaciones. Cambiar un carro lleva al comparador libre.
- Todas las comparaciones se indexan y van en el sitemap, en los dos idiomas (decisión de quien administra del 2026-11-06, porque el sitio no recibía visitas; revierte la del 2026-10-28, que solo indexaba las que tenían texto propio). Las fichas de modelos también se indexan.
- El texto propio va en la colección `comparaciones` (`src/content/comparaciones/<par>.md`, con el slug del par en orden alfabético) y sale bajo «¿Cuál conviene?»: es lo que distingue una comparación de la plantilla. Su versión en inglés va en `comparacionesEn` (`src/content/comparaciones-en/<par>.md`, mismo nombre, con las reglas de traducción de "Idiomas"); si falta, la compilación avisa. Se escriben por lotes (el primero, de 20, el 2026-11-03) entre rivales que la gente busca y del mismo mercado.
- Los lotes nuevos se hacen con la skill `indexar-comparaciones`. **Excepción a «publicar se pide en el momento»:** la tarea programada `indexar-comparaciones-lote-2` (2026-11-24, 8 a. m.) tiene autorización de quien administra (Jhampier Giron, 2026-11-03) para escribir, verificar, hacer commit, push y desplegar ese lote sin preguntar, y avisar al terminar. No despliega si algo falla.
- Cada texto: 300 a 450 palabras con las reglas de redacción, solo con los datos de las dos versiones que compara la página (sin precios ni datos de fuera) y diciendo de qué mercado son. Si un par deja de existir (un carro despublicado), la compilación avisa y su texto deja de publicarse; si cambian las versiones comparadas, el texto se revisa.
- El comparador libre (`/es/comparador/?a=&b=`) enlaza a la ficha de cada modelo y, si la pareja tiene página propia, a esa página.
- Las notas que hablan de un modelo (por `article_slug` o porque lo nombran en el titular) muestran al final el enlace a su ficha.
- Imágenes para compartir, generadas al compilar con `sharp` (`src/lib/imagenesSociales.ts`): `/og/carros/<modelo>.jpg` y `/og/comparador/<par>.jpg`, de 1200 × 630. En inglés, ver "Idiomas".
- Migas de pan con JSON-LD `BreadcrumbList` (`Migas.astro`). `Base.astro` declara `max-image-preview:large` y `hreflang` (cada página declara sus traducciones con `alternativas`).

## Reglas de calidad

- Un solo `h1` por página.
- Los titulares nunca se parten a mitad de palabra: nada de `word-break: break-all`, y probar columnas angostas.
- Los ítems del menú no deben ocupar más de una línea; si no caben, van al menú desplegable. Hoy el menú tiene cuatro ítems (Inicio, Carros, Comparador y Blog y noticias) y va en una línea desde 1024 px; por debajo usa el menú desplegable. Las páginas de categoría y los artículos marcan "Blog y noticias" como activo.
- Probar cada plantilla a 375, 768, 1024 y 1440 px.
- Fotos con proporción fija por tipo de tarjeta, para que la lista no salte al cargar.
- Fotos de vehículos: salas de prensa oficiales de los fabricantes, no fotos de stock. Se guardan en `src/assets/images/` y se enlazan con los campos `imagen` e `imagenAlt` de la nota.
- Excepción: las notas de servicio y mercado (costos, impuestos, carga, regulación) pueden usar fotos de Unsplash cuando no muestran un modelo concreto. El crédito va como "Nombre del autor en Unsplash" en `imagenCredito` o en el pie. Si una foto de Unsplash acompaña la nota de un modelo, el pie dice "Imagen de referencia".
