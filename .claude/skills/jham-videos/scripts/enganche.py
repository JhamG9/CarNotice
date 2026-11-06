"""Revisa el enganche de un vídeo largo con los tiempos reales de la voz (references/noticia.md).

Uso:
  python3 enganche.py --proyecto ~/video          imprime las métricas y los AVISOS; sale con 0 aunque haya avisos

Mide:
- cuánto del vídeo es vídeo en movimiento (Clips con "video") y cuánto es imagen real (vídeo o foto);
- los tramos sin un «golpe» (cifra que sorprende, pregunta, tachado, comparación o un capítulo nuevo);
- las escenas que se quedan iguales demasiado rato;
- que el gancho sea imagen real.
Con "formato": "noticia" en el plan las reglas son las del formato noticia; si no, las de un vídeo explicativo.
"""
import argparse
import json
import os

GOLPES = {"contador", "cifras", "barras", "pregunta", "tachado", "comparacion", "objecion"}
REGLAS = {
    "noticia": {"video": 0.66, "real": 0.8, "golpe": 40, "escena": 20},
    "explicativo": {"video": 0.0, "real": 0.33, "golpe": 60, "escena": 25},
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
        if tipo(e) in GOLPES or f.get("capitulo"):
            hueco = t["inicio"] - ultimo_golpe
            if hueco > tramo_max[0]:
                tramo_max = (hueco, ultimo_golpe, t["inicio"])
            ultimo_golpe = t["inicio"]
        # una escena larga con una sola toma se ve quieta
        tomas = max(1, len(clips)) if clips else max(1, len(e.get("en", [])))
        if dur / tomas > r["escena"]:
            avisos.append(f"Frase {i + 1} ({tipo(e)}): {dur:.0f} s con {tomas} toma(s). Pártela en más tomas o frases.")
    hueco = tiempos[-1]["fin"] - ultimo_golpe
    if hueco > tramo_max[0]:
        tramo_max = (hueco, ultimo_golpe, tiempos[-1]["fin"])
    pv, pr = seg_video / total, seg_real / total
    if pv < r["video"]:
        avisos.append(f"Vídeo en movimiento: {pv:.0%} del tiempo (el formato {formato} pide {r['video']:.0%}). Cambia tarjetas y fotos por Clips con vídeo.")
    if pr < r["real"]:
        avisos.append(f"Imagen real (vídeo o foto): {pr:.0%} del tiempo (pide {r['real']:.0%}).")
    if tramo_max[0] > r["golpe"]:
        avisos.append(
            f"De {tramo_max[1]:.0f} s a {tramo_max[2]:.0f} s pasan {tramo_max[0]:.0f} s sin un golpe (cifra, pregunta, tachado o comparación): pon uno cada {r['golpe']} s como mucho."
        )
    primera = plan["frases"][0]["escena"]
    if formato == "noticia" and not (tipo(primera) == "Clips" and any(c.get("video") for c in primera.get("clips", []))):
        avisos.append("El gancho del formato noticia debe ser vídeo con el titular encima (Clips con video y lineas).")
    print(f"Formato: {formato} · {total / 60:.1f} min · vídeo en movimiento {pv:.0%} · imagen real {pr:.0%} · tramo más largo sin golpe {tramo_max[0]:.0f} s")
    for x in avisos:
        print(f"AVISO: {x}")
    if not avisos:
        print("OK: el enganche cumple las reglas del formato.")


if __name__ == "__main__":
    main()
