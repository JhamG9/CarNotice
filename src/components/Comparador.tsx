import { useEffect, useRef, useState } from 'react';
import BuscadorCarro from './BuscadorCarro';
import GraficoRadar from './GraficoRadar';
import {
  CAMPOS_POR_AREA,
  SECCIONES,
  buscarFila,
  calcularEjes,
  calcularVeredicto,
  enumerar,
  formatearValor,
  ganador,
  mayoresDiferencias,
  nombreCompleto,
  nombreMercado,
  nombreModelo,
  obtenerVehiculos,
  textoOtroNombre,
  type Fila,
  type Vehiculo,
  type Veredicto,
} from '../lib/vehiculos';

type Estado = 'cargando' | 'listo' | 'error';
type Lado = 'a' | 'b';

const COLOR: Record<Lado, string> = { a: 'var(--chart-a)', b: 'var(--chart-b)' };

function leerParametro(nombre: string): string | null {
  return new URLSearchParams(window.location.search).get(nombre);
}

/** Puntaje general en un anillo, del color del carro. */
function Anillo({ valor, lado, tamano = 56 }: { valor: number | null; lado: Lado; tamano?: number }) {
  const radio = tamano / 2 - 4;
  const circunferencia = 2 * Math.PI * radio;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} aria-hidden="true" className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke="var(--border)" strokeWidth="4" />
        {valor !== null && (
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke={COLOR[lado]}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(valor / 100) * circunferencia} ${circunferencia}`}
          />
        )}
      </svg>
      <span className="absolute font-titular text-[17px] font-bold text-heading tabular-nums">
        {valor === null ? '–' : valor}
      </span>
    </span>
  );
}

function TarjetaVehiculo({ vehiculo, lado, puntaje }: { vehiculo: Vehiculo; lado: Lado; puntaje: number | null }) {
  return (
    <div className="min-w-0">
      {vehiculo.image_url ? (
        <figure>
          <img
            src={vehiculo.image_url}
            alt={`Foto de referencia: ${nombreModelo(vehiculo)}`}
            width="1600"
            height="900"
            loading="eager"
            className="aspect-video w-full rounded-lg bg-tint object-cover"
          />
          {vehiculo.image_credit && (
            <figcaption className="t-meta mt-1 text-muted">
              Foto de referencia:{' '}
              {vehiculo.image_source_url ? (
                <a href={vehiculo.image_source_url} target="_blank" rel="noopener" className="underline hover:text-accent">
                  {vehiculo.image_credit}
                </a>
              ) : (
                vehiculo.image_credit
              )}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="aspect-video w-full rounded-lg border border-border bg-tint" />
      )}
      <div className="mt-3 flex items-start gap-3 border-t-[3px] pt-3" style={{ borderColor: COLOR[lado] }}>
        <div className="min-w-0 flex-1">
          <h2 className="t-lateral">{nombreModelo(vehiculo)}</h2>
          {vehiculo.latam_name && <p className="mt-1 text-[15px] font-bold text-heading">{textoOtroNombre(vehiculo)}</p>}
          <p className="mt-1 text-[15px] text-muted">
            {vehiculo.version} · {vehiculo.model_year} · Ficha de {nombreMercado(vehiculo.market)}
          </p>
          {vehiculo.article_slug && (
            <a
              href={`/es/notas/${vehiculo.article_slug}/`}
              className="mt-1 inline-flex min-h-11 items-center text-[15px] font-bold text-accent hover:underline"
            >
              Leer la nota
            </a>
          )}
        </div>
        <span className="flex flex-col items-center">
          <Anillo valor={puntaje} lado={lado} />
          <span className="t-meta mt-1 text-muted">Puntaje</span>
        </span>
      </div>
    </div>
  );
}

function Celda({ fila, vehiculo, otro, lado, gana }: { fila: Fila; vehiculo: Vehiculo; otro: Vehiculo; lado: Lado; gana: boolean }) {
  const valor = vehiculo[fila.campo];
  const texto = formatearValor(fila, valor);
  const valorOtro = otro[fila.campo];
  // La barra solo aparece en filas con ganador posible y con los dos datos
  const conBarra = Boolean(fila.mejor) && typeof valor === 'number' && typeof valorOtro === 'number';
  const ancho = conBarra ? Math.max(4, ((valor as number) / Math.max(valor as number, valorOtro as number)) * 100) : 0;

  return (
    <div className="min-w-0">
      {texto === null ? (
        <span className="text-[15px] text-muted">Sin dato</span>
      ) : (
        <span className="flex flex-wrap items-center gap-x-2 text-[17px] leading-6">
          {/* En los sí o no, un punto del color del carro cuando lo tiene */}
          {valor === true && <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: COLOR[lado] }} aria-hidden="true" />}
          <span className={gana ? 'font-bold text-heading' : ''}>{texto}</span>
          {gana && (
            <span className="t-meta inline-flex items-center gap-1 text-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 6.5l2.5 2.5L10 3.5" />
              </svg>
              Mejor
            </span>
          )}
        </span>
      )}
      {conBarra && (
        <span className="mt-1.5 block h-1.5 w-full rounded-full bg-border" aria-hidden="true">
          <span className="block h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: COLOR[lado] }} />
        </span>
      )}
    </div>
  );
}

/** Fila de tabla con los dos valores y el ganador marcado. */
function FilaComparada({ fila, a, b }: { fila: Fila; a: Vehiculo; b: Vehiculo }) {
  const quien = ganador(fila, a, b);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-border py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-8">
      <dt className="col-span-2 text-[15px] text-muted md:col-span-1 md:text-[17px] md:leading-6 md:text-ink">{fila.etiqueta}</dt>
      <dd>
        <span className="sr-only">{nombreCompleto(a)}: </span>
        <Celda fila={fila} vehiculo={a} otro={b} lado="a" gana={quien === 'a'} />
      </dd>
      <dd>
        <span className="sr-only">{nombreCompleto(b)}: </span>
        <Celda fila={fila} vehiculo={b} otro={a} lado="b" gana={quien === 'b'} />
      </dd>
    </div>
  );
}

function BloqueVeredicto({ veredicto, a, b }: { veredicto: Veredicto; a: Vehiculo; b: Vehiculo }) {
  const ganadorV = veredicto.ganador === 'a' ? a : veredicto.ganador === 'b' ? b : null;
  const areasGanadas = veredicto.ganador === 'a' ? veredicto.motivosA.length : veredicto.motivosB.length;
  const lados = [
    { lado: 'a' as Lado, vehiculo: a, motivos: veredicto.motivosA },
    { lado: 'b' as Lado, vehiculo: b, motivos: veredicto.motivosB },
  ];

  return (
    <div className="mt-10 border border-border bg-surface p-5 md:p-8">
      <p className="t-meta tracking-[1.5px] text-muted uppercase">El veredicto</p>
      <p className="mt-3 font-titular text-[24px] leading-[30px] font-bold text-heading md:text-[28px] md:leading-[34px]">
        {ganadorV ? (
          <>
            Tu elección: <span className="text-accent">{nombreCompleto(ganadorV)}</span>
            {veredicto.margen === 'por poco' ? ', por poco' : ''}. Va por delante en {areasGanadas} de{' '}
            {veredicto.ejesComparados} áreas.
          </>
        ) : (
          <>
            Están parejos: {nombreModelo(a)} va por delante en {veredicto.motivosA.length} y {nombreModelo(b)} en{' '}
            {veredicto.motivosB.length} de {veredicto.ejesComparados} áreas.
          </>
        )}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        {lados.map(({ lado, vehiculo, motivos }) => (
          <div key={lado} className="border-t-[3px] pt-4" style={{ borderColor: COLOR[lado] }}>
            <p className="text-[17px] leading-6 font-bold text-heading">{nombreCompleto(vehiculo)}</p>
            <p className="mt-2 text-[17px] leading-6">
              {motivos.length > 0
                ? `Elígelo si lo que más te importa es ${enumerar(motivos)}.`
                : 'No supera al otro en ninguna área medida.'}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[14px] leading-5 text-muted">
        El puntaje y el veredicto salen del promedio de las {veredicto.ejesComparados} áreas con dato en los dos carros.
        No tienen en cuenta el precio, que suele ser lo que más pesa al decidir.
        {veredicto.ejesSinDato.length > 0 &&
          ` Quedaron por fuera, por falta de datos: ${enumerar(veredicto.ejesSinDato.map((nombre) => nombre.toLowerCase()))}.`}
      </p>
    </div>
  );
}

function MayoresDiferencias({ a, b }: { a: Vehiculo; b: Vehiculo }) {
  const lista = mayoresDiferencias(a, b);
  if (lista.length === 0) return null;
  return (
    <section aria-labelledby="titulo-diferencias" className="mt-14">
      <h2 id="titulo-diferencias" className="t-seccion barra-corta">Mayores diferencias</h2>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="t-meta px-4 py-3 font-bold tracking-[1px] text-muted uppercase">Dato</th>
              <th scope="col" className="t-meta px-4 py-3 font-bold tracking-[1px] text-heading uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full" style={{ backgroundColor: COLOR.a }} aria-hidden="true" />
                  {nombreModelo(a)}
                </span>
              </th>
              <th scope="col" className="t-meta px-4 py-3 font-bold tracking-[1px] text-heading uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full" style={{ backgroundColor: COLOR.b }} aria-hidden="true" />
                  {nombreModelo(b)}
                </span>
              </th>
              <th scope="col" className="t-meta px-4 py-3 text-right font-bold tracking-[1px] text-muted uppercase">Ventaja</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(({ fila, ganador: quien, ventaja }) => (
              <tr key={fila.campo} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 font-normal text-muted">{fila.etiqueta}</th>
                <td className={`px-4 py-3 tabular-nums ${quien === 'a' ? 'font-bold text-heading' : ''}`}>{formatearValor(fila, a[fila.campo])}</td>
                <td className={`px-4 py-3 tabular-nums ${quien === 'b' ? 'font-bold text-heading' : ''}`}>{formatearValor(fila, b[fila.campo])}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap tabular-nums"
                    style={{ borderColor: COLOR[quien], color: 'var(--ink)' }}
                  >
                    <span className="inline-block size-2 rounded-full" style={{ backgroundColor: COLOR[quien] }} aria-hidden="true" />
                    {ventaja}
                    <span className="sr-only"> a favor de {nombreModelo(quien === 'a' ? a : b)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[14px] leading-5 text-muted">
        Los datos donde un carro le saca más ventaja al otro, en proporción. La etiqueta lleva el color del carro que gana.
      </p>
    </section>
  );
}

/** Detalle del área elegida en el gráfico: sus filas de la ficha. */
function DetalleArea({ area, a, b, alCerrar }: { area: string; a: Vehiculo; b: Vehiculo; alCerrar: () => void }) {
  const filas = (CAMPOS_POR_AREA[area] ?? [])
    .map(buscarFila)
    .filter((fila): fila is Fila => Boolean(fila) && (a[fila!.campo] != null || b[fila!.campo] != null));
  return (
    <div className="mt-6 rounded-lg border border-accent bg-surface p-5 md:p-6" role="region" aria-label={`Detalle de ${area}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="t-lateral barra-corta">{area}</h3>
        <button
          type="button"
          onClick={alCerrar}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-[15px] hover:border-accent hover:text-accent"
        >
          Cerrar
        </button>
      </div>
      {filas.length === 0 ? (
        <p className="mt-4 text-[17px] text-muted">Ninguno de los dos carros tiene datos en esta área.</p>
      ) : (
        <dl className="mt-2">
          {filas.map((fila) => (
            <FilaComparada key={fila.campo} fila={fila} a={a} b={b} />
          ))}
        </dl>
      )}
    </div>
  );
}

export default function Comparador() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [slugA, setSlugA] = useState('');
  const [slugB, setSlugB] = useState('');
  const [area, setArea] = useState<number | null>(null);
  const buscadores = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obtenerVehiculos()
      .then((lista) => {
        setVehiculos(lista);
        const existe = (slug: string | null) => (slug && lista.some((v) => v.slug === slug) ? slug : null);
        const a = existe(leerParametro('a')) ?? lista[0]?.slug ?? '';
        const b = existe(leerParametro('b')) ?? lista.find((v) => v.slug !== a)?.slug ?? a;
        setSlugA(a);
        setSlugB(b);
        setEstado('listo');
      })
      .catch(() => setEstado('error'));
  }, []);

  // La comparación elegida queda en la dirección, para poder compartirla
  useEffect(() => {
    if (estado !== 'listo' || !slugA || !slugB) return;
    const parametros = new URLSearchParams({ a: slugA, b: slugB });
    window.history.replaceState(null, '', `${window.location.pathname}?${parametros}`);
  }, [estado, slugA, slugB]);

  if (estado === 'cargando') {
    return (
      <p className="t-texto py-12 text-muted" role="status">
        Cargando los carros…
      </p>
    );
  }

  if (estado === 'error') {
    return (
      <div className="py-12" role="alert">
        <p className="t-lateral text-heading">No se pudieron cargar los carros.</p>
        <p className="t-texto mt-3 text-muted">Revisa tu conexión y vuelve a intentarlo.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-accent px-6 text-[15px] font-bold text-on-accent hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const a = vehiculos.find((v) => v.slug === slugA);
  const b = vehiculos.find((v) => v.slug === slugB);

  if (!a || !b) {
    return (
      <div className="py-12">
        <p className="t-lateral text-heading">Todavía no hay carros para comparar.</p>
        <p className="t-texto mt-3 text-muted">Estamos cargando las primeras fichas técnicas. Vuelve pronto.</p>
      </div>
    );
  }

  const mismoCarro = a.slug === b.slug;
  const ejes = calcularEjes(a, b);
  const veredicto = mismoCarro ? null : calcularVeredicto(ejes);
  const puntajeA = veredicto ? veredicto.promedioA : null;
  const puntajeB = veredicto ? veredicto.promedioB : null;
  // Solo se muestran las filas donde al menos un carro tiene el dato
  const secciones = SECCIONES.map((seccion) => ({
    ...seccion,
    filas: seccion.filas.filter((fila) => a[fila.campo] != null || b[fila.campo] != null),
  })).filter((seccion) => seccion.filas.length > 0);

  const irABuscar = () => {
    buscadores.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    buscadores.current?.querySelector('input')?.focus({ preventScroll: true });
  };

  return (
    <div>
      <div ref={buscadores} className="grid scroll-mt-6 gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end md:gap-6">
        <BuscadorCarro etiqueta="Carro 1" color={COLOR.a} vehiculos={vehiculos} valor={slugA} alCambiar={(s) => { setSlugA(s); setArea(null); }} />
        <span className="hidden self-end pb-3 font-titular text-[20px] font-bold text-muted md:block" aria-hidden="true">vs</span>
        <BuscadorCarro etiqueta="Carro 2" color={COLOR.b} vehiculos={vehiculos} valor={slugB} alCambiar={(s) => { setSlugB(s); setArea(null); }} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-6">
        <TarjetaVehiculo vehiculo={a} lado="a" puntaje={puntajeA} />
        <div className="hidden flex-col items-center sm:flex" aria-hidden="true">
          <span className="w-px flex-1 bg-border" />
          <span className="my-3 font-titular text-[20px] font-bold text-muted">VS</span>
          <span className="w-px flex-1 bg-border" />
        </div>
        <TarjetaVehiculo vehiculo={b} lado="b" puntaje={puntajeB} />
      </div>

      {mismoCarro && (
        <p className="mt-6 border-l-[3px] border-accent-bright pl-4 text-[17px] leading-6" role="status">
          Elegiste el mismo carro en los dos lados. Cambia uno para ver diferencias.
        </p>
      )}

      {veredicto && <BloqueVeredicto veredicto={veredicto} a={a} b={b} />}

      <section aria-labelledby="titulo-resumen" className="mt-14">
        <h2 id="titulo-resumen" className="t-seccion barra-corta">
          ¿En qué es mejor cada uno?
        </h2>
        <div className="mt-6">
          <GraficoRadar
            ejes={ejes}
            nombreA={nombreCompleto(a)}
            nombreB={nombreCompleto(b)}
            seleccion={area}
            alElegir={setArea}
          />
        </div>
        {area !== null && <DetalleArea area={ejes[area].nombre} a={a} b={b} alCerrar={() => setArea(null)} />}
      </section>

      {!mismoCarro && <MayoresDiferencias a={a} b={b} />}

      <section aria-labelledby="titulo-ficha" className="mt-14">
        <h2 id="titulo-ficha" className="t-seccion barra-corta">Ficha técnica</h2>
        <nav aria-label="Secciones de la ficha" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {secciones.map((seccion) => (
              <li key={seccion.id}>
                <a
                  href={`#${seccion.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-[15px] transition-colors duration-150 hover:border-accent hover:text-accent"
                >
                  {seccion.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {secciones.map((seccion) => (
          <div key={seccion.id} id={seccion.id} className="mt-10 scroll-mt-6">
            <h3 className="t-lateral border-b-2 border-heading pb-3">{seccion.titulo}</h3>
            <dl>
              {seccion.filas.map((fila) => (
                <FilaComparada key={fila.campo} fila={fila} a={a} b={b} />
              ))}
            </dl>
          </div>
        ))}

        <p className="mt-8 text-[14px] leading-5 text-muted">
          "Sin dato" significa que no hay una fuente confiable para ese valor, no que el carro no lo tenga. Las
          autonomías solo son comparables dentro del mismo ciclo de medición.
        </p>
      </section>

      {/* Barra fija con los dos carros mientras se recorre la comparación */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          {(
            [
              ['a', a, puntajeA],
              ['b', b, puntajeB],
            ] as const
          ).map(([lado, vehiculo, puntaje], i) => (
            <div key={lado} className="flex min-w-0 flex-1 items-center gap-2">
              {i === 1 && <span className="mr-1 font-titular text-[13px] font-bold text-muted" aria-hidden="true">vs</span>}
              <Anillo valor={puntaje} lado={lado} tamano={40} />
              <span className="truncate text-[15px] font-bold text-heading">{nombreModelo(vehiculo)}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={irABuscar}
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border border-border px-4 text-[15px] font-bold hover:border-accent hover:text-accent"
          >
            Cambiar
          </button>
        </div>
      </div>
    </div>
  );
}
