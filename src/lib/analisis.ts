import { LOCALE, textos, type Idioma } from '../i18n';
import type { Modelo } from './catalogo';
import { tipoDeModelo } from './catalogo';
import {
  autonomiaEnCiclo,
  comparacionAutonomia,
  conMillas,
  enumerar,
  formatearNumero,
  mayoresDiferencias,
  nombreMercado,
  formatearValor,
  traducir,
  type Vehiculo,
} from './vehiculos';

/**
 * Análisis escrito de una comparación («Lo que dicen los datos»), armado con las cifras de las dos
 * fichas. Cada frase solo aparece si los dos carros tienen el dato y la diferencia dice algo; por eso
 * el texto cambia de un par a otro según los datos, no al azar. Las frases están en src/i18n/analisis.ts.
 * Solo usa datos de la tabla vehicles: nada de precios ni de fuera de la ficha.
 */

export interface SeccionAnalisis {
  titulo: string;
  parrafos: string[];
}

/** Grupos dueños de varias marcas del comparador. Solo marcas cuya relación es pública y conocida. */
const GRUPOS: Record<string, string> = {
  Hyundai: 'Hyundai Motor Group',
  Kia: 'Hyundai Motor Group',
  Geely: 'Geely Holding',
  Zeekr: 'Geely Holding',
  Volvo: 'Geely Holding',
  Polestar: 'Geely Holding',
};

const SEGURIDAD = ['autonomous_emergency_braking', 'adaptive_cruise_control', 'lane_keeping_assist', 'blind_spot_monitor', 'camera_360', 'isofix'];
/** Ayudas que actúan antes de un choque (para la frase que lo explica). */
const PREVENTIVAS = ['autonomous_emergency_braking', 'adaptive_cruise_control', 'lane_keeping_assist', 'blind_spot_monitor'];
const CONFORT = ['apple_carplay', 'android_auto', 'panoramic_roof', 'ventilated_seats', 'heated_seats', 'wireless_charger', 'heat_pump'];

const numero = (v: Vehiculo, campo: string) => (typeof v[campo] === 'number' ? (v[campo] as number) : null);
/** Diferencia relativa entre dos cifras positivas, sobre la mayor. */
const relativa = (x: number, y: number) => Math.abs(x - y) / Math.max(x, y);

export function analizarPar(
  a: Modelo,
  b: Modelo,
  va: Vehiculo,
  vb: Vehiculo,
  idioma: Idioma,
): { secciones: SeccionAnalisis[]; cierre: string | null } {
  const { analisis: t, filasFicha } = textos(idioma);
  const u = t.unidades;
  const n = (valor: number, decimales = 0) => formatearNumero(Number(valor.toFixed(decimales)), idioma);
  const km = (valor: number) => conMillas(Math.round(valor), idioma);
  const cm = (mm: number) => `${n(mm / 10)} cm`;
  const dosDecimales = new Intl.NumberFormat(LOCALE[idioma], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const unDecimal = new Intl.NumberFormat(LOCALE[idioma], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const metros = (mm: number) => `${dosDecimales.format(mm / 1000)} m`;
  /** Rendimiento con un decimal: "6,4 km" o "6.4 km (4.0 mi)". */
  const kmPorKwh = (x: number) =>
    idioma === 'es' ? `${unDecimal.format(x)} km` : `${unDecimal.format(x)} km (${unDecimal.format(x * 0.621371)} mi)`;
  const nombre = { a: a.nombre, b: b.nombre };
  const otro = (lado: 'a' | 'b') => (lado === 'a' ? 'b' : 'a');
  const v = { a: va, b: vb };
  /** Nombre de un equipamiento en minúscula dentro de una frase ("frenado autónomo…"), salvo siglas y marcas. */
  const equipo = (campo: string) => minuscula((filasFicha as Record<string, string>)[campo] ?? campo);
  const minuscula = (etiqueta: string) => /^[A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(etiqueta) && !/^(Apple|Android)\b/.test(etiqueta)
      ? etiqueta.charAt(0).toLowerCase() + etiqueta.slice(1)
      : etiqueta;

  // --- Qué se compara
  const contexto: string[] = [];
  if (va.brand === vb.brand) contexto.push(t.mismaMarca(va.brand));
  else if (GRUPOS[va.brand] && GRUPOS[va.brand] === GRUPOS[vb.brand]) contexto.push(t.mismoGrupo(nombre.a, nombre.b, GRUPOS[va.brand]));
  const tipoA = minuscula(tipoDeModelo({ ...a, representativa: va, versiones: [va] }, idioma));
  const tipoB = minuscula(tipoDeModelo({ ...b, representativa: vb, versiones: [vb] }, idioma));
  contexto.push(
    tipoA === tipoB
      ? contexto.length > 0
        ? t.mismaCategoriaCorta(tipoA)
        : t.mismaCategoria(nombre.a, nombre.b, tipoA)
      : t.distintaCategoria(nombre.a, tipoA, nombre.b, tipoB),
  );
  if (va.powertrain !== vb.powertrain) {
    const extendido = va.powertrain === 'range_extender' ? 'a' : vb.powertrain === 'range_extender' ? 'b' : null;
    if (extendido && v[otro(extendido)].powertrain === 'electric') contexto.push(t.rangoExtendido(nombre[otro(extendido)], nombre[extendido]));
  }
  contexto.push(
    va.market === vb.market
      ? t.mismoMercado(nombreMercado(va.market, idioma))
      : t.distintoMercado(nombre.a, nombreMercado(va.market, idioma), nombre.b, nombreMercado(vb.market, idioma)),
  );
  const medidas: string[] = [];
  const [la, lb] = [numero(va, 'length_mm'), numero(vb, 'length_mm')];
  if (la !== null && lb !== null) {
    if (Math.abs(la - lb) >= 50) {
      const largo: 'a' | 'b' = la > lb ? 'a' : 'b';
      let frase = t.masLargo(nombre[largo], metros(Math.max(la, lb)), cm(Math.abs(la - lb)), nombre[otro(largo)]);
      const [ea, eb] = [numero(va, 'wheelbase_mm'), numero(vb, 'wheelbase_mm')];
      const ejeMayor: 'a' | 'b' | null = ea !== null && eb !== null && Math.abs(ea - eb) >= 30 ? (ea > eb ? 'a' : 'b') : null;
      if (ejeMayor === largo) frase += t.masEntreEjes(cm(Math.abs(ea! - eb!)));
      else if (ejeMayor) frase += t.entreEjesAlReves(nombre[ejeMayor], cm(Math.abs(ea! - eb!)));
      else frase += '.';
      medidas.push(frase);
    } else medidas.push(t.mismoLargo(metros(la), metros(lb)));
  }
  const [pa, pb] = [numero(va, 'curb_weight_kg'), numero(vb, 'curb_weight_kg')];
  if (pa !== null && pb !== null && Math.abs(pa - pb) >= 150) {
    const pesado: 'a' | 'b' = pa > pb ? 'a' : 'b';
    medidas.push(t.masPesado(nombre[pesado], `${n(Math.abs(pa - pb))} kg`, `${n(Math.max(pa, pb))} kg`, `${n(Math.min(pa, pb))} kg`));
  }

  // --- Autonomía y batería
  const autonomia: string[] = [];
  const comparacion = comparacionAutonomia(va, vb);
  if (comparacion?.tipo === 'comun') {
    const ciclo = comparacion.ciclo;
    const [ka, kb] = [autonomiaEnCiclo(va, ciclo)!, autonomiaEnCiclo(vb, ciclo)!];
    let frase: string;
    if (relativa(ka, kb) < 0.05) frase = t.autonomiaEmpate(ciclo.nombre, nombre.a, km(ka), nombre.b, km(kb));
    else {
      const g: 'a' | 'b' = ka > kb ? 'a' : 'b';
      const [kg, kp] = g === 'a' ? [ka, kb] : [kb, ka];
      frase = t.autonomiaGana(ciclo.nombre, nombre[g], km(kg), nombre[otro(g)], km(kp), km(kg - kp), n(((kg - kp) / kp) * 100));
      if ((kg - kp) / kp >= 0.2) frase += t.autonomiaMenosCargas(nombre[g]);
    }
    if (ciclo.nombre === 'CLTC' || ciclo.nombre === 'NEDC') frase += t.cicloOptimista(ciclo.nombre);
    autonomia.push(frase);
    // Rendimiento por kWh: solo entre eléctricos puros, con la misma cifra de ciclo
    const [ba, bb] = [numero(va, 'battery_kwh'), numero(vb, 'battery_kwh')];
    if (ba && bb && va.powertrain === 'electric' && vb.powertrain === 'electric') {
      const [ea, eb] = [ka / ba, kb / bb];
      const mejor: 'a' | 'b' = ea > eb ? 'a' : 'b';
      autonomia.push(
        t.eficiencia(nombre.a, kmPorKwh(ea), nombre.b, kmPorKwh(eb)) +
          (relativa(ea, eb) >= 0.08 ? t.eficienciaGana(nombre[mejor]) : t.eficienciaEmpate),
      );
    }
  } else if (comparacion?.tipo === 'estimada') {
    const { ea, eb } = comparacion;
    const g: 'a' | 'b' = ea.wltp > eb.wltp ? 'a' : 'b';
    autonomia.push(
      t.autonomiaEstimada(nombre.a, km(ea.km), ea.ciclo.nombre, nombre.b, km(eb.km), eb.ciclo.nombre, km(ea.wltp), km(eb.wltp)) +
        (relativa(ea.wltp, eb.wltp) < 0.1 ? t.estimadaCerca : t.estimadaGana(nombre[g])),
    );
  }
  for (const lado of ['a', 'b'] as const) {
    const electrica = numero(v[lado], 'electric_range_km');
    if (v[lado].powertrain === 'range_extender' && electrica) autonomia.push(t.soloElectrico(nombre[lado], km(electrica)));
  }
  const [qa, qb] = [va.battery_chemistry, vb.battery_chemistry];
  if ((qa === 'LFP' && qb === 'NMC') || (qa === 'NMC' && qb === 'LFP')) autonomia.push(t.quimica(nombre.a, qa, nombre.b, qb));
  const [ga, gb] = [numero(va, 'battery_warranty_years'), numero(vb, 'battery_warranty_years')];
  if (ga !== null && gb !== null && ga !== gb && !va.battery_warranty_unlimited && !vb.battery_warranty_unlimited) {
    const mas: 'a' | 'b' = ga > gb ? 'a' : 'b';
    autonomia.push(t.garantiaBateria(nombre[mas], `${n(Math.max(ga, gb))} ${u.anios}`, nombre[otro(mas)], `${n(Math.min(ga, gb))} ${u.anios}`));
  }

  // --- Carga
  const carga: string[] = [];
  const sinDc = (['a', 'b'] as const).filter((lado) => v[lado].dc_charging === false);
  for (const lado of sinDc) {
    const ac = numero(v[lado], 'ac_charge_kw');
    carga.push(t.sinCargaRapida(nombre[lado], ac ? `${n(ac, 1)} kW` : null));
  }
  const ventana = (x: Vehiculo) => {
    const [desde, hasta, minutos] = [numero(x, 'dc_charge_from_pct'), numero(x, 'dc_charge_to_pct'), numero(x, 'dc_charge_min')];
    return desde !== null && hasta !== null && minutos ? { desde, hasta, minutos } : null;
  };
  const [wa, wb] = [ventana(va), ventana(vb)];
  if (sinDc.length === 0 && wa && wb) {
    const min = (m: number) => `${n(m)} ${u.minutos}`;
    if (wa.desde === wb.desde && wa.hasta === wb.hasta) {
      const dif = Math.abs(wa.minutos - wb.minutos);
      const lento: 'a' | 'b' = wa.minutos > wb.minutos ? 'a' : 'b';
      carga.push(
        dif === 0
          ? t.cargaMismoTiempo(n(wa.desde), n(wa.hasta), min(wa.minutos))
          : t.cargaMismaVentana(n(wa.desde), n(wa.hasta), nombre.a, min(wa.minutos), nombre.b, min(wb.minutos)) +
          (dif >= 5 ? t.cargaEspera(nombre[lento], min(dif * 2)) : dif <= 2 ? t.cargaIgual : ''),
      );
    } else {
      const [ra, rb] = [(wa.hasta - wa.desde) / wa.minutos, (wb.hasta - wb.desde) / wb.minutos];
      let frase = t.cargaDistintaVentana(nombre.a, n(wa.desde), n(wa.hasta), min(wa.minutos), nombre.b, n(wb.desde), n(wb.hasta), min(wb.minutos));
      if (relativa(ra, rb) >= 0.1) frase += t.cargaPorMinuto(nombre[ra > rb ? 'a' : 'b'], n(Math.max(ra, rb), 1), n(Math.min(ra, rb), 1));
      carga.push(frase);
    }
  }
  const [aca, acb] = [numero(va, 'ac_charge_kw'), numero(vb, 'ac_charge_kw')];
  const [bta, btb] = [numero(va, 'battery_kwh'), numero(vb, 'battery_kwh')];
  if (aca && acb && bta && btb) {
    const [ha, hb] = [bta / aca, btb / acb];
    const largo: 'a' | 'b' = ha > hb ? 'a' : 'b';
    carga.push(
      (aca === acb && Math.round(ha) === Math.round(hb)
        ? t.cargaCasaIgual(`${n(aca, 1)} kW`, n(ha))
        : t.cargaCasa(`${n(aca, 1)} kW`, `${n(acb, 1)} kW`, n(ha), n(hb))) +
        (Math.max(ha, hb) > 10 ? t.cargaCasaLarga(nombre[largo]) : t.cargaCasaNoche),
    );
  }
  if (va.v2l === true && vb.v2l === false) carga.push(t.v2l(nombre.a));
  if (vb.v2l === true && va.v2l === false) carga.push(t.v2l(nombre.b));

  // --- Potencia y manejo
  const potencia: string[] = [];
  const [kwa, kwb] = [numero(va, 'power_kw'), numero(vb, 'power_kw')];
  let fraseP = '';
  if (kwa !== null && kwb !== null) {
    if (relativa(kwa, kwb) >= 0.1) {
      const fuerte: 'a' | 'b' = kwa > kwb ? 'a' : 'b';
      const hp = numero(v[fuerte], 'power_hp');
      fraseP = t.potenciaGana(nombre[fuerte], `${n(Math.max(kwa, kwb))} kW`, hp ? `${n(hp)} hp` : null, `${n(Math.abs(kwa - kwb))} kW`, nombre[otro(fuerte)]);
    } else fraseP = kwa === kwb ? t.potenciaIgual(`${n(kwa)} kW`) : t.potenciaEmpate(`${n(kwa)} kW`, `${n(kwb)} kW`);
  }
  const [sa, sb] = [numero(va, 'acceleration_0_100_s'), numero(vb, 'acceleration_0_100_s')];
  if (sa !== null && sb !== null) {
    const dif = Math.abs(sa - sb);
    fraseP +=
      t.aceleracion(nombre.a, `${n(sa, 1)} s`, nombre.b, `${n(sb, 1)} s`) +
      (dif >= 2 ? t.aceleracionSeNota(`${n(dif, 1)} ${u.segundos}`) : dif < 1 ? t.aceleracionNoSeNota : '.');
  }
  if (fraseP) potencia.push(fraseP.trim());
  const awd = (['a', 'b'] as const).filter((lado) => v[lado].drivetrain === 'awd');
  if (awd.length === 1 && v[otro(awd[0])].drivetrain) {
    potencia.push(t.traccionTotal(nombre[awd[0]], Number(v[awd[0]].motor_count) >= 2));
  }

  // --- Espacio y equipamiento
  const espacio: string[] = [];
  const [ta, tb] = [numero(va, 'trunk_l'), numero(vb, 'trunk_l')];
  if (ta !== null && tb !== null) {
    const l = (x: number) => `${n(x)} ${u.litros}`;
    let frase: string;
    if (relativa(ta, tb) >= 0.1) {
      const grande: 'a' | 'b' = ta > tb ? 'a' : 'b';
      frase = t.bauGana(nombre[grande], l(Math.max(ta, tb)), l(Math.abs(ta - tb)), nombre[otro(grande)]);
    } else frase = t.bauEmpate(l(ta), l(tb));
    const [fa, fb] = [numero(va, 'front_trunk_l'), numero(vb, 'front_trunk_l')];
    const conFrunk = (x: number | null) => x !== null && x >= 20;
    if (conFrunk(fa) && conFrunk(fb)) frase += t.frunkAmbos(l(fa!), l(fb!));
    else if (conFrunk(fa)) frase += t.frunk(nombre.a, l(fa!));
    else if (conFrunk(fb)) frase += t.frunk(nombre.b, l(fb!));
    espacio.push(`${frase}.`);
  }
  const [sea, seb] = [numero(va, 'seats'), numero(vb, 'seats')];
  if (sea !== null && seb !== null && sea !== seb) espacio.push(t.puestos(nombre.a, n(sea), nombre.b, n(seb)));
  const [ea, eb] = [numero(va, 'ncap_stars'), numero(vb, 'ncap_stars')];
  if (ea !== null && eb !== null && va.ncap_body && va.ncap_body === vb.ncap_body) {
    const organismo = traducir('ncap_body', String(va.ncap_body), idioma);
    espacio.push(
      ea === eb
        ? t.ncapMismas(organismo, t.estrellas(ea))
        : t.ncap(organismo, nombre.a, t.estrellas(ea), nombre.b, t.estrellas(eb)) + t.ncapDiferencia,
    );
  }
  const solo = (campos: string[], lado: 'a' | 'b') =>
    campos.filter((campo) => v[lado][campo] === true && v[otro(lado)][campo] === false);
  const conocidos = (campos: string[]) => campos.filter((c) => typeof va[c] === 'boolean' && typeof vb[c] === 'boolean');
  let seguridadDistinta = false;
  for (const lado of ['a', 'b'] as const) {
    const lista = solo(SEGURIDAD, lado);
    if (lista.length === 0) continue;
    seguridadDistinta = true;
    espacio.push(
      t.soloSeguridad(nombre[lado], enumerar(lista.map(equipo), idioma)) +
        (lista.some((c) => PREVENTIVAS.includes(c)) ? t.seguridadAntes : ''),
    );
  }
  if (!seguridadDistinta && conocidos(SEGURIDAD).length >= 4) espacio.push(t.seguridadIgual);
  for (const lado of ['a', 'b'] as const) {
    const lista = solo(CONFORT, lado);
    if (lista.length === 0) continue;
    espacio.push(t.soloConfort(nombre[lado], enumerar(lista.map(equipo), idioma)) + (lista.includes('heat_pump') ? t.bombaDeCalor : ''));
  }
  // Cierre: la diferencia más grande, en proporción, con las cifras de cada uno
  let cierre: string | null = null;
  const [mayor] = mayoresDiferencias(va, vb, idioma, 1);
  if (mayor) {
    const valorA = formatearValor(mayor.fila, va[mayor.fila.campo], idioma);
    const valorB = formatearValor(mayor.fila, vb[mayor.fila.campo], idioma);
    if (valorA && valorB) cierre = t.mayorDiferencia(equipo(mayor.fila.campo), nombre.a, valorA, nombre.b, valorB);
  }

  const secciones = [
    { titulo: t.secciones.contexto, parrafos: [contexto.join(' '), medidas.join(' ')] },
    { titulo: t.secciones.autonomia, parrafos: [autonomia.join(' ')] },
    { titulo: t.secciones.carga, parrafos: [carga.join(' ')] },
    { titulo: t.secciones.potencia, parrafos: [potencia.join(' ')] },
    { titulo: t.secciones.espacio, parrafos: [espacio.join(' ')] },
  ]
    .map((s) => ({ ...s, parrafos: s.parrafos.filter((p) => p.trim()) }))
    .filter((s) => s.parrafos.length > 0);
  return { secciones, cierre };
}
