"""Deja respirar el vídeo: mete un silencio en la voz antes de cada capítulo y corre los tiempos.

Uso: python pausas.py --proyecto ~/video      (después de alinear la voz y antes de la música)

En un vídeo largo cada capítulo es un bloque nuevo: una pausa corta antes de empezarlo ayuda a cerrar el anterior y
a que la gente asimile lo que oyó. La pausa la marca "pausaCapitulo" en el plan (segundos, por defecto 1,2; 0 la
quita) y se pone en public/voz.wav y en src/datos/tiempos.json. Se puede relanzar: si ya se puso, no la repite.
"""
import argparse
import json
import os
import wave

import numpy as np


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    ruta_t = os.path.join(proy, "src", "datos", "tiempos.json")
    t = json.load(open(ruta_t, encoding="utf-8"))
    if t.get("pausas"):
        print("pausas: ya estaban puestas")
        return
    pausa = float(plan.get("pausaCapitulo", 1.2))
    caps = [i for i, f in enumerate(plan["frases"]) if f.get("capitulo") and i > 0]
    if not pausa or not caps:
        print("pausas: ninguna")
        return
    ruta_v = os.path.join(proy, "public", "voz.wav")
    with wave.open(ruta_v) as w:
        params = w.getparams()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, params.nchannels)
    sr = params.framerate
    frases = t["frases"]
    # el silencio va justo después de la frase que cierra el capítulo anterior
    puntos = sorted((frases[i - 1]["fin"] + 0.05, i) for i in caps)
    trozos, prev = [], 0
    for seg, _ in puntos:
        k = min(len(x), int(seg * sr))
        trozos += [x[prev:k], np.zeros((int(pausa * sr), params.nchannels), dtype=np.int16)]
        prev = k
    trozos.append(x[prev:])
    with wave.open(ruta_v, "w") as w:
        w.setparams(params)
        w.writeframes(np.concatenate(trozos).tobytes())

    def correr(s):
        return round(s + pausa * sum(1 for seg, _ in puntos if s >= seg), 3)

    for f in frases:
        f["inicio"], f["fin"] = correr(f["inicio"]), correr(f["fin"])
        for p in f.get("palabras", []):
            p["t"] = correr(p["t"])
    t["duracion"] = round(t["duracion"] + pausa * len(puntos), 3)
    t["pausas"] = pausa
    json.dump(t, open(ruta_t, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"pausas: {len(puntos)} de {pausa:g} s antes de los capítulos · duración {t['duracion']:.1f} s")


if __name__ == "__main__":
    main()
