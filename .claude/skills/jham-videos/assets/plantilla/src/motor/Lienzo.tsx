import React from "react";
import { LIENZO, ZONA } from "./actual";

/**
 * Las escenas de la biblioteca se diseñaron para la pantalla vertical de los reels (1080×1920) y se dibujan con
 * coordenadas de esa pantalla dentro de LIENZO (x 60–1020, y 210–1070); muchas se centran con AbsoluteFill.
 * En el vídeo horizontal se les da su propia caja de 1080×1920 y esa caja se escala y se centra en la ZONA libre,
 * así ninguna escena tiene que saber que la pantalla es ancha.
 */
const BASE = { w: 1080, h: 1920 };

export const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const s = Math.min(ZONA.w / LIENZO.w, ZONA.h / LIENZO.h);
  const cx = ZONA.x + ZONA.w / 2,
    cy = ZONA.y + ZONA.h / 2;
  const lx = LIENZO.x + LIENZO.w / 2,
    ly = LIENZO.y + LIENZO.h / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: BASE.w,
        height: BASE.h,
        transform: `translate(${cx - lx}px, ${cy - ly}px) scale(${s})`,
        transformOrigin: `${lx}px ${ly}px`,
      }}
    >
      {children}
    </div>
  );
};
