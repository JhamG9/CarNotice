"""Prepara un vídeo oficial para el reel: lo pasa a 1080p y 30 fps, crea una hoja para elegir tomas y anota la fuente.

Uso:
  python3 recursos.py ORIGINAL NOMBRE --fuente "https://…" --proyecto ~/reel [--desde 45] [--dur 50]

Crea public/videos/NOMBRE.mp4 (sin audio), salida/recursos/NOMBRE.jpg (recorte vertical: un fotograma por segundo,
14 por fila, de izquierda a derecha), salida/recursos/NOMBRE.json (las tomas, con su mejor "desde" y "foco") y añade la
línea a salida/FUENTES.md. Sirve para vídeo, GIF animado y foto (la convierte en un clip con un acercamiento lento).
"""
import argparse
import json
import os
import re
import subprocess
import sys

VENV = os.path.expanduser("~/.cache/jham-reels/venv")
if os.path.abspath(sys.prefix) != VENV and os.path.exists(os.path.join(VENV, "bin", "python")):
    os.execv(os.path.join(VENV, "bin", "python"), [os.path.join(VENV, "bin", "python")] + sys.argv)

import numpy as np


def fotograma(ff, video, t):
    """Fotograma en grises de 320x180 (sirve para medir, no para ver)."""
    r = subprocess.run([ff, "-v", "error", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf", "scale=320:180,format=gray", "-f", "rawvideo", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.uint8).reshape(180, 320).astype(np.float32) if len(r.stdout) == 320 * 180 else None


def tomas(ff, video):
    """Parte el vídeo por cortes de plano y puntúa cada toma para el recorte vertical."""
    r = subprocess.run([ff, "-hide_banner", "-i", video, "-vf", "select='gt(scene,0.3)',showinfo", "-f", "null", "-"], capture_output=True, text=True)
    cortes = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).strip())
    limites = [0.0] + [c for c in cortes if c > 0.3] + [dur]
    salida = []
    for a, z in zip(limites, limites[1:]):
        if z - a < 0.8:
            continue
        g = fotograma(ff, video, a + (z - a) * 0.4)
        if g is None:
            continue
        ancho = int(180 * 9 / 16)
        detalle = np.abs(np.diff(g, axis=0))[:, :-1] + np.abs(np.diff(g, axis=1))[:-1, :]
        # dónde está lo interesante: la ventana vertical con más detalle
        acum = detalle.sum(axis=0)
        ventanas = np.convolve(acum, np.ones(ancho), mode="valid")
        x = int(np.argmax(ventanas))
        centro = (320 - ancho) // 2
        if ventanas[x] < ventanas[centro] * 1.4:  # el centro gana salvo que el lado sea claramente mejor (rótulos y bordes engañan)
            x = centro
        foco = round(100 * x / max(1, 320 - ancho))
        parte = g[:, x : x + ancho]
        brillo, contraste = float(parte.mean()), float(parte.std())
        puntos = round(float(ventanas[x]) / (ancho * 180) * (0.4 if brillo < 25 or brillo > 235 or contraste < 15 else 1), 1)
        salida.append({"desde": round(a + 0.2, 2), "hasta": round(z, 2), "foco": f"{foco}% 50%", "brillo": round(brillo), "contraste": round(contraste), "puntos": puntos})
    return sorted(salida, key=lambda t: -t["puntos"])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("original")
    ap.add_argument("nombre")
    ap.add_argument("--fuente", required=True)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--desde", type=float)
    ap.add_argument("--dur", type=float)
    ap.add_argument("--paneo", action="store_true", help="foto: recorre la imagen de izquierda a derecha en vez de acercarse")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    if not os.path.exists(a.original):
        sys.exit(f"No encuentro {a.original}")
    try:
        ff = json.load(open(os.path.join(proy, "entorno.json"), encoding="utf-8")).get("ffmpeg") or "ffmpeg"
    except OSError:
        ff = "ffmpeg"
    for d in ("public/videos", "salida/recursos"):
        os.makedirs(os.path.join(proy, d), exist_ok=True)
    video = os.path.join(proy, "public", "videos", a.nombre + ".mp4")
    if a.original.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        # una foto se convierte en un clip con un acercamiento lento, para que no se quede quieta
        s_ = a.dur or 6
        marcos = int(s_ * 30)
        x = f"(iw-iw/zoom)*on/{marcos}" if a.paneo else "iw/2-(iw/zoom/2)"
        zoom = "1.3" if a.paneo else f"1+0.12*on/{marcos}"
        z = f"zoompan=z='{zoom}':x='{x}':y='ih/2-(ih/zoom/2)':d={marcos}:s=1920x1080:fps=30"
        subprocess.check_call([ff, "-v", "error", "-y", "-i", a.original, "-vf", f"scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,{z},format=yuv420p",
                               "-frames:v", str(marcos), "-c:v", "libx264", "-crf", "20", "-preset", "fast", video])
    else:
        corte = (["-ss", str(a.desde)] if a.desde is not None else []) + (["-t", str(a.dur)] if a.dur is not None else [])
        subprocess.check_call([ff, "-v", "error", "-y", *corte, "-i", a.original, "-an", "-vf", "scale=1920:-2:flags=lanczos,fps=30,format=yuv420p",
                               "-c:v", "libx264", "-crf", "20", "-preset", "fast", video])
    hoja = os.path.join(proy, "salida", "recursos", a.nombre + ".jpg")
    subprocess.check_call([ff, "-v", "error", "-y", "-i", video, "-vf", "fps=1,crop=ih*9/16:ih,scale=130:-2,tile=14x6", "-frames:v", "1", hoja])
    lista = tomas(ff, video)
    json.dump(lista, open(os.path.join(proy, "salida", "recursos", a.nombre + ".json"), "w", encoding="utf-8"), indent=1)
    with open(os.path.join(proy, "salida", "FUENTES.md"), "a", encoding="utf-8") as f:
        f.write(f"- `videos/{a.nombre}.mp4`: {a.fuente}\n")
    print(f"→ {video}\n→ hoja para elegir tomas: {hoja}\n→ fuente anotada en salida/FUENTES.md")
    print(f"→ {len(lista)} tomas, de mejor a peor (desde, foco): " + " · ".join(f"{t['desde']} s {t['foco']}" for t in lista[:5]))


if __name__ == "__main__":
    main()
