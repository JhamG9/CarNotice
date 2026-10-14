import { useState } from 'react';
import { enumerar, type Eje, type ResumenArea } from '../lib/vehiculos';

interface Props {
  ejes: Eje[];
  /** Dato real de cada área, para la tabla. */
  resumen: ResumenArea[];
  nombreA: string;
  nombreB: string;
  /** Área elegida (índice del eje); null si ninguna. */
  seleccion: number | null;
  alElegir: (indice: number | null) => void;
}

const ANCHO = 480;
const ALTO = 400;
const CX = ANCHO / 2;
const CY = ALTO / 2;
const RADIO = 125;
const ANILLOS = [25, 50, 75, 100];

export default function GraficoRadar({ ejes, resumen, nombreA, nombreB, seleccion, alElegir }: Props) {
  const [encima, setEncima] = useState<number | null>(null);
  const activo = encima ?? seleccion;

  const angulo = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / ejes.length;
  const punto = (i: number, valor: number) => ({
    x: CX + Math.cos(angulo(i)) * RADIO * (valor / 100),
    y: CY + Math.sin(angulo(i)) * RADIO * (valor / 100),
  });
  // Un área sin dato se salta: dibujarla en 0 haría creer que el carro no tiene nada
  const poligono = (serie: 'a' | 'b') =>
    ejes
      .flatMap((eje, i) => (eje[serie] === null ? [] : [punto(i, eje[serie] as number)]))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  const anillo = (valor: number) =>
    ejes
      .map((_, i) => punto(i, valor))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  const texto = (valor: number | null) => (valor === null ? 'Sin dato' : String(valor));
  const alternar = (i: number) => alElegir(seleccion === i ? null : i);

  return (
    <figure>
      {/* Leyenda: el nombre va en color de texto; la identidad la da la muestra de al lado */}
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]">
        <li className="flex items-center gap-2">
          <svg width="28" height="12" aria-hidden="true">
            <line x1="0" y1="6" x2="28" y2="6" stroke="var(--chart-a)" strokeWidth="3" />
          </svg>
          {nombreA}
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="12" aria-hidden="true">
            <line x1="0" y1="6" x2="28" y2="6" stroke="var(--chart-b)" strokeWidth="3" strokeDasharray="6 4" />
          </svg>
          {nombreB}
        </li>
      </ul>

      <div className="mt-2 grid items-start gap-x-12 gap-y-4 lg:grid-cols-2">
        <div>
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            className="mx-auto w-full max-w-[540px]"
            role="img"
            aria-label={`Gráfico de araña que compara ${nombreA} y ${nombreB} en ${ejes.length} áreas. Los puntajes están en la tabla de al lado.`}
            onMouseLeave={() => setEncima(null)}
          >
            {ANILLOS.map((valor) => (
              <polygon key={valor} points={anillo(valor)} fill="none" stroke="var(--border)" strokeWidth="1" />
            ))}
            {ejes.map((_, i) => {
              const fin = punto(i, 100);
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={fin.x}
                  y2={fin.y}
                  stroke={activo === i ? 'var(--muted)' : 'var(--border)'}
                  strokeWidth={activo === i ? 1.5 : 1}
                />
              );
            })}

            <polygon points={poligono('a')} fill="var(--chart-a)" fillOpacity="0.14" stroke="var(--chart-a)" strokeWidth="2" strokeLinejoin="round" />
            <polygon points={poligono('b')} fill="var(--chart-b)" fillOpacity="0.1" stroke="var(--chart-b)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6 4" />

            {ejes.map((eje, i) => {
              const a = eje.a === null ? null : punto(i, eje.a);
              const b = eje.b === null ? null : punto(i, eje.b);
              const centro = punto(i, 128);
              // Píldora con el nombre del área, como botón
              const ancho = eje.nombre.length * 8.4 + 26;
              const resaltado = activo === i;
              const elegido = seleccion === i;
              // Sin datos en ninguno de los dos: la píldora queda en gris y punteada, con la aclaración
              const sinDatos = eje.a === null && eje.b === null;
              const alto = sinDatos ? 40 : 30;
              return (
                <g key={eje.nombre}>
                  {/* Anillo del color del fondo para que los puntos superpuestos se distingan */}
                  {a && <circle cx={a.x} cy={a.y} r={resaltado ? 6 : 4.5} fill="var(--chart-a)" stroke="var(--bg)" strokeWidth="2" />}
                  {b && <rect x={b.x - (resaltado ? 5.5 : 4.5)} y={b.y - (resaltado ? 5.5 : 4.5)} width={resaltado ? 11 : 9} height={resaltado ? 11 : 9} fill="var(--chart-b)" stroke="var(--bg)" strokeWidth="2" />}
                  <g
                    className="cursor-pointer"
                    onClick={() => alternar(i)}
                    onMouseEnter={() => setEncima(i)}
                    aria-hidden="true"
                  >
                    <rect
                      x={centro.x - ancho / 2}
                      y={centro.y - alto / 2}
                      width={ancho}
                      height={alto}
                      rx={alto / 2}
                      fill={elegido ? 'var(--accent)' : sinDatos ? 'var(--bg)' : 'var(--surface)'}
                      stroke={resaltado ? 'var(--accent)' : sinDatos ? 'var(--muted)' : 'var(--border)'}
                      strokeWidth="1.5"
                      strokeDasharray={sinDatos && !resaltado ? '4 3' : undefined}
                    />
                    <text
                      x={centro.x}
                      y={centro.y + (sinDatos ? -6 : 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={elegido ? 'var(--on-accent)' : sinDatos ? 'var(--muted)' : 'var(--ink)'}
                      fontSize="13"
                      fontWeight="700"
                      letterSpacing="0.5"
                      fontFamily="var(--font-texto)"
                    >
                      {eje.nombre.toUpperCase()}
                    </text>
                    {sinDatos && (
                      <text
                        x={centro.x}
                        y={centro.y + 9}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={elegido ? 'var(--on-accent)' : 'var(--muted)'}
                        fontSize="11"
                        fontFamily="var(--font-texto)"
                      >
                        sin datos
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>

          <p className="min-h-6 text-center text-[15px] text-muted" aria-hidden="true">
            {activo === null
              ? 'Toca un área para ver en qué se diferencian.'
              : `${ejes[activo].nombre}: ${nombreA} ${texto(ejes[activo].a)} · ${nombreB} ${texto(ejes[activo].b)}`}
          </p>
        </div>

        <figcaption>
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Dato de cada carro por área y cuál gana. Elige un área para ver su detalle.</caption>
            <thead>
              <tr className="border-b-2 border-heading text-heading">
                <th scope="col" className="py-2 pr-3 font-bold">Área</th>
                <th scope="col" className="px-2 py-2 font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--chart-a)' }} aria-hidden="true" />
                    {nombreA}
                  </span>
                </th>
                <th scope="col" className="px-2 py-2 font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: 'var(--chart-b)' }} aria-hidden="true" />
                    {nombreB}
                  </span>
                </th>
                <th scope="col" className="hidden py-2 pl-2 text-right font-bold sm:table-cell">Gana</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((fila, i) => {
                // Si ninguno de los dos tiene el dato, el área no ocupa una fila
                if (fila.a === null && fila.b === null) return null;
                const celda = (valor: string | null, extra: string | null, puntaje: number | null, lado: 'a' | 'b') => (
                  <td className="px-2 py-2 align-top">
                    {valor === null ? (
                      <span className="text-muted">Sin dato</span>
                    ) : (
                      <>
                        <span className={`whitespace-nowrap tabular-nums ${fila.ganador === lado ? 'font-bold text-heading' : ''}`}>{valor}</span>
                        {extra && <span className="block text-[13px] text-muted">{extra}</span>}
                        {puntaje !== null && (
                          <span className="mt-1 block h-1 w-full max-w-24 rounded-full bg-border" aria-hidden="true">
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(4, puntaje)}%`, backgroundColor: `var(--chart-${lado})` }} />
                          </span>
                        )}
                      </>
                    )}
                  </td>
                );
                return (
                  <tr
                    key={fila.nombre}
                    className={`border-b border-border ${activo === i ? 'bg-tint' : ''}`}
                    onMouseEnter={() => setEncima(i)}
                    onMouseLeave={() => setEncima(null)}
                  >
                    <th scope="row" className="py-1 pr-3 align-top font-normal">
                      <button
                        type="button"
                        aria-pressed={seleccion === i}
                        onClick={() => alternar(i)}
                        className="block min-h-11 w-full cursor-pointer py-1 text-left hover:text-accent aria-pressed:font-bold aria-pressed:text-accent"
                      >
                        {fila.nombre}
                        <span className="block text-[13px] font-normal text-muted">{fila.aclaracion}</span>
                        {/* En celular la columna "Gana" no cabe: la diferencia va bajo el nombre del área */}
                        {fila.diferencia !== null && (
                          <span className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-heading sm:hidden">
                            {fila.ganador && (
                              <span
                                className={`inline-block size-2 shrink-0 ${fila.ganador === 'b' ? 'rounded-sm' : 'rounded-full'}`}
                                style={{ backgroundColor: `var(--chart-${fila.ganador})` }}
                                aria-hidden="true"
                              />
                            )}
                            {fila.diferencia}
                          </span>
                        )}
                      </button>
                    </th>
                    {celda(fila.a, fila.extraA, fila.puntajeA, 'a')}
                    {celda(fila.b, fila.extraB, fila.puntajeB, 'b')}
                    <td className="hidden py-2 pl-2 text-right align-top text-[14px] sm:table-cell">
                      {fila.diferencia === null ? (
                        <span className="text-muted">–</span>
                      ) : fila.ganador ? (
                        <span className="inline-flex items-center gap-1 font-bold whitespace-nowrap text-heading">
                          <span
                            className={`inline-block size-2 shrink-0 ${fila.ganador === 'b' ? 'rounded-sm' : 'rounded-full'}`}
                            style={{ backgroundColor: `var(--chart-${fila.ganador})` }}
                            aria-hidden="true"
                          />
                          <span className="sr-only">{fila.ganador === 'a' ? nombreA : nombreB}: </span>
                          {fila.diferencia}
                        </span>
                      ) : (
                        <span className="text-muted">{fila.diferencia}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(() => {
            const vacias = resumen.filter((fila) => fila.a === null && fila.b === null).map((fila) => fila.nombre.toLowerCase());
            return vacias.length > 0 ? (
              <p className="mt-3 text-[14px] leading-5 text-muted">Sin datos de {enumerar(vacias)} para estos dos carros.</p>
            ) : null;
          })()}
          <p className="mt-3 text-[14px] leading-5 text-muted">
            La barra bajo cada dato es el puntaje del área, de 0 a 100, medido contra rangos fijos (por ejemplo, la
            autonomía va de 200 a 800 km). Con esos puntajes se dibuja el gráfico y se calcula el puntaje general.
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
