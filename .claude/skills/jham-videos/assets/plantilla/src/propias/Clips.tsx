// Escena propia: vídeo real a pantalla completa (uno o varios clips que se suceden) con títulos y píldoras encima.
// Versión horizontal (1920×1080): el vídeo oficial ya es 16:9, así que se ve entero, sin recorte. El título va
// abajo a la izquierda, sobre una sombra, y deja libre la franja de los subtítulos.
//
// Campos: clips: [{ video: "videos/x.mp4", desde: 1.5, foco: "50% 50%", texto: "Ciudad", icono: "building", fuente: "Fuente: Marca" }],
//         lineas: ["Este SUV", "*ve en 3D*"], etiqueta: "DEEPAL S05", escaneo: true
//         también acepta imágenes: { imagen: "imagenes/x.jpg" } en lugar de video (con un zoom lento)
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../motor/actual";
import { ALTO, ANCHO } from "../motor/constantes";
import { F, alfa } from "../motor/estilos";
import { usePop, lerp } from "../motor/anim";
import { Icono, Pildora } from "../piezas/basicas";
import type { DefEscena, PropsEscena } from "../tipos";
import { arr, bool, txt } from "../escenas/util";

type Clip = { video?: string; imagen?: string; desde?: number; foco?: string; texto?: string; icono?: string; fuente?: string };

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
        padding: acento ? "4px 22px 8px" : 0,
        borderRadius: 16,
        transform: `scale(${s}) rotate(${acento ? -1.5 : 0}deg)`,
        transformOrigin: "0% 50%",
        textShadow: acento ? "none" : "0 6px 30px rgba(0,0,0,0.65)",
        margin: "4px 0",
        alignSelf: "flex-start",
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
    <div style={{ transform: `scale(${s})`, transformOrigin: "0% 50%", display: "flex" }}>
      <Pildora fondo={C.acento} color={C.acentoTexto} tam={40}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          {clip.icono && <Icono nombre={clip.icono} tam={38} color={C.acentoTexto} />}
          {clip.texto}
        </span>
      </Pildora>
    </div>
  );
};

/** Una imagen fija no puede quedarse quieta: zoom lento y un leve desplazamiento durante el clip. */
const ImagenViva: React.FC<{ src: string; foco?: string; dur: number }> = ({ src, foco, dur }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, Math.max(1, dur)], [1.04, 1.14], { extrapolateRight: "clamp" });
  const dx = interpolate(f, [0, Math.max(1, dur)], [-14, 14], { extrapolateRight: "clamp" });
  return <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: foco ?? "50% 50%", transform: `scale(${z}) translateX(${dx}px)` }} />;
};

const Clips: React.FC<PropsEscena> = ({ p, b, dur }) => {
  const f = useCurrentFrame();
  const clips = arr<Clip>(p, "clips");
  const lineas = arr<string>(p, "lineas");
  const etiqueta = txt(p, "etiqueta");
  const inicios = clips.map((_, k) => (k === 0 ? 0 : b[k] ?? 0));
  const actual = inicios.reduce((acc, ini, k) => (f >= ini ? k : acc), 0);
  const escaneo = bool(p, "escaneo", false);
  const ciclo = 45;
  const xScan = ((f % ciclo) / ciclo) * ANCHO;
  const flash = lerp(f - inicios[actual], 0, 6, 0.45, 0);
  const largo = Math.max(1, ...lineas.map((l) => l.replace(/\*/g, "").length));
  const tam = Math.min(120, Math.max(64, 1100 / (largo * 0.62)));
  return (
    <AbsoluteFill style={{ width: ANCHO, height: ALTO, overflow: "hidden" }}>
      {clips.map((c, k) => {
        const ini = inicios[k];
        const fin = k + 1 < clips.length ? inicios[k + 1] : dur;
        return (
          <Sequence key={k} from={ini} durationInFrames={Math.max(1, fin - ini)} layout="none">
            <AbsoluteFill>
              {c.video ? (
                <OffthreadVideo
                  src={staticFile(c.video)}
                  startFrom={Math.round((c.desde ?? 0) * 30)}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.foco ?? "50% 50%" }}
                />
              ) : c.imagen ? (
                <ImagenViva src={c.imagen} foco={c.foco} dur={fin - ini} />
              ) : null}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* sombra abajo (subtítulos y título) y a la izquierda (título), para que se lean sobre cualquier imagen */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alfa(C.fondo, 0.35)} 0%, ${alfa(C.fondo, 0)} 22%, ${alfa(C.fondo, 0)} 55%, ${alfa(C.fondo, 0.85)} 86%, ${alfa(C.fondo, 0.95)} 100%)` }} />
      {lineas.length > 0 && <AbsoluteFill style={{ background: `linear-gradient(90deg, ${alfa(C.fondo, 0.55)} 0%, ${alfa(C.fondo, 0)} 55%)` }} />}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      {escaneo && (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: xScan, width: 4, background: C.acento, boxShadow: `0 0 26px 8px ${alfa(C.acento, 0.55)}`, opacity: 0.7 }} />
      )}
      {etiqueta && (
        <div style={{ position: "absolute", top: 56, left: 80, transform: `scale(${usePop(0)})`, transformOrigin: "0% 50%" }}>
          <Pildora fondo={C.oscuro} color={C.acento} tam={30} mono>
            {etiqueta}
          </Pildora>
        </div>
      )}
      {clips[actual]?.fuente && (
        <div style={{ position: "absolute", top: 60, right: 70, fontFamily: F.mono, fontSize: 22, color: "#FFFFFF", opacity: 0.85, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
          {clips[actual].fuente}
        </div>
      )}
      <div style={{ position: "absolute", left: 80, right: 520, bottom: 190, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
        {lineas.map((l, k) => (
          <Linea key={k} texto={l} desde={b[k] ?? 0} tam={tam} />
        ))}
        {clips[actual] && <PildoraClip key={actual} clip={clips[actual]} desde={inicios[actual] + 2} />}
      </div>
    </AbsoluteFill>
  );
};

export const clips: DefEscena = {
  C: Clips,
  sangre: true,
  momentos: (p) => Math.max(arr(p, "clips").length, arr(p, "lineas").length, 1),
  alInicio: () => true,
  sonidos: (p) =>
    arr(p, "lineas").length > 0
      ? arr(p, "lineas").map((_, k) => [k, k === 0 ? "golpe" : "whoosh", 0.3] as [number, string, number])
      : arr(p, "clips").map((_, k) => [k, "swoosh", 0.25] as [number, string, number]),
  validar: (p) =>
    arr<Clip>(p, "clips").flatMap((c, k) => (c.video || c.imagen ? [] : [`clip ${k + 1}: falta "video" o "imagen"`])),
};
