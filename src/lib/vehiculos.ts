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
export const nombreCompleto = (v: Vehiculo) => `${v.brand} ${v.model} ${v.version}`;

// 'always' para que 4620 salga como 4.620: en español el separador no se pone solo en cifras de cuatro dígitos
const numero = new Intl.NumberFormat('es', { maximumFractionDigits: 2, useGrouping: 'always' });
export const formatearNumero = (valor: number) => numero.format(valor);

// --- Traducción de los valores guardados (en inglés) al español de la interfaz

const TEXTOS: Record<string, Record<string, string>> = {
  powertrain: {
    electric: 'Eléctrico',
    range_extender: 'Eléctrico de rango extendido',
    plug_in_hybrid: 'Híbrido enchufable',
    hybrid: 'Híbrido',
    mild_hybrid: 'Híbrido ligero',
    gasoline: 'Gasolina',
    diesel: 'Diésel',
  },
  segment: {
    mini: 'Mini',
    small: 'Pequeño',
    compact: 'Compacto',
    midsize: 'Mediano',
    large: 'Grande',
    luxury: 'Lujo',
  },
  body_style: {
    hatchback: 'Hatchback',
    sedan: 'Sedán',
    suv: 'SUV',
    coupe_suv: 'SUV cupé',
    wagon: 'Familiar',
    coupe: 'Cupé',
    convertible: 'Convertible',
    pickup: 'Pickup',
    minivan: 'Minivan',
    van: 'Van',
  },
  drivetrain: { fwd: 'Delantera', rwd: 'Trasera', awd: 'Total' },
  transmission: {
    manual: 'Manual',
    automatic: 'Automática',
    cvt: 'CVT',
    dual_clutch: 'Doble embrague',
    single_speed: 'Una sola relación',
  },
  battery_chemistry: { sodium_ion: 'Sodio', solid_state: 'Estado sólido', other: 'Otra' },
  emission_standard: {
    euro_4: 'Euro 4',
    euro_5: 'Euro 5',
    euro_6: 'Euro 6',
    euro_7: 'Euro 7',
    china_6: 'China 6',
    epa_tier_3: 'EPA Tier 3',
    other: 'Otra',
  },
  connector: { GBT: 'GB/T', Type1: 'Tipo 1', Type2: 'Tipo 2' },
  ncap_body: {
    euro_ncap: 'Euro NCAP',
    latin_ncap: 'Latin NCAP',
    c_ncap: 'C-NCAP',
    ancap: 'ANCAP',
    asean_ncap: 'ASEAN NCAP',
    global_ncap: 'Global NCAP',
    nhtsa: 'NHTSA',
  },
};

export const traducir = (campo: string, valor: string) => TEXTOS[campo]?.[valor] ?? valor;

// --- Filas de la comparación

export interface Fila {
  campo: string;
  etiqueta: string;
  unidad?: string;
  /** Qué valor es mejor. Sin esto, la fila se muestra sin marcar un ganador. */
  mejor?: 'mayor' | 'menor';
}

export interface Seccion {
  id: string;
  titulo: string;
  filas: Fila[];
}

export const SECCIONES: Seccion[] = [
  {
    id: 'general',
    titulo: 'General',
    filas: [
      { campo: 'powertrain', etiqueta: 'Motorización' },
      { campo: 'body_style', etiqueta: 'Carrocería' },
      { campo: 'segment', etiqueta: 'Tamaño' },
      { campo: 'model_year', etiqueta: 'Año modelo' },
      { campo: 'market', etiqueta: 'Mercado de la ficha' },
      { campo: 'warranty_years', etiqueta: 'Garantía', unidad: 'años', mejor: 'mayor' },
      { campo: 'warranty_km', etiqueta: 'Garantía por kilometraje', unidad: 'km', mejor: 'mayor' },
    ],
  },
  {
    id: 'rendimiento',
    titulo: 'Rendimiento',
    filas: [
      { campo: 'power_kw', etiqueta: 'Potencia', unidad: 'kW', mejor: 'mayor' },
      { campo: 'power_hp', etiqueta: 'Potencia en caballos', unidad: 'hp', mejor: 'mayor' },
      { campo: 'torque_nm', etiqueta: 'Torque', unidad: 'Nm', mejor: 'mayor' },
      { campo: 'acceleration_0_100_s', etiqueta: '0 a 100 km/h', unidad: 's', mejor: 'menor' },
      { campo: 'top_speed_kmh', etiqueta: 'Velocidad máxima', unidad: 'km/h', mejor: 'mayor' },
      { campo: 'drivetrain', etiqueta: 'Tracción' },
      { campo: 'motor_count', etiqueta: 'Motores eléctricos' },
      { campo: 'transmission', etiqueta: 'Caja' },
      { campo: 'gear_count', etiqueta: 'Marchas' },
    ],
  },
  {
    id: 'bateria',
    titulo: 'Batería y autonomía',
    filas: [
      { campo: 'battery_kwh', etiqueta: 'Batería', unidad: 'kWh', mejor: 'mayor' },
      { campo: 'battery_chemistry', etiqueta: 'Química de la batería' },
      { campo: 'range_wltp_km', etiqueta: 'Autonomía WLTP', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_cltc_km', etiqueta: 'Autonomía CLTC', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_epa_km', etiqueta: 'Autonomía EPA', unidad: 'km', mejor: 'mayor' },
      { campo: 'range_nedc_km', etiqueta: 'Autonomía NEDC', unidad: 'km', mejor: 'mayor' },
      { campo: 'consumption_kwh_100km', etiqueta: 'Consumo eléctrico', unidad: 'kWh/100 km', mejor: 'menor' },
      { campo: 'battery_warranty_years', etiqueta: 'Garantía de la batería', unidad: 'años', mejor: 'mayor' },
      { campo: 'battery_warranty_km', etiqueta: 'Garantía de la batería por kilometraje', unidad: 'km', mejor: 'mayor' },
    ],
  },
  {
    id: 'carga',
    titulo: 'Carga',
    filas: [
      { campo: 'dc_charge_kw', etiqueta: 'Carga rápida', unidad: 'kW', mejor: 'mayor' },
      { campo: 'dc_charge_min', etiqueta: 'Tiempo de carga rápida', unidad: 'min', mejor: 'menor' },
      { campo: 'ac_charge_kw', etiqueta: 'Carga lenta', unidad: 'kW', mejor: 'mayor' },
      { campo: 'connector', etiqueta: 'Conector' },
      { campo: 'v2l', etiqueta: 'Alimenta aparatos externos (V2L)' },
    ],
  },
  {
    id: 'combustion',
    titulo: 'Combustión e híbridos',
    filas: [
      { campo: 'displacement_cc', etiqueta: 'Cilindrada', unidad: 'cc' },
      { campo: 'cylinder_count', etiqueta: 'Cilindros' },
      { campo: 'turbo', etiqueta: 'Turbo' },
      { campo: 'fuel_consumption_l_100km', etiqueta: 'Consumo combinado', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_consumption_city_l_100km', etiqueta: 'Consumo en ciudad', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_consumption_highway_l_100km', etiqueta: 'Consumo en carretera', unidad: 'L/100 km', mejor: 'menor' },
      { campo: 'fuel_tank_l', etiqueta: 'Tanque', unidad: 'L', mejor: 'mayor' },
      { campo: 'electric_range_km', etiqueta: 'Autonomía solo eléctrica', unidad: 'km', mejor: 'mayor' },
      { campo: 'combined_range_km', etiqueta: 'Autonomía total', unidad: 'km', mejor: 'mayor' },
      { campo: 'co2_g_km', etiqueta: 'Emisiones de CO2', unidad: 'g/km', mejor: 'menor' },
      { campo: 'emission_standard', etiqueta: 'Norma de emisiones' },
    ],
  },
  {
    id: 'medidas',
    titulo: 'Medidas y espacio',
    filas: [
      { campo: 'length_mm', etiqueta: 'Largo', unidad: 'mm' },
      { campo: 'width_mm', etiqueta: 'Ancho', unidad: 'mm' },
      { campo: 'height_mm', etiqueta: 'Alto', unidad: 'mm' },
      { campo: 'wheelbase_mm', etiqueta: 'Distancia entre ejes', unidad: 'mm', mejor: 'mayor' },
      { campo: 'trunk_l', etiqueta: 'Baúl', unidad: 'L', mejor: 'mayor' },
      { campo: 'front_trunk_l', etiqueta: 'Baúl delantero', unidad: 'L', mejor: 'mayor' },
      { campo: 'curb_weight_kg', etiqueta: 'Peso en vacío', unidad: 'kg', mejor: 'menor' },
      { campo: 'ground_clearance_mm', etiqueta: 'Altura al suelo', unidad: 'mm', mejor: 'mayor' },
      { campo: 'seats', etiqueta: 'Puestos' },
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad',
    filas: [
      { campo: 'airbags', etiqueta: 'Bolsas de aire', mejor: 'mayor' },
      { campo: 'autonomous_emergency_braking', etiqueta: 'Frenado autónomo de emergencia' },
      { campo: 'adaptive_cruise_control', etiqueta: 'Control de crucero adaptativo' },
      { campo: 'lane_keeping_assist', etiqueta: 'Mantenimiento de carril' },
      { campo: 'blind_spot_monitor', etiqueta: 'Alerta de punto ciego' },
      { campo: 'camera_360', etiqueta: 'Cámara de 360 grados' },
      { campo: 'isofix', etiqueta: 'Anclajes ISOFIX' },
      { campo: 'ncap_stars', etiqueta: 'Estrellas en pruebas de choque', mejor: 'mayor' },
      { campo: 'ncap_body', etiqueta: 'Organismo de la prueba' },
    ],
  },
  {
    id: 'confort',
    titulo: 'Confort y tecnología',
    filas: [
      { campo: 'screen_inches', etiqueta: 'Pantalla central', unidad: 'pulgadas', mejor: 'mayor' },
      { campo: 'apple_carplay', etiqueta: 'Apple CarPlay' },
      { campo: 'android_auto', etiqueta: 'Android Auto' },
      { campo: 'panoramic_roof', etiqueta: 'Techo panorámico' },
      { campo: 'ventilated_seats', etiqueta: 'Asientos ventilados' },
      { campo: 'heated_seats', etiqueta: 'Asientos con calefacción' },
      { campo: 'wireless_charger', etiqueta: 'Cargador inalámbrico' },
      { campo: 'heat_pump', etiqueta: 'Bomba de calor' },
    ],
  },
];

/** Texto de una celda: número con unidad, sí o no, o el valor traducido. */
export function formatearValor(fila: Fila, valor: string | number | boolean | null): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'number') {
    // Los años no llevan separador de miles
    const texto = fila.campo === 'model_year' ? String(valor) : formatearNumero(valor);
    return fila.unidad ? `${texto} ${fila.unidad}` : texto;
  }
  return traducir(fila.campo, valor);
}

/** 'a' o 'b' si uno gana en esa fila; null si empatan, falta un dato o la fila no tiene ganador. */
export function ganador(fila: Fila, a: Vehiculo, b: Vehiculo): 'a' | 'b' | null {
  const va = a[fila.campo];
  const vb = b[fila.campo];
  if (!fila.mejor || typeof va !== 'number' || typeof vb !== 'number' || va === vb) return null;
  return (va > vb) === (fila.mejor === 'mayor') ? 'a' : 'b';
}

/** Frases del tipo "100 km más en autonomía CLTC" a favor de `propio` frente a `otro`. */
export function ventajas(propio: Vehiculo, otro: Vehiculo): string[] {
  const lista: string[] = [];
  for (const seccion of SECCIONES) {
    for (const fila of seccion.filas) {
      // La potencia en hp repite la de kW
      if (fila.campo === 'power_hp' || ganador(fila, propio, otro) !== 'a') continue;
      const diferencia = Math.abs((propio[fila.campo] as number) - (otro[fila.campo] as number));
      const cantidad = fila.unidad ? `${formatearNumero(diferencia)} ${fila.unidad}` : formatearNumero(diferencia);
      // Solo la inicial en minúscula, para no dañar siglas como CLTC
      const etiqueta = fila.etiqueta.charAt(0).toLowerCase() + fila.etiqueta.slice(1);
      lista.push(`${cantidad} ${fila.mejor === 'mayor' ? 'más' : 'menos'} en ${etiqueta}`);
    }
  }
  return lista;
}

// --- Puntajes del gráfico de araña

export interface Eje {
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
 */
export function calcularEjes(a: Vehiculo, b: Vehiculo): Eje[] {
  // La autonomía solo se compara dentro de un ciclo que tengan los dos
  const ciclo = CICLOS.find((c) => typeof a[c.campo] === 'number' && typeof b[c.campo] === 'number');

  return [
    {
      nombre: 'Autonomía',
      detalle: ciclo ? `Ciclo ${ciclo.nombre}, de 200 a 800 km` : 'Sin un ciclo de medición en común',
      a: ciclo ? escala(a[ciclo.campo], 200, 800) : null,
      b: ciclo ? escala(b[ciclo.campo], 200, 800) : null,
    },
    {
      nombre: 'Potencia',
      detalle: 'De 50 a 400 kW',
      a: escala(a.power_kw, 50, 400),
      b: escala(b.power_kw, 50, 400),
    },
    {
      nombre: 'Aceleración',
      detalle: '0 a 100 km/h, de 14 a 3 segundos',
      a: escala(a.acceleration_0_100_s, 3, 14, true),
      b: escala(b.acceleration_0_100_s, 3, 14, true),
    },
    {
      nombre: 'Carga rápida',
      detalle: 'Puntos de batería por minuto, de 0,5 a 5',
      a: escala(velocidadDeCarga(a), 0.5, 5),
      b: escala(velocidadDeCarga(b), 0.5, 5),
    },
    {
      nombre: 'Espacio',
      detalle: 'Baúl trasero y delantero, de 250 a 900 litros',
      a: escala(espacio(a), 250, 900),
      b: escala(espacio(b), 250, 900),
    },
    {
      nombre: 'Seguridad',
      detalle: 'Ayudas a la conducción que trae, entre las conocidas',
      a: porcentaje(a, SEGURIDAD),
      b: porcentaje(b, SEGURIDAD),
    },
    {
      nombre: 'Confort',
      detalle: 'Equipamiento de confort que trae, entre el conocido',
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

const MOTIVOS: Record<string, string> = {
  Autonomía: 'viajar más lejos sin cargar',
  Potencia: 'tener más potencia',
  Aceleración: 'una respuesta más rápida al acelerar',
  'Carga rápida': 'pasar menos tiempo cargando',
  Espacio: 'tener más espacio para equipaje',
  Seguridad: 'contar con más ayudas a la conducción',
  Confort: 'tener más equipamiento de confort',
};

/**
 * Compara los puntajes del gráfico. Solo cuentan los ejes con dato en los dos carros.
 * No incluye el precio, porque la tabla no lo guarda.
 */
export function calcularVeredicto(ejes: Eje[]): Veredicto | null {
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
      .map((eje) => MOTIVOS[eje.nombre] ?? eje.nombre.toLowerCase());

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

// --- Áreas del gráfico: qué filas de la ficha explican cada eje

export const CAMPOS_POR_AREA: Record<string, string[]> = {
  Autonomía: ['range_wltp_km', 'range_cltc_km', 'range_epa_km', 'range_nedc_km', 'battery_kwh', 'consumption_kwh_100km'],
  Potencia: ['power_kw', 'torque_nm', 'top_speed_kmh', 'motor_count'],
  Aceleración: ['acceleration_0_100_s', 'power_kw', 'curb_weight_kg'],
  'Carga rápida': ['dc_charge_kw', 'dc_charge_min', 'ac_charge_kw', 'connector'],
  Espacio: ['trunk_l', 'front_trunk_l', 'length_mm', 'wheelbase_mm', 'seats'],
  Seguridad: [...SEGURIDAD, 'airbags', 'ncap_stars'],
  Confort: [...CONFORT, 'screen_inches'],
};

const FILAS = SECCIONES.flatMap((seccion) => seccion.filas);
export const buscarFila = (campo: string) => FILAS.find((fila) => fila.campo === campo);

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
export function mayoresDiferencias(a: Vehiculo, b: Vehiculo, cantidad = 5): Diferencia[] {
  const lista: Diferencia[] = [];
  for (const fila of FILAS) {
    // La potencia en hp repite la de kW
    if (fila.campo === 'power_hp') continue;
    const quien = ganador(fila, a, b);
    if (!quien) continue;
    const va = a[fila.campo] as number;
    const vb = b[fila.campo] as number;
    const mayor = Math.max(va, vb);
    const menor = Math.min(va, vb);
    const peso = menor > 0 ? mayor / menor - 1 : 1;
    // Desde el doble se lee mejor como "2×"; por debajo, la diferencia con su unidad
    const ventaja =
      peso >= 1 && menor > 0
        ? `${formatearNumero(Math.round((mayor / menor) * 10) / 10)}×`
        : `${fila.mejor === 'menor' ? '−' : '+'}${formatearNumero(Math.round((mayor - menor) * 10) / 10)}${fila.unidad ? ` ${fila.unidad}` : ''}`;
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

const MERCADOS: Record<string, string> = { CO: 'Colombia', CN: 'China', EU: 'Europa', DE: 'Alemania' };
export const nombreMercado = (codigo: string) => MERCADOS[codigo] ?? codigo;

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
        [v.brand, v.model, v.version, v.model_year, v.market, nombreMercado(v.market), v.latam_name ?? ''].join(' '),
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
export const textoOtroNombre = (v: Vehiculo) =>
  v.latam_name ? (['CO', 'MX', 'BR', 'CL', 'AR', 'PE', 'EC'].includes(v.market) ? `También se conoce como ${v.latam_name}` : `En Latinoamérica: ${v.latam_name}`) : null;

/** Une una lista en una frase: "a, b y c". */
export const enumerar = (lista: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(lista);
