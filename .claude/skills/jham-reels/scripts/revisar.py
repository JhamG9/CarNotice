"""Revisa el vídeo terminado sin que nadie tenga que mirarlo: pantallas vacías, volumen y si la voz se entiende.

Uso: python revisar.py --proyecto ~/reel [--video salida/reel.mp4]

Comprueba cada escena (fotograma vacío o demasiado oscuro), el volumen (LUFS y picos), la duración, el peso y, con
Whisper sobre la mezcla final, que la voz se entienda encima de la música. Escribe salida/revision.json.
No sustituye a escuchar y ver el vídeo: no sabe si gusta. Termina con código 1 si encuentra algo.
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

VENV = os.path.expanduser("~/.cache/jham-reels/venv")
if os.path.abspath(sys.prefix) != VENV:
    os.execv(os.path.join(VENV, "bin", "python"), [os.path.join(VENV, "bin", "python")] + sys.argv)

import mlx_whisper
import numpy as np

PESO_MAX = 30


def plano(t):
    t = unicodedata.normalize("NFD", t.replace("*", "").lower())
    return re.sub(r"[^a-z0-9 ]+", " ", "".join(c for c in t if unicodedata.category(c) != "Mn")).split()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--video", default="salida/reel.mp4")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    video = os.path.join(proy, a.video)
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    tiempos = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8"))
    fallos = []
    for k, fr in enumerate(tiempos["frases"], start=1):
        for p in (0.25, 0.75):
            t = fr["inicio"] + (fr["fin"] - fr["inicio"]) * p
            r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf", "scale=108:192,format=gray", "-f", "rawvideo", "-"], capture_output=True)
            if len(r.stdout) != 108 * 192:
                continue
            g = np.frombuffer(r.stdout, dtype=np.uint8).reshape(192, 108)[:120].astype(np.float32)  # la parte alta: abajo van los subtítulos
            if g.std() < 8:
                fallos.append(f"Frase {k} ({t:.1f} s): pantalla casi vacía.")
            elif (g > 40).mean() < 0.02:  # una nube de puntos es oscura pero tiene detalle: esa no cuenta
                fallos.append(f"Frase {k} ({t:.1f} s): imagen casi negra.")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[0-9.]+) LUFS", r)
    pico = re.findall(r"Peak:\s+(-?[0-9.]+) dBFS", r)
    lufs = float(i[-1]) if i else None
    pico = float(pico[-1]) if pico else None
    if lufs is not None and not -18 <= lufs <= -10:
        fallos.append(f"Volumen {lufs} LUFS (lo normal en reels: de -18 a -10).")
    if pico is not None and pico > -0.5:
        fallos.append(f"Picos de {pico} dBFS: puede saturar.")
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).strip())
    if abs(dur - tiempos["duracion"]) > 0.5:
        fallos.append(f"El vídeo dura {dur:.1f} s y debería durar {tiempos['duracion']:.1f} s.")
    peso = os.path.getsize(video) / 1e6
    if peso > PESO_MAX:
        fallos.append(f"Pesa {peso:.0f} MB (más de {PESO_MAX}).")
    oido = mlx_whisper.transcribe(video, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es")["text"]
    texto = " ".join(f["texto"] for f in plan["frases"])
    voz_clara = difflib.SequenceMatcher(None, plano(texto), plano(oido)).ratio()
    if voz_clara < 0.8:
        fallos.append(f"La voz se entiende poco sobre la música: Whisper coincide en un {voz_clara:.0%}.")
    informe = {"duracion": round(dur, 2), "peso_mb": round(peso, 1), "lufs": lufs, "pico_db": pico, "voz_entendida": round(voz_clara, 3), "fallos": fallos}
    json.dump(informe, open(os.path.join(proy, "salida", "revision.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{dur:.1f} s · {peso:.1f} MB · {lufs} LUFS · pico {pico} dB · voz entendida {voz_clara:.0%}")
    for x in fallos:
        print(f"  - {x}")
    print("Sin fallos." if not fallos else f"{len(fallos)} fallos.")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
