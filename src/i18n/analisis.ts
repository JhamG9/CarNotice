/**
 * Frases del análisis automático de cada comparación («Lo que dicen los datos»). Las arma
 * src/lib/analisis.ts con las cifras de las dos fichas: cada frase solo sale si hay datos para ella,
 * así que el texto cambia de un par a otro porque cambian los datos. Las cifras llegan ya formateadas.
 * Mismas reglas de redacción que las notas (CLAUDE.md): cada dato con su consecuencia, sin relleno.
 */
export interface TextosAnalisis {
  titulo: string;
  nota: string;
  unidades: { litros: string; minutos: string; anios: string; segundos: string; horas: string };
  secciones: { contexto: string; autonomia: string; carga: string; potencia: string; espacio: string };
  mismaMarca: (marca: string) => string;
  mismoGrupo: (a: string, b: string, grupo: string) => string;
  mismaCategoria: (a: string, b: string, tipo: string) => string;
  mismaCategoriaCorta: (tipo: string) => string;
  distintaCategoria: (a: string, tipoA: string, b: string, tipoB: string) => string;
  rangoExtendido: (electrico: string, extendido: string) => string;
  mismoMercado: (mercado: string) => string;
  distintoMercado: (a: string, mercadoA: string, b: string, mercadoB: string) => string;
  masLargo: (x: string, largo: string, diferencia: string, y: string) => string;
  masEntreEjes: (diferencia: string) => string;
  entreEjesAlReves: (y: string, diferencia: string) => string;
  mismoLargo: (largoA: string, largoB: string) => string;
  masPesado: (x: string, diferencia: string, pesoX: string, pesoY: string) => string;
  autonomiaEmpate: (ciclo: string, a: string, kmA: string, b: string, kmB: string) => string;
  autonomiaGana: (ciclo: string, g: string, kmG: string, p: string, kmP: string, diferencia: string, porcentaje: string) => string;
  autonomiaMenosCargas: (g: string) => string;
  cicloOptimista: (ciclo: string) => string;
  eficiencia: (a: string, ea: string, b: string, eb: string) => string;
  eficienciaGana: (mejor: string) => string;
  eficienciaEmpate: string;
  autonomiaEstimada: (a: string, kmA: string, cicloA: string, b: string, kmB: string, cicloB: string, wa: string, wb: string) => string;
  estimadaCerca: string;
  estimadaGana: (g: string) => string;
  soloElectrico: (x: string, km: string) => string;
  quimica: (a: string, qa: string, b: string, qb: string) => string;
  garantiaBateria: (x: string, anios: string, y: string, aniosY: string) => string;
  sinCargaRapida: (x: string, ac: string | null) => string;
  cargaMismaVentana: (desde: string, hasta: string, a: string, ma: string, b: string, mb: string) => string;
  cargaMismoTiempo: (desde: string, hasta: string, minutos: string) => string;
  cargaEspera: (lento: string, minutos: string) => string;
  cargaIgual: string;
  cargaDistintaVentana: (a: string, fa: string, ta: string, ma: string, b: string, fb: string, tb: string, mb: string) => string;
  cargaPorMinuto: (rapido: string, ra: string, rb: string) => string;
  cargaCasa: (aca: string, acb: string, ha: string, hb: string) => string;
  cargaCasaIgual: (ac: string, h: string) => string;
  cargaCasaNoche: string;
  cargaCasaLarga: (x: string) => string;
  v2l: (x: string) => string;
  potenciaGana: (x: string, kw: string, hp: string | null, diferencia: string, y: string) => string;
  potenciaEmpate: (kwA: string, kwB: string) => string;
  potenciaIgual: (kw: string) => string;
  aceleracion: (a: string, sa: string, b: string, sb: string) => string;
  aceleracionSeNota: (diferencia: string) => string;
  aceleracionNoSeNota: string;
  traccionTotal: (x: string, dosMotores: boolean) => string;
  bauGana: (x: string, litros: string, diferencia: string, y: string) => string;
  bauEmpate: (la: string, lb: string) => string;
  frunk: (x: string, litros: string) => string;
  frunkAmbos: (la: string, lb: string) => string;
  puestos: (x: string, nx: string, y: string, ny: string) => string;
  ncap: (organismo: string, a: string, ea: string, b: string, eb: string) => string;
  estrellas: (n: number) => string;
  ncapDiferencia: string;
  ncapIgual: string;
  ncapMismas: (organismo: string, estrellas: string) => string;
  soloSeguridad: (x: string, lista: string) => string;
  seguridadAntes: string;
  seguridadIgual: string;
  soloConfort: (x: string, lista: string) => string;
  bombaDeCalor: string;
  mayorDiferencia: (fila: string, a: string, va: string, b: string, vb: string) => string;
}

export const analisisEs: TextosAnalisis = {
  titulo: 'Lo que dicen los datos',
  unidades: { litros: 'litros', minutos: 'minutos', anios: 'años', segundos: 'segundos', horas: 'horas' },
  nota: 'Análisis escrito a partir de las dos fichas que compara esta página. No tiene en cuenta el precio.',
  secciones: {
    contexto: 'Qué se compara',
    autonomia: 'Autonomía y batería',
    carga: 'Carga',
    potencia: 'Potencia y manejo',
    espacio: 'Espacio y equipamiento',
  },
  mismaMarca: (marca) =>
    `Los dos son de ${marca}, así que aquí no se elige marca: la decisión está en el tamaño, la batería y el equipo de cada uno.`,
  mismoGrupo: (a, b, grupo) =>
    `El ${a} y el ${b} se venden con marcas distintas, pero pertenecen al mismo grupo, ${grupo}: la competencia entre ellos es interna.`,
  mismaCategoria: (a, b, tipo) => `El ${a} y el ${b} compiten en la misma categoría, ${tipo}, así que la comparación es directa.`,
  mismaCategoriaCorta: (tipo) => `Los dos compiten en la misma categoría, ${tipo}, así que la comparación es directa.`,
  distintaCategoria: (a, tipoA, b, tipoB) =>
    `El ${a} es un ${tipoA} y el ${b}, un ${tipoB}. Al cruzar categorías, el tamaño y el espacio pesan más que de costumbre en la elección.`,
  rangoExtendido: (electrico, extendido) =>
    `El ${electrico} es eléctrico puro y el ${extendido} es de rango extendido: lleva un motor de gasolina que solo genera electricidad, así que en un viaje largo no depende de encontrar cargadores.`,
  mismoMercado: (mercado) =>
    `Las dos fichas son de ${mercado}: comparan versiones que se venden en el mismo lugar, con la batería y el equipo de ese mercado.`,
  distintoMercado: (a, mercadoA, b, mercadoB) =>
    `La ficha del ${a} es de ${mercadoA} y la del ${b}, de ${mercadoB}. Un mismo modelo cambia de batería y de equipo según el país, así que el equipamiento puede no ser igual donde se compre.`,
  masLargo: (x, largo, diferencia, y) => `Por fuera, el ${x} mide ${largo} de largo, ${diferencia} más que el ${y}`,
  masEntreEjes: (diferencia) =>
    `, y le saca ${diferencia} entre ejes, la medida que más influye en el espacio para las piernas atrás.`,
  entreEjesAlReves: (y, diferencia) =>
    `. Aun así, el ${y} tiene ${diferencia} más entre ejes, la medida que más influye en el espacio para las piernas atrás.`,
  mismoLargo: (largoA, largoB) => `Por fuera casi miden lo mismo: ${largoA} y ${largoB} de largo.`,
  masPesado: (x, diferencia, pesoX, pesoY) =>
    `El ${x} pesa ${diferencia} más (${pesoX} contra ${pesoY}), un peso extra que la batería tiene que mover en cada arranque.`,
  autonomiaEmpate: (ciclo, a, kmA, b, kmB) => `En ciclo ${ciclo} casi empatan: ${kmA} para el ${a} y ${kmB} para el ${b}.`,
  autonomiaGana: (ciclo, g, kmG, p, kmP, diferencia, porcentaje) =>
    `En ciclo ${ciclo}, el ${g} homologa ${kmG} y el ${p}, ${kmP}: ${diferencia} más, un ${porcentaje} % por encima.`,
  autonomiaMenosCargas: (g) => ` Con el mismo uso, el ${g} pasa menos veces por el cargador.`,
  cicloOptimista: (ciclo) =>
    ciclo === 'CLTC'
      ? ' El CLTC es el ciclo chino y da cifras altas: en uso real las dos bajan.'
      : ' El NEDC es un ciclo antiguo y optimista: en uso real las dos cifras bajan.',
  eficiencia: (a, ea, b, eb) => `Por cada kWh de batería, el ${a} recorre ${ea} y el ${b}, ${eb}`,
  eficienciaGana: (mejor) => `: el ${mejor} le saca más a cada carga, y eso también baja lo que cuesta cada kilómetro.`,
  eficienciaEmpate: ', una eficiencia casi igual.',
  autonomiaEstimada: (a, kmA, cicloA, b, kmB, cicloB, wa, wb) =>
    `No comparten ciclo de autonomía: el ${a} declara ${kmA} en ${cicloA} y el ${b}, ${kmB} en ${cicloB}. Llevadas a un equivalente WLTP estimado, quedan en unos ${wa} y ${wb}`,
  estimadaCerca: ', demasiado cerca para dar un ganador con una conversión.',
  estimadaGana: (g) => `, así que el ${g} probablemente llega más lejos.`,
  soloElectrico: (x, km) => `El ${x} anda ${km} solo con la batería antes de encender el motor de gasolina.`,
  quimica: (a, qa, b, qb) =>
    `El ${a} usa una batería ${qa} y el ${b}, una ${qb}. La LFP tolera mejor cargarse al 100 % a diario; la NMC guarda más energía con el mismo peso.`,
  garantiaBateria: (x, anios, y, aniosY) =>
    `La batería del ${x} tiene ${anios} de garantía, frente a ${aniosY} la del ${y}: es la pieza más cara del carro, así que esos años de más cuentan en la reventa.`,
  sinCargaRapida: (x, ac) =>
    `El ${x} no tiene carga rápida en corriente continua${ac ? `: carga solo en corriente alterna, a ${ac} como máximo` : ''}, así que en un viaje largo cada parada para cargar se mide en horas, no en minutos.`,
  cargaMismaVentana: (desde, hasta, a, ma, b, mb) =>
    `En carga rápida, del ${desde} al ${hasta} %, el ${a} tarda ${ma} y el ${b}, ${mb}.`,
  cargaMismoTiempo: (desde, hasta, minutos) =>
    `En carga rápida, los dos van del ${desde} al ${hasta} % en ${minutos}: en un viaje largo paran el mismo tiempo.`,
  cargaEspera: (lento, minutos) => ` En un viaje con dos paradas, son unos ${minutos} más de espera con el ${lento}.`,
  cargaIgual: ' En la práctica, paran lo mismo.',
  cargaDistintaVentana: (a, fa, ta, ma, b, fb, tb, mb) =>
    `En carga rápida, el ${a} va del ${fa} al ${ta} % en ${ma} y el ${b}, del ${fb} al ${tb} % en ${mb}.`,
  cargaPorMinuto: (rapido, ra, rb) =>
    ` Las ventanas no son iguales, pero por minuto el ${rapido} recupera más batería: ${ra} contra ${rb} puntos de carga por minuto.`,
  cargaCasa: (aca, acb, ha, hb) =>
    `En casa, con un cargador de pared al máximo que admite cada uno (${aca} y ${acb}), una carga completa toma unas ${ha} y ${hb} horas`,
  cargaCasaIgual: (ac, h) => `En casa, los dos admiten hasta ${ac} en corriente alterna, y una carga completa toma unas ${h} horas`,
  cargaCasaNoche: ': los dos se llenan en una noche.',
  cargaCasaLarga: (x) => `: el ${x} necesita más que una noche para llenarse desde cero.`,
  v2l: (x) => `Solo el ${x} tiene V2L, para sacar corriente de la batería y conectar aparatos fuera de casa.`,
  potenciaGana: (x, kw, hp, diferencia, y) => `El ${x} entrega ${kw}${hp ? ` (${hp})` : ''}, ${diferencia} más que el ${y}.`,
  potenciaEmpate: (kwA, kwB) => `La potencia es casi la misma: ${kwA} y ${kwB}.`,
  potenciaIgual: (kw) => `Los dos entregan la misma potencia, ${kw}.`,
  aceleracion: (a, sa, b, sb) => ` De 0 a 100 km/h, el ${a} tarda ${sa} y el ${b}, ${sb}`,
  aceleracionSeNota: (diferencia) => `: son ${diferencia} que se sienten al adelantar en carretera.`,
  aceleracionNoSeNota: ', una diferencia que en el día a día no se nota.',
  traccionTotal: (x, dosMotores) =>
    `Solo el ${x} tiene tracción total${dosMotores ? ', con un motor en cada eje' : ''}, que ayuda en piso mojado o destapado.`,
  bauGana: (x, litros, diferencia, y) => `El baúl del ${x} tiene ${litros}, ${diferencia} más que el del ${y}`,
  bauEmpate: (la, lb) => `En baúl casi empatan: ${la} y ${lb}`,
  frunk: (x, litros) => `; el ${x} suma ${litros} adelante, donde caben los cables de carga`,
  frunkAmbos: (la, lb) => `; los dos suman un baúl delantero, de ${la} y ${lb}, donde caben los cables de carga`,
  puestos: (x, nx, y, ny) => `El ${x} tiene ${nx} puestos y el ${y}, ${ny}.`,
  ncap: (organismo, a, ea, b, eb) => `En ${organismo}, el ${a} tiene ${ea} y el ${b}, ${eb}`,
  estrellas: (n) => (n === 1 ? '1 estrella' : `${n} estrellas`),
  ncapDiferencia: ': la diferencia sale de una prueba que mide choques y ayudas a la conducción.',
  ncapIgual: ': el mismo resultado.',
  ncapMismas: (organismo, estrellas) => `En ${organismo}, los dos tienen ${estrellas}.`,
  soloSeguridad: (x, lista) => `Entre las ayudas de seguridad conocidas, solo el ${x} trae ${lista}.`,
  seguridadAntes: ' Son sistemas que actúan antes de un choque, no después.',
  seguridadIgual: 'En ayudas de seguridad conocidas, los dos traen lo mismo.',
  soloConfort: (x, lista) => `En confort, solo el ${x} tiene ${lista}.`,
  bombaDeCalor: ' La bomba de calor hace que la autonomía caiga menos con frío.',
  mayorDiferencia: (fila, a, va, b, vb) =>
    `La mayor diferencia entre los dos, en proporción, está en ${fila}: ${va} para el ${a} y ${vb} para el ${b}.`,
};

export const analisisEn: TextosAnalisis = {
  titulo: 'What the numbers say',
  unidades: { litros: 'liters', minutos: 'minutes', anios: 'years', segundos: 'seconds', horas: 'hours' },
  nota: 'Analysis written from the two spec sheets this page compares. It does not take price into account.',
  secciones: {
    contexto: 'What is being compared',
    autonomia: 'Range and battery',
    carga: 'Charging',
    potencia: 'Power and driving',
    espacio: 'Space and equipment',
  },
  mismaMarca: (marca) =>
    `Both are ${marca} cars, so this is not a choice of brand: it comes down to size, battery and equipment.`,
  mismoGrupo: (a, b, grupo) =>
    `The ${a} and the ${b} wear different badges but belong to the same group, ${grupo}: this is an in-house rivalry.`,
  mismaCategoria: (a, b, tipo) => `The ${a} and the ${b} compete in the same class, ${tipo}, so the comparison is a direct one.`,
  mismaCategoriaCorta: (tipo) => `Both compete in the same class, ${tipo}, so the comparison is a direct one.`,
  distintaCategoria: (a, tipoA, b, tipoB) =>
    `The ${a} is a ${tipoA} and the ${b} a ${tipoB}. Across classes, size and space weigh more than usual in the choice.`,
  rangoExtendido: (electrico, extendido) =>
    `The ${electrico} is fully electric and the ${extendido} is a range extender: its gasoline engine only generates electricity, so on a long trip it does not depend on finding chargers.`,
  mismoMercado: (mercado) =>
    `Both spec sheets are from ${mercado}: they compare versions sold in the same place, with that market's battery and equipment.`,
  distintoMercado: (a, mercadoA, b, mercadoB) =>
    `The ${a} spec sheet is from ${mercadoA} and the ${b} one from ${mercadoB}. The same model changes battery and equipment from country to country, so the kit may differ where you buy.`,
  masLargo: (x, largo, diferencia, y) => `On the outside, the ${x} is ${largo} long, ${diferencia} longer than the ${y}`,
  masEntreEjes: (diferencia) =>
    `, and its wheelbase is ${diferencia} longer, the measurement that matters most for rear legroom.`,
  entreEjesAlReves: (y, diferencia) =>
    `. Even so, the ${y} has a ${diferencia} longer wheelbase, the measurement that matters most for rear legroom.`,
  mismoLargo: (largoA, largoB) => `On the outside they are almost the same length: ${largoA} and ${largoB}.`,
  masPesado: (x, diferencia, pesoX, pesoY) =>
    `The ${x} weighs ${diferencia} more (${pesoX} versus ${pesoY}), extra mass the battery has to move every time it pulls away.`,
  autonomiaEmpate: (ciclo, a, kmA, b, kmB) => `On the ${ciclo} cycle they are almost level: ${kmA} for the ${a} and ${kmB} for the ${b}.`,
  autonomiaGana: (ciclo, g, kmG, p, kmP, diferencia, porcentaje) =>
    `On the ${ciclo} cycle, the ${g} is rated at ${kmG} and the ${p} at ${kmP}: ${diferencia} more, ${porcentaje}% higher.`,
  autonomiaMenosCargas: (g) => ` With the same use, the ${g} stops at the charger less often.`,
  cicloOptimista: (ciclo) =>
    ciclo === 'CLTC'
      ? ' CLTC is the Chinese cycle and gives high figures: both drop in real use.'
      : ' NEDC is an old, optimistic cycle: both figures drop in real use.',
  eficiencia: (a, ea, b, eb) => `Per kWh of battery, the ${a} covers ${ea} and the ${b} ${eb}`,
  eficienciaGana: (mejor) => `: the ${mejor} gets more out of every charge, which also lowers the cost per mile.`,
  eficienciaEmpate: ', almost the same efficiency.',
  autonomiaEstimada: (a, kmA, cicloA, b, kmB, cicloB, wa, wb) =>
    `They do not share a range cycle: the ${a} is rated at ${kmA} on ${cicloA} and the ${b} at ${kmB} on ${cicloB}. Converted to an estimated WLTP equivalent, that is about ${wa} and ${wb}`,
  estimadaCerca: ', too close to name a winner from a conversion.',
  estimadaGana: (g) => `, so the ${g} probably goes further.`,
  soloElectrico: (x, km) => `The ${x} covers ${km} on battery alone before the gasoline engine starts.`,
  quimica: (a, qa, b, qb) =>
    `The ${a} uses an ${qa} battery and the ${b} an ${qb} one. LFP copes better with daily charges to 100%; NMC stores more energy for the same weight.`,
  garantiaBateria: (x, anios, y, aniosY) =>
    `The ${x} battery is covered for ${anios}, against ${aniosY} for the ${y}: it is the most expensive part of the car, so the extra years count at resale.`,
  sinCargaRapida: (x, ac) =>
    `The ${x} has no DC fast charging${ac ? `: it only charges on AC, at up to ${ac}` : ''}, so on a long trip each charging stop takes hours, not minutes.`,
  cargaMismaVentana: (desde, hasta, a, ma, b, mb) =>
    `On a fast charger, from ${desde} to ${hasta}%, the ${a} takes ${ma} and the ${b} ${mb}.`,
  cargaMismoTiempo: (desde, hasta, minutos) =>
    `On a fast charger, both go from ${desde} to ${hasta}% in ${minutos}: on a long trip they stop for the same time.`,
  cargaEspera: (lento, minutos) => ` On a trip with two stops, that is about ${minutos} more waiting in the ${lento}.`,
  cargaIgual: ' In practice, they stop for the same time.',
  cargaDistintaVentana: (a, fa, ta, ma, b, fb, tb, mb) =>
    `On a fast charger, the ${a} goes from ${fa} to ${ta}% in ${ma} and the ${b} from ${fb} to ${tb}% in ${mb}.`,
  cargaPorMinuto: (rapido, ra, rb) =>
    ` The windows differ, but per minute the ${rapido} adds more charge: ${ra} against ${rb} percentage points per minute.`,
  cargaCasa: (aca, acb, ha, hb) =>
    `At home, on a wall box at the maximum each one accepts (${aca} and ${acb}), a full charge takes about ${ha} and ${hb} hours`,
  cargaCasaIgual: (ac, h) => `At home, both accept up to ${ac} on AC, and a full charge takes about ${h} hours`,
  cargaCasaNoche: ': both fill up overnight.',
  cargaCasaLarga: (x) => `: the ${x} needs more than one night to fill up from empty.`,
  v2l: (x) => `Only the ${x} has V2L, to draw power from the battery and plug in appliances away from home.`,
  potenciaGana: (x, kw, hp, diferencia, y) => `The ${x} delivers ${kw}${hp ? ` (${hp})` : ''}, ${diferencia} more than the ${y}.`,
  potenciaEmpate: (kwA, kwB) => `Power is almost the same: ${kwA} and ${kwB}.`,
  potenciaIgual: (kw) => `Both deliver the same power, ${kw}.`,
  aceleracion: (a, sa, b, sb) => ` From 0 to 100 km/h (62 mph), the ${a} takes ${sa} and the ${b} ${sb}`,
  aceleracionSeNota: (diferencia) => `: ${diferencia} you feel when overtaking on the highway.`,
  aceleracionNoSeNota: ', a gap you will not notice in daily driving.',
  traccionTotal: (x, dosMotores) =>
    `Only the ${x} has all-wheel drive${dosMotores ? ', with a motor on each axle' : ''}, which helps on wet or unpaved roads.`,
  bauGana: (x, litros, diferencia, y) => `The ${x} trunk holds ${litros}, ${diferencia} more than the ${y}`,
  bauEmpate: (la, lb) => `Trunk space is almost level: ${la} and ${lb}`,
  frunk: (x, litros) => `; the ${x} adds ${litros} up front, where the charging cables fit`,
  frunkAmbos: (la, lb) => `; both add a front trunk, of ${la} and ${lb}, where the charging cables fit`,
  puestos: (x, nx, y, ny) => `The ${x} has ${nx} seats and the ${y} ${ny}.`,
  ncap: (organismo, a, ea, b, eb) => `In ${organismo}, the ${a} has ${ea} and the ${b} ${eb}`,
  estrellas: (n) => (n === 1 ? '1 star' : `${n} stars`),
  ncapDiferencia: ': the gap comes from a test that scores both crashes and driver assistance.',
  ncapIgual: ': the same result.',
  ncapMismas: (organismo, estrellas) => `In ${organismo}, both have ${estrellas}.`,
  soloSeguridad: (x, lista) => `Among the known safety aids, only the ${x} has ${lista}.`,
  seguridadAntes: ' These systems act before a crash, not after.',
  seguridadIgual: 'On known safety aids, both come with the same.',
  soloConfort: (x, lista) => `For comfort, only the ${x} has ${lista}.`,
  bombaDeCalor: ' The heat pump makes range drop less in the cold.',
  mayorDiferencia: (fila, a, va, b, vb) =>
    `The biggest gap between them, in proportion, is in ${fila}: ${va} for the ${a} and ${vb} for the ${b}.`,
};
