"""Capítulos de YouTube a partir del plan y de los tiempos de la voz.

Uso:
  python3 capitulos.py --proyecto ~/video          escribe salida/capitulos.txt y avisa si no cumplen las reglas

Cada frase que abre un capítulo lleva "capitulo": "Nombre" en el plan. El primero empieza en 0:00 aunque la voz
arranque un poco después. Reglas de YouTube para que se vean: el primero en 0:00, al menos 3 y cada uno de 10 s o más.
Sale con código 1 si no se cumplen.
"""
import argparse
import json
import os
import sys


def marca(s):
    s = int(s)
    h, m, x = s // 3600, (s % 3600) // 60, s % 60
    return f"{h}:{m:02d}:{x:02d}" if h else f"{m}:{x:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--proyecto", default=".")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    tiempos = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8"))
    frases_t = tiempos["frases"]
    if len(frases_t) != len(plan["frases"]):
        sys.exit("Los tiempos no corresponden al plan: vuelve a alinear la voz.")
    caps = []
    for i, f in enumerate(plan["frases"]):
        if f.get("capitulo"):
            caps.append([0.0 if not caps else frases_t[i]["inicio"], f["capitulo"].strip()])
    if caps and plan["frases"][0].get("capitulo") is None:
        caps.insert(0, [0.0, plan.get("capituloInicial", "Introducción")])
    problemas = []
    if len(caps) < 3:
        problemas.append(f"Hay {len(caps)} capítulos: YouTube pide al menos 3 (marca \"capitulo\" en más frases).")
    fin = tiempos["duracion"]
    for k, (ini, nombre) in enumerate(caps):
        sig = caps[k + 1][0] if k + 1 < len(caps) else fin
        if sig - ini < 10:
            problemas.append(f"«{nombre}» dura {sig - ini:.1f} s: cada capítulo debe durar 10 s o más.")
    texto = "\n".join(f"{marca(ini)} {nombre}" for ini, nombre in caps)
    os.makedirs(os.path.join(proy, "salida"), exist_ok=True)
    open(os.path.join(proy, "salida", "capitulos.txt"), "w", encoding="utf-8").write(texto + "\n")
    print(texto)
    if problemas:
        print("\n".join(f"PROBLEMA: {p}" for p in problemas))
        sys.exit(1)
    print(f"OK: {len(caps)} capítulos en salida/capitulos.txt")


if __name__ == "__main__":
    main()
