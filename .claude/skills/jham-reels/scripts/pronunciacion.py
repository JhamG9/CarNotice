"""Rellena el plan sin ayuda: escribe "voz" a partir de "texto" y marca las frases sensibles.

Uso: python pronunciacion.py --proyecto ~/reel

- Cifras a palabras (20.000 → veinte mil, 3,2 → tres coma dos, 80 % → ochenta por ciento).
- Nombres y siglas según assets/voz/pronunciacion.json (LiDAR → láidar). Añade ahí los nuevos.
- "sensible": true si la frase habla de muertes, accidentes o enfermedad (la música no hará ahí su subida).
No toca el "voz" ni el "sensible" que ya existan, ni el "texto". Avisa de las siglas que no conoce.
"""
import argparse
import json
import os
import re

from num2words import num2words

AQUI = os.path.dirname(os.path.abspath(__file__))
DICCIONARIO = os.path.join(os.path.dirname(AQUI), "assets", "voz", "pronunciacion.json")
SENSIBLE = re.compile(r"\b(muert|mortal|fallec|accident|choque|chocó|herid|enfermedad|cáncer|suicid|asesin|violaci|guerra)", re.I)


def numero(s):
    return num2words(int(s), lang="es")


def cifras(t):
    t = re.sub(r"(\d+),(\d+)", lambda m: f"{numero(m[1])} coma {' '.join(numero(c) for c in m[2])}", t)
    t = re.sub(r"\d{1,3}(?:\.\d{3})+", lambda m: numero(m[0].replace(".", "")), t)
    t = re.sub(r"(\d+)\s*%", lambda m: f"{numero(m[1])} por ciento", t)
    t = re.sub(r"(\d+)\s*€", lambda m: f"{numero(m[1])} euros", t)
    t = re.sub(r"\$\s*(\d+)", lambda m: f"{numero(m[1])} dólares", t)
    t = re.sub(r"(\d+)\s*km\b", lambda m: f"{numero(m[1])} kilómetros", t)
    return re.sub(r"\d+", lambda m: numero(m[0]), t)


def a_voz(texto, dic):
    t = texto.replace("*", "")
    for k in sorted(dic, key=len, reverse=True):  # primero los nombres: S05 lleva cifras
        t = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", dic[k], t)
    t = re.sub(r"\s+", " ", cifras(t)).strip()
    return t[:1].upper() + t[1:]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    a = ap.parse_args()
    ruta = os.path.join(os.path.abspath(os.path.expanduser(a.proyecto)), "src", "datos", "plan.json")
    plan = json.load(open(ruta, encoding="utf-8"))
    dic = json.load(open(DICCIONARIO, encoding="utf-8"))
    nuevas, sensibles, raras = 0, [], set()
    for k, fr in enumerate(plan["frases"], start=1):
        if not fr.get("voz"):
            fr["voz"] = a_voz(fr["texto"], dic)
            nuevas += 1
        if "sensible" not in fr and SENSIBLE.search(fr["texto"]):
            fr["sensible"] = True
        if fr.get("sensible"):
            sensibles.append(k)
        raras |= {w for w in re.findall(r"\b[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]{1,}\b", fr["texto"].replace("*", "")) if w not in dic}
    json.dump(plan, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"voz escrita en {nuevas} frases · sensibles: {sensibles or 'ninguna'}")
    if raras:
        print(f"siglas sin pronunciación en el diccionario: {sorted(raras)}")


if __name__ == "__main__":
    main()
