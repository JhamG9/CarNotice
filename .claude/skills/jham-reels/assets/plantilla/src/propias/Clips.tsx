// Escena propia: vídeo real a pantalla completa (uno o varios clips que se suceden) con títulos grandes
// y píldoras encima. Los clips cambian en sus momentos; las líneas del título entran también en los suyos.
//
// Campos: clips: [{ video: "videos/x.mp4", desde: 1.5, foco: "50% 50%", texto: "Ciudad", icono: "building" }],
//         lineas: ["Este SUV", "*ve en 3D*"], etiqueta: "DEEPAL S05", escaneo: true
//         cada clip puede llevar fuente: "Fuente: Waymo" (crédito pequeño arriba a la derecha)
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, LIENZO, ZONA } from "../motor/actual";
import { F, alfa } from "../motor/estilos";
import { usePop, lerp } from "../motor/anim";
import { Icono, Pildora } from "../piezas/basicas";
import type { DefEscena, PropsEscena } from "../tipos";
import { arr, bool, txt } from "../escenas/util";

type Clip = { video: string; desde?: number; foco?: string; texto?: string; icono?: string; fuente?: string };

/** Desplazamiento del lienzo dentro de la pantalla (para dibujar a sangre, de borde a borde). */
const DY = ZONA.y + ZONA.h / 2 - (LIENZO.y + LIENZO.h / 2);

const Linea: React.FC<{ texto: string; desde: number; tam: number }> = ({ texto, desde, tam }) => {
  const s = usePop(desde);
  if (s <= 0) return null;
  const acento = texto.startsWith("*") && texto.endsWith("*");
  const limpio = texto.replace(/\*/g, "");
  return (
    <div
      style={{
        fontFamily: F.titulo,
        fontSize: tam,
        lineHeight: 1.02,
        letterSpacing: -2,
        textTransform: "uppercase",
        color: acento ? C.acentoTexto : "#FFFFFF",
        background: acento ? C.acento : "transparent",
        padding: acento ? "4px 26px 10px" : 0,
        borderRadius: 18,
        transform: `scale(${s}) rotate(${acento ? -2 : 0}deg)`,
        textShadow: acento ? "none" : "0 6px 30px rgba(0,0,0,0.65)",
        margin: "6px 0",
      }}
    >
      {limpio}
    </div>
  );
};

const PildoraClip: React.FC<{ clip: Clip; desde: number }> = ({ clip, desde }) => {
  const s = usePop(desde);
  if (!clip.texto || s <= 0) return null;
  return (
    <div style={{ transform: `scale(${s})`, display: "flex", justifyContent: "center" }}>
      <Pildora fondo={C.acento} color={C.acentoTexto} tam={46}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          {clip.icono && <Icono nombre={clip.icono} tam={44} color={C.acentoTexto} />}
          {clip.texto}
        </span>
      </Pildora>
    </div>
  );
};

const Clips: React.FC<PropsEscena> = ({ p, b, dur }) => {
  const f = useCurrentFrame();
  const clips = arr<Clip>(p, "clips");
  const lineas = arr<string>(p, "lineas");
  const etiqueta = txt(p, "etiqueta");
  const inicios = clips.map((_, k) => (k === 0 ? 0 : b[k] ?? 0));
  const actual = inicios.reduce((acc, ini, k) => (f >= ini ? k : acc), 0);
  const escaneo = bool(p, "escaneo", false);
  // línea láser que barre la pantalla de arriba abajo
  const ciclo = 38;
  const yScan = ((f % ciclo) / ciclo) * 1920;
  const flash = lerp(f - inicios[actual], 0, 6, 0.55, 0);
  return (
    <AbsoluteFill style={{ top: -DY, height: 1920, overflow: "hidden" }}>
      {clips.map((c, k) => {
        const ini = inicios[k];
        const fin = k + 1 < clips.length ? inicios[k + 1] : dur;
        return (
          <Sequence key={k} from={ini} durationInFrames={Math.max(1, fin - ini)} layout="none">
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(c.video)}
                startFrom={Math.round((c.desde ?? 0) * 30)}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.foco ?? "50% 50%" }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* oscurece arriba y abajo para que se lean el título y los subtítulos */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alfa(C.fondo, 0.7)} 0%, ${alfa(C.fondo, 0.05)} 32%, ${alfa(C.fondo, 0.05)} 58%, ${alfa(C.fondo, 0.94)} 76%, ${C.fondo} 100%)` }} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      {escaneo && (
        <div style={{ position: "absolute", left: 0, right: 0, top: yScan, height: 4, background: C.acento, boxShadow: `0 0 26px 8px ${alfa(C.acento, 0.55)}`, opacity: 0.75 }} />
      )}
      {etiqueta && (
        <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${usePop(0)})` }}>
          <Pildora fondo={C.oscuro} color={C.acento} tam={34} mono>
            {etiqueta}
          </Pildora>
        </div>
      )}
      {lineas.length > 0 && (
        <div style={{ position: "absolute", top: 330, left: 40, right: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {lineas.map((l, k) => (
            <Linea key={k} texto={l} desde={b[k] ?? 0} tam={136} />
          ))}
        </div>
      )}
      {clips[actual]?.fuente && (
        <div style={{ position: "absolute", top: 170, right: 50, fontFamily: F.mono, fontSize: 24, color: "#FFFFFF", opacity: 0.8, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
          {clips[actual].fuente}
        </div>
      )}
      <div style={{ position: "absolute", top: 1120, left: 0, right: 0 }}>
        {clips[actual] && <PildoraClip key={actual} clip={clips[actual]} desde={inicios[actual] + 2} />}
      </div>
    </AbsoluteFill>
  );
};

export const clips: DefEscena = {
  C: Clips,
  momentos: (p) => Math.max(arr(p, "clips").length, arr(p, "lineas").length, 1),
  alInicio: () => true,
  sonidos: (p) =>
    arr(p, "lineas").length > 0
      ? arr(p, "lineas").map((_, k) => [k, k === 0 ? "golpe" : "whoosh", 0.35] as [number, string, number])
      : arr(p, "clips").map((_, k) => [k, "swoosh", 0.3] as [number, string, number]),
};
