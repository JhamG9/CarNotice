import { useState } from 'react';
import type { Eje } from '../lib/vehiculos';

interface Props {
  ejes: Eje[];
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

export default function GraficoRadar({ ejes, nombreA, nombreB, seleccion, alElegir }: Props) {
  const [encima, setEncima] = useState<number | null>(null);
  const activo = encima ?? seleccion;

  const angulo = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / ejes.length;
  const punto = (i: number, valor: number) => ({
    x: CX + Math.cos(angulo(i)) * RADIO * (valor / 100),
    y: CY + Math.sin(angulo(i)) * RADIO * (valor / 100),
  });
  const poligono = (serie: 'a' | 'b') =>
    ejes
      .map((eje, i) => punto(i, eje[serie] ?? 0))
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
                      y={centro.y - 15}
                      width={ancho}
                      height="30"
                      rx="15"
                      fill={elegido ? 'var(--accent)' : 'var(--surface)'}
                      stroke={resaltado ? 'var(--accent)' : 'var(--border)'}
                      strokeWidth="1.5"
                    />
                    <text
                      x={centro.x}
                      y={centro.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={elegido ? 'var(--on-accent)' : 'var(--ink)'}
                      fontSize="13"
                      fontWeight="700"
                      letterSpacing="0.5"
                      fontFamily="var(--font-texto)"
                    >
                      {eje.nombre.toUpperCase()}
                    </text>
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
            <caption className="sr-only">Puntajes de 0 a 100 por área. Elige un área para ver su detalle.</caption>
            <thead>
              <tr className="border-b-2 border-heading text-heading">
                <th scope="col" className="py-2 pr-3 font-bold">Área</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">{nombreA}</th>
                <th scope="col" className="py-2 pl-3 text-right font-bold">{nombreB}</th>
              </tr>
            </thead>
            <tbody>
              {ejes.map((eje, i) => {
                const gana = eje.a !== null && eje.b !== null && eje.a !== eje.b ? (eje.a > eje.b ? 'a' : 'b') : null;
                return (
                  <tr
                    key={eje.nombre}
                    className={`border-b border-border ${activo === i ? 'bg-tint' : ''}`}
                    onMouseEnter={() => setEncima(i)}
                    onMouseLeave={() => setEncima(null)}
                  >
                    <th scope="row" className="py-1 pr-3 font-normal">
                      <button
                        type="button"
                        aria-pressed={seleccion === i}
                        onClick={() => alternar(i)}
                        className="block min-h-11 w-full cursor-pointer py-1 text-left hover:text-accent aria-pressed:font-bold aria-pressed:text-accent"
                      >
                        {eje.nombre}
                        <span className="block text-[13px] font-normal text-muted">{eje.detalle}</span>
                      </button>
                    </th>
                    <td className={`px-3 py-2 text-right tabular-nums ${gana === 'a' ? 'font-bold text-heading' : ''}`}>{texto(eje.a)}</td>
                    <td className={`py-2 pl-3 text-right tabular-nums ${gana === 'b' ? 'font-bold text-heading' : ''}`}>{texto(eje.b)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[14px] leading-5 text-muted">
            Puntajes orientativos de 0 a 100. Se calculan contra rangos fijos, no contra el otro carro, así que el puntaje
            de un carro no cambia según con cuál se compare.
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
