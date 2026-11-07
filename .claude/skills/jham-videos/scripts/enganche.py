"""Revisa el enganche de un vídeo largo con los tiempos reales de la voz (references/noticia.md).

Uso:
  python3 enganche.py --proyecto ~/video          imprime las métricas y los AVISOS; sale con 0 aunque haya avisos

Mide:
- cuánto del vídeo es vídeo en movimiento (Clips con "video") y cuánto es imagen real (vídeo o foto);
- los tramos sin un «golpe» (cifra que sorprende, pregunta, tachado, comparación, un capítulo nuevo o una frase con "golpe": true);
- cuántas frases ponen texto grande en pantalla (tarjetas o "lineas" sobre el vídeo) y cuántas etiquetas llevan los clips;
- las escenas que se quedan iguales demasiado rato;
- que el gancho sea imagen real.
Con "formato": "noticia" en el plan las reglas son las del formato noticia; si no, las de un vídeo explicativo.
"""
import argparse
import json
import os

GOLPES = {"contador", "cifras", "barras", "pregunta", "tachado", "comparacion", "objecion"}
REGLAS = {
    "noticia": {"video": 0.66, "real": 0.8, "golpe": 40, "escena": 20, "toma": 4.5},
    "explicativo": {"video": 0.0, "real": 0.33, "golpe": 60, "escena": 25, "toma": 6.0},
}


def tipo(escena):
    return escena.get("nombre", escena.get("tipo")) if escena.get("tipo") == "propia" else escena.get("tipo")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--proyecto", default=".")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    tiempos = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8"))["frases"]
    if len(tiempos) != len(plan["frases"]):
        raise SystemExit("Los tiempos no corresponden al plan: alinea la voz (o --sin-voz) antes.")
    formato = plan.get("formato", "explicativo")
    r = REGLAS.get(formato, REGLAS["explicativo"])
    total = tiempos[-1]["fin"] - tiempos[0]["inicio"]
    seg_video = seg_real = 0.0
    avisos = []
    ultimo_golpe = 0.0
    tramo_max = (0.0, 0.0, 0.0)
    n_tomas = 0
    textos, pildoras = [], 0  # frases con texto grande (tarjeta o título sobre el vídeo) fuera del gancho
    for i, (f, t) in enumerate(zip(plan["frases"], tiempos)):
        e = f["escena"]
        dur = t["fin"] - t["inicio"]
        clips = e.get("clips", []) if tipo(e) == "Clips" else []
        con_video = sum(1 for c in clips if c.get("video"))
        if clips:
            seg_video += dur * con_video / len(clips)
            seg_real += dur
        elif tipo(e) in ("imagen", "galeria"):
            seg_real += dur
        con_lineas = tipo(e) == "Clips" and bool(e.get("lineas"))
        pildoras += sum(1 for c in clips if c.get("texto"))
        if i > 0 and (not clips and tipo(e) not in ("imagen", "galeria", "cta") or con_lineas):
            textos.append(i + 1)
        if tipo(e) in GOLPES or f.get("capitulo") or f.get("golpe"):
            hueco = t["inicio"] - ultimo_golpe
            if hueco > tramo_max[0]:
                tramo_max = (hueco, ultimo_golpe, t["inicio"])
            ultimo_golpe = t["inicio"]
        # una escena larga con una sola toma se ve quieta
        tomas = max(1, len(clips)) if clips else max(1, len(e.get("en", [])))
        n_tomas += max(1, len(clips))
        if dur / tomas > r["escena"]:
            avisos.append(f"Frase {i + 1} ({tipo(e)}): {dur:.0f} s con {tomas} toma(s). Pártela en más tomas o frases.")
    hueco = tiempos[-1]["fin"] - ultimo_golpe
    if hueco > tramo_max[0]:
        tramo_max = (hueco, ultimo_golpe, tiempos[-1]["fin"])
    pv, pr = seg_video / total, seg_real / total
    toma = total / max(1, n_tomas)
    # un vídeo de referencia de carros (5 min, voz humana) corta cada 2,2 s: con menos de una toma cada 4–6 s se ve quieto
    if toma > r["toma"]:
        avisos.append(f"Una toma cada {toma:.1f} s de media (pide {r['toma']:g} s o menos). Añade clips a las escenas largas.")
    if pv < r["video"]:
        avisos.append(f"Vídeo en movimiento: {pv:.0%} del tiempo (el formato {formato} pide {r['video']:.0%}). Cambia tarjetas y fotos por Clips con vídeo.")
    if pr < r["real"]:
        avisos.append(f"Imagen real (vídeo o foto): {pr:.0%} del tiempo (pide {r['real']:.0%}).")
    if tramo_max[0] > r["golpe"]:
        avisos.append(
            f"De {tramo_max[1]:.0f} s a {tramo_max[2]:.0f} s pasan {tramo_max[0]:.0f} s sin un golpe (cifra, pregunta, tachado o comparación): pon uno cada {r['golpe']} s como mucho."
        )
    # casi todo imagen: texto grande solo en el gancho y en 3–5 golpes (5 hasta 10 min, 7 en vídeos más largos)
    limite = 5 if total <= 600 else 7
    if len(textos) > limite:
        avisos.append(
            f"{len(textos)} frases con texto grande en pantalla (tarjetas o «lineas» sobre el vídeo): {', '.join(map(str, textos))}. "
            f"Deja {limite} como mucho, solo las cifras clave de la historia; el resto lo cuenta la voz sobre el vídeo."
        )
    if pildoras > total / 15:
        avisos.append(f"{pildoras} etiquetas «texto» en los clips: una cada {total / max(1, pildoras):.0f} s. Úsalas solo para nombrar lo que se ve (marca o modelo), una cada 15 s como mucho.")
    primera = plan["frases"][0]["escena"]
    if formato == "noticia" and not (tipo(primera) == "Clips" and any(c.get("video") for c in primera.get("clips", []))):
        avisos.append("El gancho del formato noticia debe ser vídeo con el titular encima (Clips con video y lineas).")
    if total < 480:
        avisos.insert(0, f"PROBLEMA: dura {total / 60:.1f} min y el mínimo son 8 (anuncios intermedios de YouTube). Añade capítulos con datos y fuente.")
    print(f"Formato: {formato} · {total / 60:.1f} min · vídeo en movimiento {pv:.0%} · imagen real {pr:.0%} · tramo más largo sin golpe {tramo_max[0]:.0f} s · una toma cada {toma:.1f} s · texto grande en {len(textos)} frases")
    for x in avisos:
        print(f"AVISO: {x}")
    if not avisos:
        print("OK: el enganche cumple las reglas del formato.")


if __name__ == "__main__":
    main()
