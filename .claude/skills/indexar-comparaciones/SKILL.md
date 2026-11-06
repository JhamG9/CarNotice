---
name: indexar-comparaciones
description: Abre a Google un nuevo lote de páginas de comparación del sitio (/es/comparador/<a>-vs-<b>/) escribiendo su texto propio «¿Cuál conviene?» con agentes, solo con los datos de la tabla vehicles, y verificándolo antes de compilar. Usar cuando pidan indexar, abrir o escribir más comparaciones, o el siguiente lote de comparaciones.
---

# indexar-comparaciones

Las páginas de comparación se generan solas desde la tabla `vehicles` al compilar, pero solo se indexan las que
tienen texto propio en `src/content/comparaciones/<par>.md` (ver `CLAUDE.md`, «Páginas de carros y comparaciones»).
Esta skill escribe ese texto para un lote nuevo. El primer lote (20) salió el 2026-11-03.

## Flujo

```
- [ ] 1. Elegir el lote: 10 a 20 pares
- [ ] 2. Sacar las fichas de las dos versiones de cada par
- [ ] 3. Redactar con agentes (5 pares por agente)
- [ ] 4. Verificar con agentes (10 pares por agente) y revisar sus cambios
- [ ] 5. Compilar y comprobar qué se indexa
- [ ] 6. Commit y push; desplegar solo si está pedido o autorizado
```

Carpeta de trabajo del lote: `~/comparaciones-<AAAA-MM-DD>/` (fuera del proyecto).

### 1. Elegir el lote

- Compila una vez (`npm run build`, con el servidor de desarrollo detenido) y lista los pares que existen:
  `ls dist/es/comparador | grep -- -vs-`. Quita los que ya tienen archivo en `src/content/comparaciones/`.
- Elige de 10 a 20 por **demanda**: rivales directos que la gente compara (mismo tamaño y tipo, marcas con
  presencia), y **del mismo mercado** (las dos versiones de Europa, o las dos de Colombia). Mezcla mercados.
- Prioriza modelos que ya tienen comparación indexada contra otro rival (refuerza el enlace interno) y modelos
  publicados hace poco. Evita pares con marcas poco buscadas (JMEV, FAW) salvo que el par sea muy natural.
- Anota el lote y el porqué en `~/comparaciones-<fecha>/lote.md`.

### 2. Fichas

Cada página compara la versión más básica (menos batería, luego menos potencia) de cada modelo en el primer mercado
que compartan, en este orden: EU, US, CN, CO, MX, BR, CL, AR, PE, EC (`src/lib/catalogo.ts`). Sácalas con el
conector `supabase-garash` (solo lectura, `published = true`), por ejemplo:

```sql
with base as (
  select v.*, row_number() over (partition by brand, model, market
    order by battery_kwh nulls last, power_kw nulls last, version) rn
  from vehicles v where published
)
select jsonb_agg(to_jsonb(base) - 'rn' - 'image_url' - 'image_credit' - 'image_source_url' - 'published')
from base where rn = 1 and (market, brand, model) in (('EU','Kia','EV3'), ...);
```

Guarda el resultado en `~/comparaciones-<fecha>/fichas.json` sin los campos vacíos. Comprueba la versión de cada par
en la página compilada: `dist/es/comparador/<par>/index.html` dice «Versiones comparadas: …». Si no coincide, usa la
de la página.

### 3. Redactar

Lanza agentes `general-purpose` (modelo `sonnet`), 5 pares cada uno, en paralelo. Cada uno lee
`references/redactar.md` y escribe `src/content/comparaciones/<par>.md`. Si un modelo sale en varios pares del mismo
agente, pídele que cambie el ángulo en cada texto.

### 4. Verificar

Lanza agentes `general-purpose` (`sonnet`), 10 pares cada uno, con `references/verificar.md`: comprueban cada cifra
contra `fichas.json`, quitan lo que no está en la ficha (precios, costos, cálculos inventados) y corrigen en el
archivo. Lee su informe y revisa con `git diff` lo que cambiaron. Si alguno termina en `QUEDAN DUDAS`, resuélvelas tú
o quita ese par del lote.

### 5. Compilar y comprobar

```bash
npx astro dev stop; npm run build
for d in dist/es/comparador/*-vs-*/; do grep -q 'content="noindex' $d/index.html || basename $d; done | wc -l
grep -o 'comparador/[a-z0-9-]*-vs-[a-z0-9-]*/' dist/sitemap-0.xml | sort -u | wc -l
```

Cada texto se traduce también en `src/content/comparaciones-en/<par>.md`, con las reglas de "Idiomas" de `CLAUDE.md`; si falta, la página en inglés queda con `noindex` y la compilación avisa.

Los dos números deben ser iguales al total de archivos en `src/content/comparaciones/`. La compilación avisa si un
texto ya no tiene par: en ese caso, revisa por qué (un carro despublicado) y quita el archivo.

### 6. Publicar

Commit y push a `github.com/JhamG9/CarNotice`. Desplegar (`npm run deploy`) solo si quien administra lo pidió en el
momento o si lo autoriza la tarea programada que corre esta skill. Si se despliega, comprueba en
`https://mejorelectrico.com` una página nueva (sin `noindex`, con «¿Cuál conviene?») y el sitemap en vivo.

Al terminar, actualiza el lote en la memoria del proyecto y en la línea de `CLAUDE.md` que dice cuántas van, si
cambió el criterio.
