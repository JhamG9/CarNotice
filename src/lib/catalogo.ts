import { slugificar } from './rutas';
import { calcularEjes, formatearNumero, nombreMercado, nombreModelo, traducir, type Vehiculo } from './vehiculos';

/**
 * Catálogo de modelos y comparaciones con página propia.
 *
 * Una página por modelo (no por versión): las versiones de un modelo se parecen tanto que, por separado,
 * serían contenido duplicado. Las comparaciones con página propia son solo entre rivales reales.
 * Todo sale de las mismas fichas del comparador; estas funciones no leen la base de datos.
 */

export interface Modelo {
  /** "kia-ev2": marca y modelo, sin versión ni mercado. */
  slug: string;
  marca: string;
  /** "Kia EV2" */
  nombre: string;
  /** Todas sus versiones publicadas, por mercado y de la más básica a la más alta. */
  versiones: Vehiculo[];
  /** Mercados con ficha, del que tiene más versiones al que tiene menos. */
  mercados: string[];
  /** Versión que lo representa en listados y comparaciones: la más básica de su mercado principal. */
  representativa: Vehiculo;
}

export interface Par {
  /** "byd-seagull-vs-kia-ev2", en orden alfabético para que cada par exista una sola vez. */
  slug: string;
  a: Modelo;
  b: Modelo;
  /** Versiones que se comparan: las más básicas de un mercado que tengan los dos, si lo hay. */
  va: Vehiculo;
  vb: Vehiculo;
  /** Mercado común de las dos versiones, o null si cada una es de un mercado distinto. */
  mercado: string | null;
  /** Áreas del gráfico con dato en los dos carros. */
  areas: number;
}

/** Desempate de mercados con el mismo número de versiones: primero los de más alcance. */
const PRIORIDAD_MERCADOS = ['EU', 'US', 'CN', 'CO', 'MX', 'BR', 'CL', 'AR', 'PE', 'EC'];
const prioridad = (mercado: string) => {
  const i = PRIORIDAD_MERCADOS.indexOf(mercado);
  return i === -1 ? PRIORIDAD_MERCADOS.length : i;
};

/** Tamaños de menor a mayor: una comparación con página propia es entre tamaños iguales o vecinos. */
const SEGMENTOS = ['mini', 'small', 'compact', 'midsize', 'large', 'luxury'];

/** Mínimo de áreas comparables para que una comparación merezca página propia. */
const MIN_AREAS = 5;

export const slugModelo = (v: Vehiculo) => slugificar(nombreModelo(v));
export const slugPar = (modeloA: string, modeloB: string) => [modeloA, modeloB].sort().join('-vs-');

/** De la versión más básica a la más alta: menos batería primero (la de entrada), luego menos potencia. */
const porNivel = (x: Vehiculo, y: Vehiculo) =>
  Number(x.battery_kwh ?? Infinity) - Number(y.battery_kwh ?? Infinity) ||
  Number(x.power_kw ?? Infinity) - Number(y.power_kw ?? Infinity) ||
  x.version.localeCompare(y.version);

/** La versión más básica de un modelo en un mercado. */
export const versionBase = (modelo: Modelo, mercado: string) =>
  modelo.versiones.filter((v) => v.market === mercado).sort(porNivel)[0];

export function agruparModelos(vehiculos: Vehiculo[]): Modelo[] {
  const grupos = new Map<string, Vehiculo[]>();
  for (const v of vehiculos) grupos.set(slugModelo(v), [...(grupos.get(slugModelo(v)) ?? []), v]);

  return [...grupos.entries()]
    .map(([slug, versiones]) => {
      const conteo = new Map<string, number>();
      for (const v of versiones) conteo.set(v.market, (conteo.get(v.market) ?? 0) + 1);
      const mercados = [...conteo.keys()].sort((x, y) => conteo.get(y)! - conteo.get(x)! || prioridad(x) - prioridad(y));
      const ordenadas = [...versiones].sort(
        (x, y) => mercados.indexOf(x.market) - mercados.indexOf(y.market) || porNivel(x, y),
      );
      return {
        slug,
        marca: versiones[0].brand,
        nombre: nombreModelo(versiones[0]),
        versiones: ordenadas,
        mercados,
        representativa: ordenadas[0],
      };
    })
    .sort((x, y) => x.nombre.localeCompare(y.nombre));
}

/** Áreas del gráfico con dato en los dos carros. */
export const areasComparables = (a: Vehiculo, b: Vehiculo) =>
  calcularEjes(a, b).filter((eje) => eje.a !== null && eje.b !== null).length;

/** Las dos versiones que se comparan en la página de un par de modelos. */
export function versionesDelPar(a: Modelo, b: Modelo): { va: Vehiculo; vb: Vehiculo; mercado: string | null } {
  const comunes = a.mercados.filter((m) => b.mercados.includes(m)).sort((x, y) => prioridad(x) - prioridad(y));
  if (comunes.length > 0) return { va: versionBase(a, comunes[0]), vb: versionBase(b, comunes[0]), mercado: comunes[0] };
  return { va: a.representativa, vb: b.representativa, mercado: null };
}

/** Comparaciones con página propia: rivales de tamaño igual o vecino, con al menos MIN_AREAS áreas comparables. */
export function generarPares(modelos: Modelo[]): Par[] {
  const pares: Par[] = [];
  for (let i = 0; i < modelos.length; i++) {
    for (let j = i + 1; j < modelos.length; j++) {
      const [a, b] = [modelos[i], modelos[j]].sort((x, y) => x.slug.localeCompare(y.slug));
      const distancia = Math.abs(
        SEGMENTOS.indexOf(a.representativa.segment as string) - SEGMENTOS.indexOf(b.representativa.segment as string),
      );
      if (distancia > 1) continue;
      const { va, vb, mercado } = versionesDelPar(a, b);
      const areas = areasComparables(va, vb);
      if (areas < MIN_AREAS) continue;
      pares.push({ slug: slugPar(a.slug, b.slug), a, b, va, vb, mercado, areas });
    }
  }
  return pares.sort((x, y) => x.slug.localeCompare(y.slug));
}

/** Los rivales más cercanos de un modelo: mismo tamaño primero, luego mismo mercado y más áreas comparables. */
export function rivales(modelo: Modelo, pares: Par[], cantidad = 6): Par[] {
  const segmento = modelo.representativa.segment;
  return pares
    .filter((par) => par.a.slug === modelo.slug || par.b.slug === modelo.slug)
    .map((par) => {
      const otro = par.a.slug === modelo.slug ? par.b : par.a;
      const puntos = (otro.representativa.segment === segmento ? 100 : 0) + (par.mercado ? 10 : 0) + par.areas;
      return { par, puntos };
    })
    .sort((x, y) => y.puntos - x.puntos || x.par.slug.localeCompare(y.par.slug))
    .slice(0, cantidad)
    .map(({ par }) => par);
}

/** El otro modelo de un par. */
export const otroDelPar = (par: Par, modelo: Modelo) => (par.a.slug === modelo.slug ? par.b : par.a);

/** "Europa y Colombia" */
export const nombresMercados = (mercados: string[]) =>
  new Intl.ListFormat('es', { type: 'conjunction' }).format(mercados.map(nombreMercado));

const CICLOS = [
  { campo: 'range_wltp_km', nombre: 'WLTP' },
  { campo: 'range_cltc_km', nombre: 'CLTC' },
  { campo: 'range_epa_km', nombre: 'EPA' },
  { campo: 'range_nedc_km', nombre: 'NEDC' },
];

/** Autonomía que se muestra primero: la de un ciclo, en este orden; en rango extendido e híbridos, la combinada. */
export function autonomiaPrincipal(v: Vehiculo): { km: number; ciclo: string; conGasolina: boolean } | null {
  for (const ciclo of CICLOS) {
    if (typeof v[ciclo.campo] === 'number') return { km: v[ciclo.campo] as number, ciclo: ciclo.nombre, conGasolina: false };
  }
  if (typeof v.combined_range_km === 'number' && typeof v.electric_range_cycle === 'string') {
    return { km: v.combined_range_km, ciclo: v.electric_range_cycle.toUpperCase(), conGasolina: true };
  }
  return null;
}

/** "SUV compacto eléctrico", a partir de la carrocería, el tamaño y las motorizaciones del modelo. */
export function tipoDeModelo(modelo: Modelo): string {
  const v = modelo.representativa;
  const carroceria = traducir('body_style', v.body_style as string);
  const tamano = v.segment === 'luxury' ? 'de lujo' : traducir('segment', v.segment as string).toLowerCase();
  const motores = [...new Set(modelo.versiones.map((x) => traducir('powertrain', x.powertrain as string).toLowerCase()))];
  return `${carroceria} ${tamano} ${new Intl.ListFormat('es', { type: 'disjunction' }).format(motores)}`;
}

/** Rango "de 42,2 a 61 kWh" (o una sola cifra) de un campo numérico entre las versiones. */
export function rango(versiones: Vehiculo[], campo: string, unidad: string): string | null {
  const valores = versiones.map((v) => v[campo]).filter((x): x is number => typeof x === 'number');
  if (valores.length === 0) return null;
  const [min, max] = [Math.min(...valores), Math.max(...valores)];
  return min === max ? `${formatearNumero(min)} ${unidad}` : `de ${formatearNumero(min)} a ${formatearNumero(max)} ${unidad}`;
}

/** Puntaje de 0 a 100 de una versión en cada área del gráfico; null si no tiene el dato. */
export const puntajesPropios = (v: Vehiculo) =>
  calcularEjes(v, v).map((eje) => ({ nombre: eje.nombre, detalle: eje.detalle, valor: eje.a }));
