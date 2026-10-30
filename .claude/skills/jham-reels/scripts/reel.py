"""Hace todo lo que el equipo puede hacer solo, de principio a fin, y deja un informe.

Uso:
  python3 reel.py --proyecto ~/reel --hasta fotos     voz, alineado, música, resumen y hoja (para revisar la hoja)
  python3 reel.py --proyecto ~/reel                   lo anterior y además vídeo, ritmo, portada, revisión y textos
Opciones: --audio voz.mp3 (usa ese audio en vez de generar la voz), --borrador (media resolución), --sin-musica.

Cada paso deja su salida en salida/reel.log y aquí solo sale una línea. Se puede relanzar: lo que está hecho no se repite.
Se para si el plan tiene PROBLEMAS. El resultado queda en salida/informe.md.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
PY = os.path.expanduser("~/.cache/jham-reels/venv/bin/python")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--hasta", choices=["fotos", "todo"], default="todo")
    ap.add_argument("--audio")
    ap.add_argument("--borrador", action="store_true")
    ap.add_argument("--sin-musica", action="store_true")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    os.makedirs(os.path.join(proy, "salida"), exist_ok=True)
    log = open(os.path.join(proy, "salida", "reel.log"), "a", encoding="utf-8")
    informe = []
    t0 = time.time()

    def paso(nombre, cmd, parar=True):
        t = time.time()
        r = subprocess.run(cmd, cwd=proy, capture_output=True, text=True)
        salida = (r.stdout or "") + (r.stderr or "")
        log.write(f"\n===== {nombre} =====\n{salida}\n")
        log.flush()
        print(f"{'ok ' if r.returncode == 0 else 'OJO'} {nombre} ({time.time() - t:.0f} s)", flush=True)
        if r.returncode and parar:
            print(salida[-1500:])
            sys.exit(f"Paró en «{nombre}». Todo está en salida/reel.log")
        return salida, r.returncode

    if not os.path.exists(PY):
        paso("entorno", [sys.executable, os.path.join(AQUI, "voz_local.py"), "--entorno"])
    paso("pronunciación y frases sensibles", [PY, os.path.join(AQUI, "pronunciacion.py"), "--proyecto", proy])
    if a.audio:
        s, _ = paso("alinear audio", [PY, os.path.join(AQUI, "alinear.py"), os.path.abspath(a.audio), "--proyecto", proy])
    else:
        s, _ = paso("voz", [PY, os.path.join(AQUI, "voz_local.py"), "--proyecto", proy])
        i = s.find("Comprobación")
        informe.append("## Voz\n```\n" + s[i:s.find("voz unida", i)].strip() + "\n```")
    avisos = [l for l in s.splitlines() if l.startswith("AVISO")]
    if avisos:
        informe.append("## Avisos del alineado\n" + "\n".join(f"- {x}" for x in avisos))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    if not a.sin_musica and plan.get("musica") is not False:
        s, _ = paso("música", [PY, os.path.join(AQUI, "musica.py"), "--proyecto", proy])
        informe.append("## Música\n" + s.strip())
    s, _ = paso("resumen", ["node", "render.mjs", "resumen"])
    if "PROBLEMAS (" in s:
        print(s[s.find("PROBLEMAS ("):])
        sys.exit("El plan tiene problemas: corrígelos y vuelve a lanzarlo.")
    if "AVISOS (" in s:
        informe.append("## Avisos del plan\n" + s[s.find("AVISOS ("):].strip())
    paso("hoja de contacto", ["node", "render.mjs", "fotos"])
    if a.hasta == "fotos":
        informe.append("Falta revisar `salida/hoja.png` y lanzar el vídeo.")
    else:
        extra = ["--borrador"] if a.borrador else []
        for _ in range(8):  # render.mjs para solo antes del límite de tiempo y sigue al relanzarlo
            s, _r = paso("vídeo", ["node", "render.mjs", "video", *extra])
            if "PARCIAL" not in s:
                break
        video = "salida/borrador.mp4" if a.borrador else "salida/reel.mp4"
        s, c = paso("ritmo", [PY, os.path.join(AQUI, "ritmo.py"), video, "--tiempos", "src/datos/tiempos.json"], parar=False)
        informe.append("## Ritmo\n" + s.strip())
        paso("portada", ["node", "render.mjs", "portada"])
        s, c = paso("revisión del vídeo", [PY, os.path.join(AQUI, "revisar.py"), "--proyecto", proy, "--video", video], parar=False)
        informe.append("## Revisión del vídeo\n" + "\n".join(l for l in s.strip().splitlines() if "Fetching" not in l))
        frases = plan["frases"]
        limpio = lambda t: re.sub(r"\s+", " ", t.replace("*", "")).strip()
        fuentes = os.path.join(proy, "salida", "FUENTES.md")
        lista = open(fuentes, encoding="utf-8").read() if os.path.exists(fuentes) else ""
        with open(os.path.join(proy, "salida", "publicar.txt"), "w", encoding="utf-8") as f:
            f.write(f"{limpio(frases[0]['texto'])}\n\n{limpio(frases[-1]['texto'])}\n\nFuentes:\n{lista}")
    with open(os.path.join(proy, "salida", "informe.md"), "w", encoding="utf-8") as f:
        f.write(f"# Informe de {plan.get('titulo', 'reel')} ({time.time() - t0:.0f} s)\n\n" + "\n\n".join(informe) + "\n")
    print(f"LISTO en {time.time() - t0:.0f} s → salida/informe.md")


if __name__ == "__main__":
    main()
