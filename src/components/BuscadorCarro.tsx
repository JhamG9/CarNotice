import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buscarVehiculos, marcas, muestraVariada, nombreMercado, nombreModelo, textoOtroNombre, type Vehiculo } from '../lib/vehiculos';

const MAX_RESULTADOS = 8;

interface Props {
  etiqueta: string;
  color: string;
  vehiculos: Vehiculo[];
  valor: string;
  alCambiar: (slug: string) => void;
}

const detalle = (v: Vehiculo) => `${v.version} · ${v.model_year} · ${nombreMercado(v.market)}`;

/** Campo de búsqueda con lista de sugerencias (patrón combobox de ARIA). */
export default function BuscadorCarro({ etiqueta, color, vehiculos, valor, alCambiar }: Props) {
  const id = useId();
  const idLista = `${id}-lista`;
  const elegido = vehiculos.find((v) => v.slug === valor);
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const vacia = consulta.trim() === '';
  const resultados = useMemo(() => buscarVehiculos(vehiculos, consulta), [vehiculos, consulta]);
  // Sin texto se muestra una muestra de varias marcas, no los primeros del abecedario
  const visibles = useMemo(
    () => (vacia ? muestraVariada(vehiculos, MAX_RESULTADOS) : resultados.slice(0, MAX_RESULTADOS)),
    [vacia, vehiculos, resultados],
  );
  const listaMarcas = useMemo(() => marcas(vehiculos), [vehiculos]);

  // Al hacer clic fuera se cierra la lista y vuelve a mostrarse el carro elegido
  useEffect(() => {
    if (!abierto) return;
    const alHacerClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) cerrar();
    };
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
    setConsulta('');
  }

  function elegir(v: Vehiculo) {
    alCambiar(v.slug);
    cerrar();
    campo.current?.blur();
  }

  function alPresionar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (evento.key === 'Enter' && abierto && visibles[activo]) {
      evento.preventDefault();
      elegir(visibles[activo]);
    } else if (evento.key === 'Escape') {
      cerrar();
    }
  }

  const texto = abierto ? consulta : elegido ? `${nombreModelo(elegido)} ${elegido.version}` : '';

  return (
    <div ref={contenedor} className="relative">
      <label htmlFor={`${id}-campo`} className="t-meta flex items-center gap-2 tracking-[0.5px] text-muted uppercase">
        <span className="inline-block size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        <span className="sr-only">{etiqueta}: </span>
        <span className="truncate">{elegido ? nombreModelo(elegido) : etiqueta}</span>
      </label>
      <div className="relative mt-2">
        <svg
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={campo}
          id={`${id}-campo`}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && visibles[activo] ? `${id}-op-${activo}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe una marca o un modelo"
          value={texto}
          onFocus={() => {
            setAbierto(true);
            setActivo(0);
          }}
          onChange={(evento) => {
            setConsulta(evento.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onKeyDown={alPresionar}
          className="min-h-12 w-full rounded-lg border border-border bg-surface pr-3 pl-10 text-[16px] text-ink placeholder:text-muted focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent"
        />
      </div>

      {abierto && (
        <div className="absolute right-0 left-0 z-20 mt-1 max-h-[480px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg md:right-auto md:w-[min(460px,calc(100vw-2rem))]">
          {vacia && (
            <div className="border-b border-border px-3 pt-3 pb-2">
              <p className="text-[13px] text-muted">
                {vehiculos.length} carros de {listaMarcas.length} marcas. Escribe o elige una marca:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {listaMarcas.map(({ marca, total }) => (
                  <button
                    key={marca}
                    type="button"
                    onMouseDown={(evento) => evento.preventDefault()}
                    onClick={() => {
                      setConsulta(marca);
                      setActivo(0);
                      campo.current?.focus();
                    }}
                    className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-border px-2.5 text-[13px] hover:border-accent hover:text-accent"
                  >
                    {marca}
                    <span className="text-muted">{total}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] font-bold text-heading">Algunos para empezar</p>
            </div>
          )}
        <ul
          id={idLista}
          role="listbox"
          aria-label={`Resultados para ${etiqueta}`}
          className="py-1"
        >
          {visibles.length === 0 ? (
            <li className="px-4 py-3 text-[15px] text-muted" role="presentation">
              Ningún carro coincide con "{consulta}".
            </li>
          ) : (
            visibles.map((v, i) => (
              <li
                key={v.slug}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={v.slug === valor}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegir(v)}
                onMouseEnter={() => setActivo(i)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === activo ? 'bg-tint' : ''}`}
              >
                {v.image_url ? (
                  <img src={v.image_url} alt="" width="64" height="36" loading="lazy" className="aspect-video w-16 shrink-0 rounded bg-tint object-cover" />
                ) : (
                  <span className="aspect-video w-16 shrink-0 rounded border border-border bg-tint" aria-hidden="true" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-heading">{nombreModelo(v)}</span>
                  <span className="block truncate text-[13px] text-muted">
                    {detalle(v)}
                    {v.latam_name && ` · ${textoOtroNombre(v)}`}
                  </span>
                </span>
              </li>
            ))
          )}
          {!vacia && resultados.length > MAX_RESULTADOS && (
            <li className="px-4 py-2 text-[13px] text-muted" role="presentation">
              {resultados.length - MAX_RESULTADOS} más. Escribe más para afinar.
            </li>
          )}
        </ul>
        </div>
      )}
    </div>
  );
}
