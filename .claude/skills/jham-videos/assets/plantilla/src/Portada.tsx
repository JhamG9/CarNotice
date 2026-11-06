// Miniatura de YouTube (1280×720). Título enorme a la izquierda (2–3 palabras por línea) e imagen real grande a la
// derecha. Tiene que leerse en 168×94 (la lista "a continuación"): pocas palabras y mucho contraste.
// Se configura en plan.json → "portada": { etiqueta, lineas, imagenes: ["imagenes/x.jpg"], icono, pegatina, oscura }.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./motor/fuentes";
import { C, ESTILO, PLAN, SUAVE } from "./motor/actual";
import { F, alfa } from "./motor/estilos";
import { Fondo } from "./motor/Fondo";
import { Baldosa, Destello } from "./piezas/basicas";

/** true si el color #RRGGBB es oscuro (luminancia baja). */
const esOscuro = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
};

const conAcento = (t: string) =>
  t.split(/(\*[^*]+\*)/g).map((s, k) =>
    s.startsWith("*") ? (
      <span key={k} style={{ color: C.acentoTexto, background: C.acento, padding: "0 14px", borderRadius: 14, boxDecorationBreak: "clone" }}>
        {s.slice(1, -1)}
      </span>
    ) : (
      <span key={k}>{s}</span>
    ),
  );

export const Portada: React.FC = () => {
  const p = PLAN.portada ?? { lineas: [PLAN.titulo] };
  const lineas = p.lineas.slice(0, 3);
  const imagen = (p.imagenes ?? [])[0];
  const largo = Math.max(...lineas.map((l) => l.replace(/\*/g, "").length));
  const conImagen = Boolean(imagen || p.icono);
  // el título ocupa ~60 % del ancho si hay imagen, casi todo si no
  const anchoTitulo = conImagen ? 700 : 1120;
  const tam = Math.min(170, Math.max(70, (anchoTitulo / (largo * 0.58)) * ESTILO.escalaTitulo));
  const oscura = !!p.oscura && !esOscuro(C.fondo);
  const colorTexto = oscura ? C.oscuroTexto : C.texto;
  const sombra = SUAVE ? `0 6px 0 ${alfa("#000000", 0.1)}` : `4px 5px 0 ${C.borde}`;
  return (
    <AbsoluteFill style={{ background: oscura ? C.oscuro : undefined, overflow: "hidden" }}>
      {!oscura && <Fondo />}
      {imagen && (
        <div
          style={{
            position: "absolute",
            right: -40,
            top: 70,
            width: 620,
            height: 580,
            borderRadius: 36,
            overflow: "hidden",
            border: `8px solid ${C.tarjeta}`,
            transform: "rotate(3deg)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
          }}
        >
          <Img src={staticFile(imagen)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {!imagen && p.icono && (
        <div style={{ position: "absolute", right: 120, top: 180 }}>
          <Baldosa size={340} icono={p.icono} brillo={0.5} />
        </div>
      )}
      {p.etiqueta && (
        <div style={{ position: "absolute", left: 64, top: 56, display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: oscura ? alfa(C.oscuroTexto, 0.12) : C.oscuro,
              color: C.oscuroTexto,
              borderRadius: 36,
              padding: "10px 26px 8px 18px",
              fontFamily: F.titulo,
              fontSize: 32,
              letterSpacing: 3,
            }}
          >
            <Destello size={30} />
            {p.etiqueta}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 64,
          width: anchoTitulo,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: p.etiqueta ? 60 : 0,
          lineHeight: 1.04,
          fontFamily: F.titulo,
          color: colorTexto,
          textShadow: sombra,
          textTransform: "uppercase",
          letterSpacing: -2,
        }}
      >
        {lineas.map((l, k) => (
          <div key={k} style={{ fontSize: tam, whiteSpace: "nowrap", margin: "4px 0" }}>
            {conAcento(l)}
          </div>
        ))}
      </div>
      {p.pegatina && (
        <div style={{ position: "absolute", right: 70, bottom: 60, transform: "rotate(-5deg)", zIndex: 20 }}>
          <div style={{ background: C.acento, color: C.acentoTexto, fontFamily: F.titulo, fontSize: 46, padding: "12px 26px 10px", borderRadius: 20, boxShadow: "0 16px 30px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>{p.pegatina}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
