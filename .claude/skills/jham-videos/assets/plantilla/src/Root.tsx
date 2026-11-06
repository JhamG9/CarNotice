import React from "react";
import { AbsoluteFill, Composition, Img, Still } from "remotion";
import { ALTO, ANCHO, FPS } from "./motor/constantes";
import { TOTAL, resumen } from "./motor/linea";
import { Portada } from "./Portada";
import { Reel } from "./Reel";

// Hoja de contacto: los fotogramas ya renderizados (en JPEG pequeño, como data URL) en una cuadrícula.
const COLS = 4,
  MW = 480,
  MH = 270,
  ETQ = 34;
type Tesela = { src: string; etiqueta: string };
const Mosaico: React.FC<{ teselas: Tesela[] }> = ({ teselas }) => (
  <AbsoluteFill style={{ background: "#161616" }}>
    {teselas.map((t, k) => (
      <div key={k} style={{ position: "absolute", left: (k % COLS) * MW, top: Math.floor(k / COLS) * (MH + ETQ), width: MW, height: MH + ETQ }}>
        <div style={{ height: ETQ, color: "#FFD400", font: "bold 22px sans-serif", padding: "5px 8px", whiteSpace: "nowrap", overflow: "hidden" }}>{t.etiqueta}</div>
        <Img src={t.src} style={{ width: MW, height: MH, display: "block" }} />
      </div>
    ))}
  </AbsoluteFill>
);

// Comprobación de la miniatura de YouTube: entera, al tamaño de la página de inicio y al de "a continuación".
const PortadaCheck: React.FC = () => (
  <AbsoluteFill style={{ background: "#161616", color: "#FFD400", font: "bold 24px sans-serif" }}>
    <div style={{ position: "absolute", left: 10, top: 8 }}>miniatura 1280×720 (a la mitad)</div>
    <div style={{ position: "absolute", left: 0, top: 44, width: 640, height: 360, overflow: "hidden" }}>
      <div style={{ width: 1280, height: 720, transform: "scale(0.5)", transformOrigin: "0 0" }}>
        <Portada />
      </div>
    </div>
    <div style={{ position: "absolute", left: 680, top: 8 }}>inicio (360×202)</div>
    <div style={{ position: "absolute", left: 680, top: 44, width: 360, height: 202, overflow: "hidden", borderRadius: 12 }}>
      <div style={{ width: 1280, height: 720, transform: `scale(${360 / 1280})`, transformOrigin: "0 0" }}>
        <Portada />
      </div>
    </div>
    <div style={{ position: "absolute", left: 680, top: 270 }}>a continuación (168×94)</div>
    <div style={{ position: "absolute", left: 680, top: 306, width: 168, height: 94, overflow: "hidden", borderRadius: 8 }}>
      <div style={{ width: 1280, height: 720, transform: `scale(${168 / 1280})`, transformOrigin: "0 0" }}>
        <Portada />
      </div>
    </div>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    {/* calculateMetadata devuelve el resumen (escenas, momentos, problemas) para `node render.mjs resumen` */}
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={ANCHO} height={ALTO} calculateMetadata={async () => ({ props: { resumen: resumen() } })} />
    <Still id="Portada" component={Portada} width={1280} height={720} />
    <Still id="PortadaCheck" component={PortadaCheck} width={1060} height={420} />
    <Still
      id="Mosaico"
      component={Mosaico}
      width={COLS * MW}
      height={MH + ETQ}
      defaultProps={{ teselas: [] as Tesela[] }}
      calculateMetadata={async ({ props }) => ({ height: Math.max(1, Math.ceil(props.teselas.length / COLS)) * (MH + ETQ) })}
    />
  </>
);
