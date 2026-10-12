import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buscarVehiculos, nombreMercado, nombreModelo, type Vehiculo } from '../lib/vehiculos';

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

  const resultados = useMemo(() => buscarVehiculos(vehiculos, consulta), [vehiculos, consulta]);
  const visibles = resultados.slice(0, MAX_RESULTADOS);

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
        <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {etiqueta}
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
        <ul
          id={idLista}
          role="listbox"
          aria-label={`Resultados para ${etiqueta}`}
          className="absolute right-0 left-0 z-20 mt-1 max-h-[420px] overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg md:right-auto md:w-[min(440px,calc(100vw-2rem))]"
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
                    {v.latam_name && ` · en Latinoamérica: ${v.latam_name}`}
                  </span>
                </span>
              </li>
            ))
          )}
          {resultados.length > MAX_RESULTADOS && (
            <li className="px-4 py-2 text-[13px] text-muted" role="presentation">
              {resultados.length - MAX_RESULTADOS} más. Escribe más para afinar.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
