import { useEffect, useMemo, useState } from 'react';
import GraficoRadar from './GraficoRadar';
import {
  SECCIONES,
  calcularEjes,
  calcularVeredicto,
  enumerar,
  formatearValor,
  ganador,
  nombreCompleto,
  nombreModelo,
  obtenerVehiculos,
  ventajas,
  type Fila,
  type Vehiculo,
  type Veredicto,
} from '../lib/vehiculos';

type Estado = 'cargando' | 'listo' | 'error';
type Lado = 'a' | 'b';

const COLOR: Record<Lado, string> = { a: 'var(--chart-a)', b: 'var(--chart-b)' };
const MAX_VENTAJAS = 6;

function leerParametro(nombre: string): string | null {
  return new URLSearchParams(window.location.search).get(nombre);
}

/** Lista desplegable de carros, agrupada por marca y modelo. */
function Selector({
  lado,
  etiqueta,
  vehiculos,
  valor,
  alCambiar,
}: {
  lado: Lado;
  etiqueta: string;
  vehiculos: Vehiculo[];
  valor: string;
  alCambiar: (slug: string) => void;
}) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, Vehiculo[]>();
    for (const v of vehiculos) mapa.set(nombreModelo(v), [...(mapa.get(nombreModelo(v)) ?? []), v]);
    return [...mapa.entries()];
  }, [vehiculos]);

  return (
    <label className="block">
      <span className="t-meta flex items-center gap-2 tracking-[0.5px] text-muted uppercase">
        <span className="inline-block size-3 rounded-full" style={{ backgroundColor: COLOR[lado] }} aria-hidden="true" />
        {etiqueta}
      </span>
      <select
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-border bg-surface px-3 text-[16px] text-ink"
      >
        {grupos.map(([modelo, versiones]) => (
          <optgroup key={modelo} label={modelo}>
            {versiones.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.version} · {v.model_year} · {v.market}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function TarjetaVehiculo({ vehiculo, lado }: { vehiculo: Vehiculo; lado: Lado }) {
  return (
    <div className="min-w-0">
      {vehiculo.image_url ? (
        <img
          src={vehiculo.image_url}
          alt=""
          width="1200"
          height="675"
          loading="eager"
          className="aspect-video w-full bg-tint object-cover"
        />
      ) : (
        <div className="aspect-video w-full border border-border bg-tint" />
      )}
      <div className="mt-3 border-t-[3px] pt-3" style={{ borderColor: COLOR[lado] }}>
        <h2 className="t-lateral">{nombreModelo(vehiculo)}</h2>
        <p className="mt-1 text-[15px] text-muted">
          {vehiculo.version} · {vehiculo.model_year}
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
        <span className="flex flex-wrap items-baseline gap-x-2 text-[17px] leading-6">
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

function BloqueVeredicto({ veredicto, a, b }: { veredicto: Veredicto; a: Vehiculo; b: Vehiculo }) {
  const ganador = veredicto.ganador === 'a' ? a : veredicto.ganador === 'b' ? b : null;
  const lados = [
    { lado: 'a' as Lado, vehiculo: a, motivos: veredicto.motivosA, promedio: veredicto.promedioA },
    { lado: 'b' as Lado, vehiculo: b, motivos: veredicto.motivosB, promedio: veredicto.promedioB },
  ];

  return (
    <div className="mt-10 border border-border bg-surface p-5 md:p-8">
      <h3 className="t-lateral barra-corta">Veredicto: cuál te conviene más</h3>

      <p className="t-texto mt-5">
        {ganador ? (
          <>
            Según los datos, te conviene más el{' '}
            <strong className="font-bold text-heading">{nombreCompleto(ganador)}</strong>
            {veredicto.margen === 'por poco' ? ', aunque por poco.' : ', con una ventaja clara.'}
          </>
        ) : (
          <>
            Según los datos, <strong className="font-bold text-heading">están muy parejos</strong>: ninguno saca una
            ventaja que se note en el conjunto.
          </>
        )}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        {lados.map(({ lado, vehiculo, motivos, promedio }) => (
          <div key={lado} className="border-t-[3px] pt-4" style={{ borderColor: COLOR[lado] }}>
            <p className="text-[17px] leading-6 font-bold text-heading">{nombreCompleto(vehiculo)}</p>
            <p className="mt-1 text-[15px] text-muted">Puntaje promedio: {promedio} de 100</p>
            <p className="mt-3 text-[17px] leading-6">
              {motivos.length > 0
                ? `Elígelo si lo que más te importa es ${enumerar(motivos)}.`
                : 'No supera al otro en ninguna categoría medida.'}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[14px] leading-5 text-muted">
        El veredicto sale del promedio de los puntajes del gráfico, en las {veredicto.ejesComparados} categorías con
        dato en los dos carros. No tiene en cuenta el precio, que suele ser lo que más pesa al decidir.
        {veredicto.ejesSinDato.length > 0 &&
          ` Quedaron por fuera, por falta de datos: ${enumerar(veredicto.ejesSinDato.map((nombre) => nombre.toLowerCase()))}.`}
      </p>
    </div>
  );
}

export default function Comparador() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [slugA, setSlugA] = useState('');
  const [slugB, setSlugB] = useState('');

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
  const ventajasA = ventajas(a, b);
  const ventajasB = ventajas(b, a);
  // Solo se muestran las filas donde al menos un carro tiene el dato
  const secciones = SECCIONES.map((seccion) => ({
    ...seccion,
    filas: seccion.filas.filter((fila) => a[fila.campo] != null || b[fila.campo] != null),
  })).filter((seccion) => seccion.filas.length > 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <Selector lado="a" etiqueta="Carro 1" vehiculos={vehiculos} valor={slugA} alCambiar={setSlugA} />
        <Selector lado="b" etiqueta="Carro 2" vehiculos={vehiculos} valor={slugB} alCambiar={setSlugB} />
        <TarjetaVehiculo vehiculo={a} lado="a" />
        <TarjetaVehiculo vehiculo={b} lado="b" />
      </div>

      {mismoCarro && (
        <p className="mt-6 border-l-[3px] border-accent-bright pl-4 text-[17px] leading-6" role="status">
          Elegiste el mismo carro en los dos lados. Cambia uno para ver diferencias.
        </p>
      )}

      <section aria-labelledby="titulo-resumen" className="mt-12">
        <h2 id="titulo-resumen" className="t-seccion barra-corta">Resumen</h2>
        <div className="mt-6">
          <GraficoRadar ejes={ejes} nombreA={nombreCompleto(a)} nombreB={nombreCompleto(b)} />
        </div>
        {veredicto && <BloqueVeredicto veredicto={veredicto} a={a} b={b} />}
      </section>

      {!mismoCarro && (
        <section aria-labelledby="titulo-ventajas" className="mt-14">
          <h2 id="titulo-ventajas" className="t-seccion barra-corta">Ventajas de cada uno</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {(
              [
                ['a', a, ventajasA],
                ['b', b, ventajasB],
              ] as const
            ).map(([lado, vehiculo, lista]) => (
              <div key={lado} className="border-t-[3px] pt-4" style={{ borderColor: COLOR[lado] }}>
                <h3 className="t-lateral">{nombreCompleto(vehiculo)}</h3>
                {lista.length === 0 ? (
                  <p className="mt-3 text-[17px] leading-6 text-muted">Sin ventajas medibles con los datos disponibles.</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {lista.slice(0, MAX_VENTAJAS).map((texto) => (
                      <li key={texto} className="flex gap-2 text-[17px] leading-6">
                        <svg className="mt-1 shrink-0 text-muted" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 8.5l3.5 3.5L13 4.5" />
                        </svg>
                        {texto}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
              {seccion.filas.map((fila) => {
                const quien = ganador(fila, a, b);
                return (
                  <div
                    key={fila.campo}
                    className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-border py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-8"
                  >
                    <dt className="col-span-2 text-[15px] text-muted md:col-span-1 md:text-[17px] md:leading-6 md:text-ink">
                      {fila.etiqueta}
                    </dt>
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
              })}
            </dl>
          </div>
        ))}

        <p className="mt-8 text-[14px] leading-5 text-muted">
          "Sin dato" significa que no hay una fuente confiable para ese valor, no que el carro no lo tenga. Las
          autonomías solo son comparables dentro del mismo ciclo de medición.
        </p>
      </section>
    </div>
  );
}
