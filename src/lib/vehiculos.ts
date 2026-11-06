import { LOCALE, textos, type Idioma, type Textos } from '../i18n';

/** Fila de la tabla `vehicles` de Supabase. La explicación de cada campo está en el README. */
export type Vehiculo = {
  slug: string;
  brand: string;
  model: string;
  version: string;
  model_year: number;
  market: string;
  image_url: string | null;
  /** Autor y licencia de la foto; si muestra un modelo hermano, empieza por su nombre. */
  image_credit: string | null;
  image_source_url: string | null;
  /** Nombre con que se vende en Latinoamérica, solo si cambia. */
  latam_name: string | null;
  article_slug: string | null;
} & Record<string, string | number | boolean | null>;

export async function obtenerVehiculos(): Promise<Vehiculo[]> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const clave = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error('Faltan las variables de Supabase en el archivo .env');

  // La base de datos solo devuelve los publicados (RLS); el filtro lo deja explícito.
  const respuesta = await fetch(
    `${url}/rest/v1/vehicles?select=*&published=eq.true&order=brand,model,model_year.desc,version`,
    { headers: { apikey: clave } },
  );
  if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status}`);
  return respuesta.json();
}

export const nombreModelo = (v: Vehiculo) => `${v.brand} ${v.model}`;
export const nombreCompleto = (v: Vehiculo, idioma: Idioma = 'es') => `${v.brand} ${v.model} ${nombreVersion(v, idioma)}`;

// 'always' para que 4620 salga como 4.620: en español el separador no se pone solo en cifras de cuatro dígitos
const NUMERO: Record<Idioma, Intl.NumberFormat> = {
  es: new Intl.NumberFormat(LOCALE.es, { maximumFractionDigits: 2, useGrouping: 'always' }),
  en: new Intl.NumberFormat(LOCALE.en, { maximumFractionDigits: 2, useGrouping: 'always' }),
};
export const formatearNumero = (valor: number, idioma: Idioma = 'es') => NUMERO[idioma].format(valor);

/** Millas de una cifra en km, para los idiomas que las muestran entre paréntesis. */
export const aMillas = (km: number) => Math.round(km * 0.621371);

/** "510 km" o, en inglés, "510 km (317 mi)". */
export function conMillas(km: number, idioma: Idioma = 'es'): string {
  const texto = `${formatearNumero(km, idioma)} km`;
  return idioma === 'es' ? texto : `${texto} (${formatearNumero(aMillas(km), idioma)} mi)`;
}

// --- Traducción de los valores guardados (en inglés) al idioma de la interfaz

export const traducir = (campo: string, valor: string, idioma: Idioma = 'es') =>
  (textos(idioma).valores as Record<string, Record<string, string>>)[campo]?.[valor] ?? valor;

/** Palabras en español que la tabla guarda como texto libre; cada idioma las cambia al mostrarlas. */
const VERSIONES: Partial<Record<Idioma, Record<string, string>>> = { en: { Única: 'Single trim' } };
export const nombreVersion = (v: Vehiculo, idioma: Idioma = 'es') => VERSIONES[idioma]?.[v.version] ?? v.version;

const CREDITOS: Partial<Record<Idioma, [RegExp, string][]>> = {
  en: [
    [/foto oficial/g, 'official photo'],
    [/ España\b/g, ' Spain'],
    [/ Europa\b/g, ' Europe'],
    [/ México\b/g, ' Mexico'],
  ],
};
/** El crédito se guarda en español ("Kia España, foto oficial"). */
export const creditoFoto = (credito: string, idioma: Idioma = 'es') =>
  (CREDITOS[idioma] ?? []).reduce((texto, [patron, cambio]) => texto.replace(patron, cambio), credito);

// --- Filas de la comparación

export interface Fila {
  campo: string;
  etiqueta: string;
  unidad?: string;
  /** Qué valor es mejor. Sin esto, la fila se muestra sin marcar un ganador. */
  mejor?: 'mayor' | 'menor';
  /** Columna sí o no que, en `true`, quiere decir que este valor no tiene límite (garantías). */
  sinLimite?: string;
  /** Columna sí o no que, en `false`, quiere decir que el carro no tiene esto (carga rápida). */
  noTiene?: string;
}

export interface Seccion {
  id: string;
  titulo: string;
  filas: Fila[];
}

const UNIDAD_ANIOS = 'anios';
const UNIDAD_PULGADAS = 'pulgadas';

type FilaBase = Omit<Fila, 'etiqueta'> & { campo: keyof Textos['filasFicha'] };

/** Filas de la ficha; sus nombres están en src/i18n/. */
const BASE_SECCIONES: { id: keyof Textos['seccionesFicha']; filas: FilaBase[] }[] = [
  {
    id: 'general',
    filas: [
      { campo: 'powertrain' },
      { campo: 'body_style' },
      { campo: 'segment' },
      { campo: 'model_year' },
      { campo: 'market' },
      { campo: 'warranty_years', unidad: UNIDAD_ANIOS, mejor: 'mayor' },
      { campo: 'warranty_km', unidad: 'km', mejor: 'mayor', sinLimite: 'warranty_km_unlimited' },
    ],
  },
  {
    id: 'rendimiento',
    filas: [
      { campo: 'power_kw', unidad: 'kW', mejor: 'mayor' },
      { campo: 'power_hp', unidad: 'hp', mejor: 'mayor' },
      { campo: 'torque_nm', unidad: 'Nm', mejor: 'mayor' },
      { campo: 'acceleration_0_100_s', unidad: 's', mejor: 'menor' },
      { campo: 'top_speed_kmh', unidad: 'km/h', mejor: 'mayor' },
      { campo: 'drivetrain' },
      { campo: 'motor_count' },
      { campo: 'transmission' },
      { campo: 'gear_count' },
    ],
  },
  {
    id: 'bateria',
    filas: [
      { campo: 'battery_kwh', unidad: 'kWh', mejor: 'mayor' },
      { campo: 'battery_chemistry' },
      { campo: 'range_wltp_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_cltc_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_epa_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_nedc_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'consumption_kwh_100km', unidad: 'kWh/100 km', mejor: 'menor' },
      { campo: 'battery_warranty_years', unidad: UNIDAD_ANIOS, mejor: 'mayor', sinLimite: 'battery_warranty_unlimited' },
      { campo: 'battery_warranty_km', unidad: 'km', mejor: 'mayor', sinLimite: 'battery_warranty_unlimited' },
    ],
  },
  {
    id: 'carga',
    filas: [
      { campo: 'dc_charge_kw', unidad: 'kW', mejor: 'mayor', noTiene: 'dc_charging' },
      { campo: 'dc_charge_min', unidad: 'min', mejor: 'menor', noTiene: 'dc_charging' },
      { campo: 'ac_charge_kw', unidad: 'kW', mejor: 'mayor' },
      { campo: 'connector' },
      { campo: 'v2l' },
    ],
  },
  {
    id: 'combustion',
    filas: [
      { campo: 'displacement_cc', unidad: 'cc' },
      { campo: 'cylinder_count' },
      { campo: 'turbo' },
      { campo: 'fuel_consumption_l_100km', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_consumption_city_l_100km', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_consumption_highway_l_100km', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_tank_l', unidad: 'L', mejor: 'mayor' },
      { campo: 'electric_range_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'combined_range_km', unidad: 'km', mejor: 'mayor' },
      { campo: 'co2_g_km', unidad: 'g/km', mejor: 'menor' },
      { campo: 'emission_standard' },
    ],
  },
  {
    id: 'medidas',
    filas: [
      { campo: 'length_mm', unidad: 'mm' },
      { campo: 'width_mm', unidad: 'mm' },
      { campo: 'height_mm', unidad: 'mm' },
      { campo: 'wheelbase_mm', unidad: 'mm', mejor: 'mayor' },
      { campo: 'trunk_l', unidad: 'L', mejor: 'mayor' },
      { campo: 'front_trunk_l', unidad: 'L', mejor: 'mayor' },
      { campo: 'curb_weight_kg', unidad: 'kg', mejor: 'menor' },
      { campo: 'ground_clearance_mm', unidad: 'mm', mejor: 'mayor' },
      { campo: 'seats' },
    ],
  },
  {
    id: 'seguridad',
    filas: [
      { campo: 'airbags', mejor: 'mayor' },
      { campo: 'autonomous_emergency_braking' },
      { campo: 'adaptive_cruise_control' },
      { campo: 'lane_keeping_assist' },
      { campo: 'blind_spot_monitor' },
      { campo: 'camera_360' },
      { campo: 'isofix' },
      { campo: 'ncap_stars', mejor: 'mayor' },
      { campo: 'ncap_body' },
    ],
  },
  {
    id: 'confort',
    filas: [
      { campo: 'screen_inches', unidad: UNIDAD_PULGADAS, mejor: 'mayor' },
      { campo: 'apple_carplay' },
      { campo: 'android_auto' },
      { campo: 'panoramic_roof' },
      { campo: 'ventilated_seats' },
      { campo: 'heated_seats' },
      { campo: 'wireless_charger' },
      { campo: 'heat_pump' },
    ],
  },
];

const unidadEn = (unidad: string | undefined, idioma: Idioma) => {
  const u = textos(idioma).unidades;
  return unidad === UNIDAD_ANIOS ? u.anios : unidad === UNIDAD_PULGADAS ? u.pulgadas : unidad;
};

const SECCIONES_POR_IDIOMA = new Map<Idioma, Seccion[]>();

/** Secciones de la ficha en un idioma. */
export function secciones(idioma: Idioma = 'es'): Seccion[] {
  let lista = SECCIONES_POR_IDIOMA.get(idioma);
  if (!lista) {
    const t = textos(idioma);
    lista = BASE_SECCIONES.map((seccion) => ({
      id: seccion.id,
      titulo: t.seccionesFicha[seccion.id],
      filas: seccion.filas.map((fila) => ({ ...fila, etiqueta: t.filasFicha[fila.campo], unidad: unidadEn(fila.unidad, idioma) })),
    }));
    SECCIONES_POR_IDIOMA.set(idioma, lista);
  }
  return lista;
}

/** Valor que se muestra en una garantía sin límite; no es un número y gana frente a cualquier cifra. */
export const SIN_LIMITE = 'sin_limite';

/** Valor que se muestra cuando el carro no tiene lo que mide la fila; pierde frente a cualquier cifra. */
export const NO_TIENE = 'no_tiene';

/**
 * Valor de la fila para un carro. Si el número está vacío pero su columna `sinLimite` es true, devuelve SIN_LIMITE;
 * si su columna `noTiene` es false, devuelve NO_TIENE.
 */
export function valorDe(fila: Fila, v: Vehiculo): string | number | boolean | null {
  const valor = v[fila.campo] ?? null;
  if (valor === null && fila.sinLimite && v[fila.sinLimite] === true) return SIN_LIMITE;
  if (valor === null && fila.noTiene && v[fila.noTiene] === false) return NO_TIENE;
  return valor;
}

/** Texto de una celda: número con unidad, sí o no, o el valor traducido. */
export function formatearValor(fila: Fila, valor: string | number | boolean | null, idioma: Idioma = 'es'): string | null {
  if (valor === null || valor === undefined) return null;
  const t = textos(idioma).ficha;
  if (valor === SIN_LIMITE) return t.sinLimite;
  if (valor === NO_TIENE) return t.noTiene;
  if (typeof valor === 'boolean') return valor ? t.si : t.no;
  if (typeof valor === 'number') {
    if (fila.unidad === 'km') return conMillas(valor, idioma);
    // Los años no llevan separador de miles
    const texto = fila.campo === 'model_year' ? String(valor) : formatearNumero(valor, idioma);
    if (fila.unidad === 'km/h' && idioma !== 'es') return `${texto} km/h (${formatearNumero(aMillas(valor), idioma)} mph)`;
    return fila.unidad ? `${texto} ${fila.unidad}` : texto;
  }
  return traducir(fila.campo, valor, idioma);
}

/** 'a' o 'b' si uno gana en esa fila; null si empatan, falta un dato o la fila no tiene ganador. */
export function ganador(fila: Fila, a: Vehiculo, b: Vehiculo): 'a' | 'b' | null {
  const va = valorDe(fila, a);
  const vb = valorDe(fila, b);
  // Sin límite gana frente a cualquier cifra; dos sin límite empatan
  if (fila.mejor === 'mayor' && (va === SIN_LIMITE) !== (vb === SIN_LIMITE) && (typeof va === 'number' || typeof vb === 'number')) {
    return va === SIN_LIMITE ? 'a' : 'b';
  }
  // Tenerlo gana frente a no tenerlo, sea la cifra que sea
  if (fila.mejor && (va === NO_TIENE) !== (vb === NO_TIENE) && (typeof va === 'number' || typeof vb === 'number')) {
    return va === NO_TIENE ? 'b' : 'a';
  }
  if (!fila.mejor || typeof va !== 'number' || typeof vb !== 'number' || va === vb) return null;
  return (va > vb) === (fila.mejor === 'mayor') ? 'a' : 'b';
}

// --- Puntajes del gráfico de araña

/** Clave de un área del gráfico, igual en todos los idiomas. */
export type ClaveArea = keyof Textos['areas'];

export interface Eje {
  clave: ClaveArea;
  nombre: string;
  /** Qué mide el eje, para la nota al pie del gráfico. */
  detalle: string;
  a: number | null;
  b: number | null;
}

/** Pasa un valor a una escala de 0 a 100 entre dos referencias fijas. */
function escala(valor: unknown, minimo: number, maximo: number, invertido = false): number | null {
  if (typeof valor !== 'number') return null;
  const proporcion = Math.min(1, Math.max(0, (valor - minimo) / (maximo - minimo)));
  return Math.round((invertido ? 1 - proporcion : proporcion) * 100);
}

/** Porcentaje de equipamientos que el carro tiene, entre los que se conocen. */
function porcentaje(v: Vehiculo, campos: string[]): number | null {
  const conocidos = campos.map((campo) => v[campo]).filter((valor) => typeof valor === 'boolean');
  if (conocidos.length < 3) return null;
  return Math.round((conocidos.filter(Boolean).length / conocidos.length) * 100);
}

const CICLOS = [
  { campo: 'range_wltp_km', nombre: 'WLTP' },
  { campo: 'range_cltc_km', nombre: 'CLTC' },
  { campo: 'range_epa_km', nombre: 'EPA' },
  { campo: 'range_nedc_km', nombre: 'NEDC' },
];
type Ciclo = (typeof CICLOS)[number];

/** Motorizaciones que guardan su autonomía total como combinada (batería y gasolina). */
const CON_GASOLINA = ['range_extender', 'plug_in_hybrid'];

/**
 * Autonomía total del carro en un ciclo. En rango extendido e híbridos enchufables es la combinada,
 * medida en el mismo ciclo que su autonomía eléctrica; así solo se comparan cifras del mismo ciclo.
 */
function autonomiaEnCiclo(v: Vehiculo, ciclo: Ciclo): number | null {
  const total = v[ciclo.campo];
  if (typeof total === 'number') return total;
  const combinada = v.combined_range_km;
  if (CON_GASOLINA.includes(String(v.powertrain)) && v.electric_range_cycle === ciclo.nombre && typeof combinada === 'number') {
    return combinada;
  }
  return null;
}

/** Primer ciclo en que los dos carros tienen autonomía total. */
const cicloComun = (a: Vehiculo, b: Vehiculo) =>
  CICLOS.find((c) => autonomiaEnCiclo(a, c) !== null && autonomiaEnCiclo(b, c) !== null);

/**
 * Cuántos km WLTP equivalen a 1 km de cada ciclo. Son promedios orientativos: solo se usan cuando dos
 * carros no comparten ciclo, y el comparador marca el resultado como estimado.
 * - NEDC: mediana de las fichas de la tabla que traen WLTP y NEDC del mismo carro (10 versiones, NEDC ≈ 1,21 × WLTP).
 * - CLTC: el Deepal S05 publica 620 km CLTC y 485 km WLTP con la misma batería (CLTC ≈ 1,28 × WLTP, un 22 % menos),
 *   la cifra que usa la nota «autonomia-electricos-cltc-nedc-wltp-como-leerla». InsideEVs también lo pone por encima del NEDC.
 * - EPA: InsideEVs, «How To Convert Conflicting EV Range Test Cycles» (WLTP ≈ 22 % más que EPA).
 */
const A_WLTP: Record<string, number> = { WLTP: 1, NEDC: 1 / 1.21, EPA: 1.22, CLTC: 1 / 1.28 };

/** Orden en que se elige el ciclo propio de un carro para estimar: primero el que no necesita conversión. */
const CICLOS_PARA_ESTIMAR = ['WLTP', 'NEDC', 'EPA', 'CLTC'].map((nombre) => CICLOS.find((c) => c.nombre === nombre)!);

/** Autonomía real del carro en su mejor ciclo y su equivalente WLTP estimado. */
function autonomiaEstimada(v: Vehiculo): { ciclo: Ciclo; km: number; wltp: number } | null {
  for (const ciclo of CICLOS_PARA_ESTIMAR) {
    const km = autonomiaEnCiclo(v, ciclo);
    if (km !== null) return { ciclo, km, wltp: Math.round(km * A_WLTP[ciclo.nombre]) };
  }
  return null;
}

/** Cómo se compara la autonomía de dos carros: en un ciclo común o, si no lo hay, estimada en WLTP. */
function comparacionAutonomia(a: Vehiculo, b: Vehiculo) {
  const ciclo = cicloComun(a, b);
  if (ciclo) return { tipo: 'comun' as const, ciclo };
  const ea = autonomiaEstimada(a);
  const eb = autonomiaEstimada(b);
  if (ea && eb) return { tipo: 'estimada' as const, ea, eb };
  return null;
}

const SEGURIDAD = [
  'autonomous_emergency_braking',
  'adaptive_cruise_control',
  'lane_keeping_assist',
  'blind_spot_monitor',
  'camera_360',
  'isofix',
];

const CONFORT = [
  'apple_carplay',
  'android_auto',
  'panoramic_roof',
  'ventilated_seats',
  'heated_seats',
  'wireless_charger',
  'heat_pump',
];

function velocidadDeCarga(v: Vehiculo): number | null {
  // Sin carga rápida en DC no es un dato que falta: puntúa 0
  if (v.dc_charging === false) return 0;
  const desde = v.dc_charge_from_pct;
  const hasta = v.dc_charge_to_pct;
  const minutos = v.dc_charge_min;
  if (typeof desde !== 'number' || typeof hasta !== 'number' || typeof minutos !== 'number') return null;
  return (hasta - desde) / minutos;
}

function espacio(v: Vehiculo): number | null {
  if (typeof v.trunk_l !== 'number') return null;
  return v.trunk_l + (typeof v.front_trunk_l === 'number' ? v.front_trunk_l : 0);
}

/**
 * Puntajes orientativos de 0 a 100 por eje. Se calculan contra rangos fijos, no contra
 * el otro carro, para que el puntaje de un carro no cambie según con cuál se compare.
 * Autonomía, potencia y espacio empiezan en 0: el puntaje es proporcional a la cifra y un carro
 * pequeño con dato real no queda en 0. La aceleración va hasta 16 s para incluir a los más lentos (14,6 s).
 */
export function calcularEjes(a: Vehiculo, b: Vehiculo, idioma: Idioma = 'es'): Eje[] {
  const { areas, ficha } = textos(idioma);
  // El puntaje de autonomía sale siempre del equivalente WLTP de cada carro (su cifra WLTP si la tiene),
  // para que no cambie según el rival. La tabla compara las cifras reales en un ciclo común cuando lo hay.
  const ea = autonomiaEstimada(a);
  const eb = autonomiaEstimada(b);
  const todoWltp = [ea, eb].every((e) => !e || e.ciclo.nombre === 'WLTP');

  return [
    {
      clave: 'autonomia',
      nombre: areas.autonomia.nombre,
      detalle: todoWltp ? ficha.cicloWltpDetalle : ficha.equivalenteDetalle,
      a: ea ? escala(ea.wltp, 0, 800) : null,
      b: eb ? escala(eb.wltp, 0, 800) : null,
    },
    {
      clave: 'potencia',
      nombre: areas.potencia.nombre,
      detalle: ficha.potenciaDetalle,
      a: escala(a.power_kw, 0, 400),
      b: escala(b.power_kw, 0, 400),
    },
    {
      clave: 'aceleracion',
      nombre: areas.aceleracion.nombre,
      detalle: ficha.aceleracionDetalle,
      a: escala(a.acceleration_0_100_s, 3, 16, true),
      b: escala(b.acceleration_0_100_s, 3, 16, true),
    },
    {
      clave: 'carga',
      nombre: areas.carga.nombre,
      detalle: ficha.cargaDetalle,
      a: escala(velocidadDeCarga(a), 0.5, 5),
      b: escala(velocidadDeCarga(b), 0.5, 5),
    },
    {
      clave: 'espacio',
      nombre: areas.espacio.nombre,
      detalle: ficha.espacioDetalle,
      a: escala(espacio(a), 0, 900),
      b: escala(espacio(b), 0, 900),
    },
    {
      clave: 'seguridad',
      nombre: areas.seguridad.nombre,
      detalle: ficha.seguridadDetalle,
      a: porcentaje(a, SEGURIDAD),
      b: porcentaje(b, SEGURIDAD),
    },
    {
      clave: 'confort',
      nombre: areas.confort.nombre,
      detalle: ficha.confortDetalle,
      a: porcentaje(a, CONFORT),
      b: porcentaje(b, CONFORT),
    },
  ];
}

// --- Veredicto

export interface Veredicto {
  /** Quién sale mejor en el conjunto; null si están parejos. */
  ganador: 'a' | 'b' | null;
  /** Qué tan clara es la diferencia. */
  margen: 'parejos' | 'por poco' | 'claro';
  promedioA: number;
  promedioB: number;
  /** En qué conviene cada uno: los ejes donde lleva ventaja. */
  motivosA: string[];
  motivosB: string[];
  /** Ejes que no entraron en la cuenta porque a algún carro le falta el dato. */
  ejesSinDato: string[];
  ejesComparados: number;
}

/**
 * Compara los puntajes del gráfico. Solo cuentan los ejes con dato en los dos carros.
 * No incluye el precio, porque la tabla no lo guarda.
 */
export function calcularVeredicto(ejes: Eje[], idioma: Idioma = 'es'): Veredicto | null {
  const comparables = ejes.filter((eje) => eje.a !== null && eje.b !== null);
  if (comparables.length < 3) return null;

  const promedio = (serie: 'a' | 'b') =>
    comparables.reduce((suma, eje) => suma + (eje[serie] as number), 0) / comparables.length;
  const promedioA = promedio('a');
  const promedioB = promedio('b');
  const diferencia = Math.abs(promedioA - promedioB);
  // Menos de 2 puntos de promedio es una diferencia que no se nota en el uso
  const margen = diferencia < 2 ? 'parejos' : diferencia < 7 ? 'por poco' : 'claro';
  const motivos = (serie: 'a' | 'b', otra: 'a' | 'b') =>
    comparables
      .filter((eje) => (eje[serie] as number) > (eje[otra] as number))
      .sort((x, y) => (y[serie] as number) - (y[otra] as number) - ((x[serie] as number) - (x[otra] as number)))
      .map((eje) => textos(idioma).areas[eje.clave].motivo);

  return {
    ganador: margen === 'parejos' ? null : promedioA > promedioB ? 'a' : 'b',
    margen,
    promedioA: Math.round(promedioA),
    promedioB: Math.round(promedioB),
    motivosA: motivos('a', 'b'),
    motivosB: motivos('b', 'a'),
    ejesSinDato: ejes.filter((eje) => eje.a === null || eje.b === null).map((eje) => eje.nombre),
    ejesComparados: comparables.length,
  };
}

// --- Resumen de cada área con datos reales, para la tabla junto al gráfico

export interface ResumenArea {
  clave: ClaveArea;
  nombre: string;
  /** Aclaración corta bajo el nombre del área ("Ciclo WLTP", "Baúl trasero y delantero"). */
  aclaracion: string;
  /** Dato real de cada carro, con unidad; null si no lo tiene. */
  a: string | null;
  b: string | null;
  /** Dato secundario en letra pequeña (los caballos, el frunk). */
  extraA: string | null;
  extraB: string | null;
  ganador: 'a' | 'b' | null;
  /** "4× más", "+181 km", "Casi iguales"; null si falta un dato. */
  diferencia: string | null;
  /** Puntaje de 0 a 100 de cada carro, para la barra. */
  puntajeA: number | null;
  puntajeB: number | null;
  /** La comparación usa una equivalencia estimada (autonomía en ciclos distintos), no cifras directas. */
  estimado?: boolean;
}

const num = (valor: number, idioma: Idioma, decimales = 0) => formatearNumero(Number(valor.toFixed(decimales)), idioma);

/** Diferencia en palabras entre dos números, según qué valor es mejor. */
function textoDiferencia(va: number, vb: number, mejor: 'mayor' | 'menor', unidad: string, idioma: Idioma, decimales = 0) {
  const t = textos(idioma).ficha;
  const mayor = Math.max(va, vb);
  const menor = Math.min(va, vb);
  if (mayor === 0 || (mayor - menor) / mayor < 0.05) return { ganador: null, texto: t.casiIguales };
  const ganador: 'a' | 'b' = (va > vb) === (mejor === 'mayor') ? 'a' : 'b';
  // Desde el doble se lee mejor como multiplicador, pero solo cuando más es mejor
  if (mejor === 'mayor' && menor > 0 && mayor / menor >= 2) return { ganador, texto: t.vecesMas(num(mayor / menor, idioma, 1)) };
  const signo = mejor === 'mayor' ? '+' : '−';
  return { ganador, texto: `${signo}${num(mayor - menor, idioma, decimales)} ${unidad}` };
}

const conteo = (v: Vehiculo, campos: string[]) => {
  const conocidos = campos.map((campo) => v[campo]).filter((valor) => typeof valor === 'boolean');
  return conocidos.length < 3 ? null : { tiene: conocidos.filter(Boolean).length, de: conocidos.length };
};

/** El dato real de cada área para los dos carros. Usa los mismos datos que el puntaje del gráfico. */
export function resumirAreas(ejes: Eje[], a: Vehiculo, b: Vehiculo, idioma: Idioma = 'es'): ResumenArea[] {
  const { areas, ficha: t } = textos(idioma);
  const n = (valor: number, decimales = 0) => num(valor, idioma, decimales);
  const autonomia = comparacionAutonomia(a, b);
  const puntaje = (clave: ClaveArea) => ejes.find((eje) => eje.clave === clave) ?? { a: null, b: null };
  // Las millas van en la línea de abajo: la cifra principal no se parte
  const millas = (km: number) => (idioma === 'es' ? null : `${formatearNumero(aMillas(km), idioma)} mi`);
  const unir = (...partes: (string | null)[]) => partes.filter(Boolean).join(' · ') || null;

  const fila = (
    clave: ClaveArea,
    aclaracion: string,
    valores: [number | null, number | null],
    formato: (valor: number) => string,
    mejor: 'mayor' | 'menor',
    unidad: string,
    extra: (v: Vehiculo, valor: number) => string | null = () => null,
    decimales = 0,
  ): ResumenArea => {
    const [va, vb] = valores;
    const diferencia = va !== null && vb !== null ? textoDiferencia(va, vb, mejor, unidad, idioma, decimales) : null;
    return {
      clave,
      nombre: areas[clave].nombre,
      aclaracion,
      a: va === null ? null : formato(va),
      b: vb === null ? null : formato(vb),
      extraA: va === null ? null : extra(a, va),
      extraB: vb === null ? null : extra(b, vb),
      ganador: diferencia?.ganador ?? null,
      diferencia: diferencia?.texto ?? null,
      puntajeA: puntaje(clave).a,
      puntajeB: puntaje(clave).b,
    };
  };
  const numero = (valor: unknown) => (typeof valor === 'number' ? valor : null);
  const carga = (v: Vehiculo) =>
    typeof v.dc_charge_from_pct === 'number' && typeof v.dc_charge_to_pct === 'number' && typeof v.dc_charge_min === 'number'
      ? v
      : null;
  const mismoTramo =
    carga(a) && carga(b) && a.dc_charge_from_pct === b.dc_charge_from_pct && a.dc_charge_to_pct === b.dc_charge_to_pct;
  // Equipamiento: "4 de 6"; gana quien trae una proporción mayor de lo conocido
  const equipamiento = (
    clave: ClaveArea,
    aclaracion: string,
    campos: string[],
    cuentas: ({ tiene: number; de: number } | null)[],
    texto: string,
  ): ResumenArea => {
    const base = fila(clave, aclaracion, [porcentaje(a, campos), porcentaje(b, campos)], () => '', 'mayor', '');
    return {
      ...base,
      a: cuentas[0] ? t.deTotal(cuentas[0].tiene, cuentas[0].de) : null,
      b: cuentas[1] ? t.deTotal(cuentas[1].tiene, cuentas[1].de) : null,
      diferencia: cuentas[0] && cuentas[1] ? (base.ganador ? texto : t.parejos) : null,
    };
  };
  const seguridad = [conteo(a, SEGURIDAD), conteo(b, SEGURIDAD)];
  const confort = [conteo(a, CONFORT), conteo(b, CONFORT)];

  // Ciclos distintos: se muestra la cifra real de cada uno y se compara su equivalente WLTP estimado
  const autonomiaEstimadaFila = (): ResumenArea => {
    if (autonomia?.tipo !== 'estimada') return fila('autonomia', t.sinAutonomia, [null, null], String, 'mayor', 'km');
    const { ea, eb } = autonomia;
    const gasolina = (v: Vehiculo, e: typeof ea) => (typeof v[e.ciclo.campo] === 'number' ? '' : `, ${t.conGasolina}`);
    const extra = (v: Vehiculo, e: typeof ea) =>
      unir(
        millas(e.km),
        e.ciclo.nombre === 'WLTP'
          ? `WLTP${gasolina(v, e)}`
          : `${e.ciclo.nombre}${gasolina(v, e)} · ≈ ${n(e.wltp)} km WLTP`,
      );
    // Con una equivalencia aproximada, menos del 10 % de diferencia no basta para dar un ganador
    const cerca = Math.abs(ea.wltp - eb.wltp) / Math.max(ea.wltp, eb.wltp) < 0.1;
    const diferencia = cerca ? { ganador: null, texto: t.casiIguales } : textoDiferencia(ea.wltp, eb.wltp, 'mayor', 'km', idioma);
    return {
      clave: 'autonomia',
      nombre: areas.autonomia.nombre,
      aclaracion: t.ciclosDistintos,
      a: `${n(ea.km)} km`,
      b: `${n(eb.km)} km`,
      extraA: extra(a, ea),
      extraB: extra(b, eb),
      ganador: diferencia.ganador,
      diferencia: diferencia.ganador ? `≈ ${diferencia.texto}` : diferencia.texto,
      puntajeA: puntaje('autonomia').a,
      puntajeB: puntaje('autonomia').b,
      estimado: true,
    };
  };

  return [
    autonomia?.tipo === 'comun'
      ? fila('autonomia', t.ciclo(autonomia.ciclo.nombre), [autonomiaEnCiclo(a, autonomia.ciclo), autonomiaEnCiclo(b, autonomia.ciclo)], (x) => `${n(x)} km`, 'mayor', 'km', (v, km) =>
          // La combinada suma batería y gasolina: se dice para no compararla como si fuera solo eléctrica
          unir(millas(km), typeof v[autonomia.ciclo.campo] === 'number' ? null : t.conGasolina),
        )
      : autonomiaEstimadaFila(),
    fila('potencia', t.potenciaMaxima, [numero(a.power_kw), numero(b.power_kw)], (x) => `${n(x)} kW`, 'mayor', 'kW', (v) =>
      typeof v.power_hp === 'number' ? `${n(v.power_hp)} hp` : null,
    ),
    fila('aceleracion', t.de0a100, [numero(a.acceleration_0_100_s), numero(b.acceleration_0_100_s)], (x) => `${n(x, 1)} s`, 'menor', 's', undefined, 1),
    // La carga se compara por velocidad; si los dos miden el mismo tramo, la diferencia va en minutos
    mismoTramo
      ? fila('carga', t.tramo(a.dc_charge_from_pct, a.dc_charge_to_pct), [numero(a.dc_charge_min), numero(b.dc_charge_min)], (x) => `${n(x)} min`, 'menor', 'min')
      : (() => {
          const base = fila('carga', t.tiempoCarga, [velocidadDeCarga(a), velocidadDeCarga(b)], () => '', 'mayor', '');
          return {
            ...base,
            diferencia:
              base.diferencia === null
                ? null
                : base.ganador
                  ? textoDiferenciaVelocidad(velocidadDeCarga(a)!, velocidadDeCarga(b)!, idioma)
                  : a.dc_charging === false && b.dc_charging === false
                    ? t.ningunoTiene
                    : t.casiIguales,
            a: carga(a) ? `${n(a.dc_charge_min as number)} min` : a.dc_charging === false ? t.noTiene : null,
            b: carga(b) ? `${n(b.dc_charge_min as number)} min` : b.dc_charging === false ? t.noTiene : null,
            extraA: carga(a) ? t.tramoMinuscula(a.dc_charge_from_pct, a.dc_charge_to_pct) : null,
            extraB: carga(b) ? t.tramoMinuscula(b.dc_charge_from_pct, b.dc_charge_to_pct) : null,
          };
        })(),
    fila('espacio', t.baulTraseroDelantero, [espacio(a), espacio(b)], (x) => `${n(x)} L`, 'mayor', 'L', (v) =>
      typeof v.front_trunk_l === 'number' ? t.incluyeFrunk(n(v.front_trunk_l)) : null,
    ),
    equipamiento('seguridad', t.seguridadDetalle, SEGURIDAD, seguridad, t.masAyudas),
    equipamiento('confort', t.confortDetalle, CONFORT, confort, t.masEquipado),
  ];
}

/** Con tramos de carga distintos no se pueden restar minutos: se dice cuál carga más rápido. */
function textoDiferenciaVelocidad(va: number, vb: number, idioma: Idioma): string {
  const t = textos(idioma).ficha;
  const mayor = Math.max(va, vb);
  const menor = Math.min(va, vb);
  if ((mayor - menor) / mayor < 0.05) return t.casiIguales;
  // Contra un carro sin carga rápida no hay proporción que dar
  if (menor === 0) return t.soloEste;
  return menor > 0 && mayor / menor >= 2 ? t.vecesMasRapida(num(mayor / menor, idioma, 1)) : t.cargaMasRapido;
}

// --- Áreas del gráfico: qué filas de la ficha explican cada eje

export const CAMPOS_POR_AREA: Record<ClaveArea, string[]> = {
  autonomia: ['range_wltp_km', 'range_cltc_km', 'range_epa_km', 'range_nedc_km', 'battery_kwh', 'consumption_kwh_100km'],
  potencia: ['power_kw', 'torque_nm', 'top_speed_kmh', 'motor_count'],
  aceleracion: ['acceleration_0_100_s', 'power_kw', 'curb_weight_kg'],
  carga: ['dc_charge_kw', 'dc_charge_min', 'ac_charge_kw', 'connector'],
  espacio: ['trunk_l', 'front_trunk_l', 'length_mm', 'wheelbase_mm', 'seats'],
  seguridad: [...SEGURIDAD, 'airbags', 'ncap_stars'],
  confort: [...CONFORT, 'screen_inches'],
};

const filasDe = (idioma: Idioma) => secciones(idioma).flatMap((seccion) => seccion.filas);
export const buscarFila = (campo: string, idioma: Idioma = 'es') => filasDe(idioma).find((fila) => fila.campo === campo);

// --- Mayores diferencias

export interface Diferencia {
  fila: Fila;
  ganador: 'a' | 'b';
  /** Texto de la ventaja: "+120 km" o "1,9×". */
  ventaja: string;
  /** Diferencia relativa, para ordenar. */
  peso: number;
}

/** Las filas con más diferencia relativa entre los dos carros, de mayor a menor. */
export function mayoresDiferencias(a: Vehiculo, b: Vehiculo, idioma: Idioma = 'es', cantidad = 5): Diferencia[] {
  const lista: Diferencia[] = [];
  for (const fila of filasDe(idioma)) {
    // La potencia en hp repite la de kW
    if (fila.campo === 'power_hp') continue;
    const quien = ganador(fila, a, b);
    // Una diferencia contra "sin límite" no se puede medir
    if (!quien || typeof a[fila.campo] !== 'number' || typeof b[fila.campo] !== 'number') continue;
    const va = a[fila.campo] as number;
    const vb = b[fila.campo] as number;
    const mayor = Math.max(va, vb);
    const menor = Math.min(va, vb);
    const peso = menor > 0 ? mayor / menor - 1 : 1;
    // Desde el doble se lee mejor como "2×"; por debajo, la diferencia con su unidad
    const ventaja =
      peso >= 1 && menor > 0
        ? `${formatearNumero(Math.round((mayor / menor) * 10) / 10, idioma)}×`
        : `${fila.mejor === 'menor' ? '−' : '+'}${formatearNumero(Math.round((mayor - menor) * 10) / 10, idioma)}${fila.unidad ? ` ${fila.unidad}` : ''}`;
    lista.push({ fila, ganador: quien, ventaja, peso });
  }
  return lista.sort((x, y) => y.peso - x.peso).slice(0, cantidad);
}

// --- Buscador

/** Minúsculas y sin tildes, para que "electrico" encuentre "Eléctrico". */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const nombreMercado = (codigo: string, idioma: Idioma = 'es') =>
  (textos(idioma).mercados as Record<string, string>)[codigo] ?? codigo;

/**
 * Carros que contienen todas las palabras escritas, en marca, modelo, versión, año,
 * mercado o nombre en Latinoamérica. Primero los que empiezan por lo escrito.
 */
export function buscarVehiculos(vehiculos: Vehiculo[], consulta: string): Vehiculo[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return vehiculos;
  const resultados = vehiculos
    .map((v) => {
      const nombre = normalizar(`${v.brand} ${v.model}`);
      const texto = normalizar(
        // El mercado se busca en todos los idiomas: quien lee en inglés puede escribir "Europa" o "Europe"
        [v.brand, v.model, v.version, v.model_year, v.market, nombreMercado(v.market, 'es'), nombreMercado(v.market, 'en'), v.latam_name ?? ''].join(' '),
      );
      if (!palabras.every((palabra) => texto.includes(palabra))) return null;
      const orden = nombre.startsWith(palabras.join(' ')) ? 0 : normalizar(v.model).startsWith(palabras[0]) ? 1 : 2;
      return { v, orden };
    })
    .filter((r): r is { v: Vehiculo; orden: number } => r !== null);
  return resultados.sort((x, y) => x.orden - y.orden).map((r) => r.v);
}

/**
 * Muestra para la lista vacía del buscador: un carro por modelo, alternando marcas,
 * para que se vea la variedad y no solo la primera marca del abecedario.
 */
export function muestraVariada(vehiculos: Vehiculo[], cantidad: number): Vehiculo[] {
  const porMarca = new Map<string, Vehiculo[]>();
  const modelos = new Set<string>();
  for (const v of vehiculos) {
    const modelo = nombreModelo(v);
    if (modelos.has(modelo)) continue;
    modelos.add(modelo);
    porMarca.set(v.brand, [...(porMarca.get(v.brand) ?? []), v]);
  }
  const colas = [...porMarca.values()];
  const muestra: Vehiculo[] = [];
  for (let ronda = 0; muestra.length < cantidad && colas.some((cola) => cola.length > ronda); ronda++) {
    for (const cola of colas) if (cola[ronda] && muestra.length < cantidad) muestra.push(cola[ronda]);
  }
  return muestra;
}

/** Marcas con su número de carros, de la que tiene más a la que tiene menos. */
export function marcas(vehiculos: Vehiculo[]): { marca: string; total: number }[] {
  const conteo = new Map<string, number>();
  for (const v of vehiculos) conteo.set(v.brand, (conteo.get(v.brand) ?? 0) + 1);
  return [...conteo.entries()].map(([marca, total]) => ({ marca, total })).sort((x, y) => y.total - x.total || x.marca.localeCompare(y.marca));
}

/** Cómo presentar el otro nombre: en una ficha de fuera, el de Latinoamérica; en una latinoamericana, el alterno. */
export function textoOtroNombre(v: Vehiculo, idioma: Idioma = 'es'): string | null {
  if (!v.latam_name) return null;
  const t = textos(idioma).ficha;
  return ['CO', 'MX', 'BR', 'CL', 'AR', 'PE', 'EC'].includes(v.market) ? t.otroNombreTambien(v.latam_name) : t.otroNombreLatam(v.latam_name);
}

/** Une una lista en una frase: "a, b y c". */
export const enumerar = (lista: string[], idioma: Idioma = 'es') =>
  new Intl.ListFormat(LOCALE[idioma], { type: 'conjunction' }).format(lista);
