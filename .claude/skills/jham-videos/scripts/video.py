"""Hace todo lo que el equipo puede hacer solo con un vídeo largo, de principio a fin, y deja un informe.

Uso:
  python3 video.py --proyecto ~/video --hasta fotos     voz, alineado, música, resumen y hoja (para revisar la hoja)
  python3 video.py --proyecto ~/video                   lo anterior y además vídeo, ritmo, portada, revisión, capítulos y textos
Opciones: --audio voz.mp3 (usa ese audio en vez de generar la voz), --borrador (media resolución), --sin-musica.

Usa los scripts de jham-reels (voz, alineado, música, ritmo, revisión). Un vídeo de 8 min tarda unos 40 min en
renderizar: lánzalo en segundo plano. Se puede relanzar: lo que está hecho no se repite.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

DURACION_MIN = 480  # 8 min: mínimo para anuncios intermedios de YouTube (decisión del 2026-11-07)
PALABRAS_POR_SEGUNDO = 2.6  # medido en el primer vídeo: 836 palabras = 319 s con pausas
AQUI = os.path.dirname(os.path.abspath(__file__))
REELS = os.path.join(os.path.dirname(os.path.dirname(AQUI)), "jham-reels", "scripts")
PY = os.path.expanduser("~/.cache/jham-reels/venv/bin/python")
HUECO = "1.5"  # en un vídeo largo una escena puede respirar más que en un reel, pero nada quieto más de 1,5 s


def escribir_srt(proy, max_palabras=10):
    """salida/subtitulos.srt con los tiempos de la voz, para subirlo a YouTube como subtítulos (CC) del vídeo."""
    t = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8"))
    hms = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
    bloques = []
    for f in t["frases"]:
        pal = f.get("palabras") or []
        if not pal:
            bloques.append((f["inicio"], f["fin"], f["texto"]))
            continue
        for k in range(0, len(pal), max_palabras):
            grupo = pal[k : k + max_palabras]
            fin = pal[k + max_palabras]["t"] if k + max_palabras < len(pal) else f["fin"]
            bloques.append((grupo[0]["t"], fin, " ".join(p["w"] for p in grupo)))
    with open(os.path.join(proy, "salida", "subtitulos.srt"), "w", encoding="utf-8") as out:
        for n, (a, z, texto) in enumerate(bloques, 1):
            out.write(f"{n}\n{hms(a)} --> {hms(max(z, a + 0.5))}\n{texto.replace('*', '').strip()}\n\n")


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
    log = open(os.path.join(proy, "salida", "video.log"), "a", encoding="utf-8")
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
            sys.exit(f"Paró en «{nombre}». Todo está en salida/video.log")
        return salida, r.returncode

    # mínimo de 8 minutos, sin excepción: desde ahí YouTube deja poner anuncios en medio (la prioridad es monetizar).
    # Se mira antes de la voz (por palabras, ~2,6 por segundo con las pausas) para no gastar en un guion corto.
    p_min = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    palabras = sum(len(re.sub(r"[*/]", " ", fr["texto"]).split()) for fr in p_min["frases"])
    if palabras / PALABRAS_POR_SEGUNDO < DURACION_MIN:
        falta = int(DURACION_MIN * PALABRAS_POR_SEGUNDO - palabras) + 1
        sys.exit(f"El guion tiene {palabras} palabras, unos {palabras / PALABRAS_POR_SEGUNDO / 60:.1f} min: el mínimo son "
                 f"{DURACION_MIN // 60} min (unas {int(DURACION_MIN * PALABRAS_POR_SEGUNDO)} palabras). Faltan unas {falta}: "
                 "añade capítulos con datos y fuente (references/guion-largo.md), no estires las frases.")
    if not os.path.exists(PY):
        paso("entorno", [sys.executable, os.path.join(REELS, "voz_local.py"), "--entorno"])
    paso("pronunciación y frases sensibles", [PY, os.path.join(REELS, "pronunciacion.py"), "--proyecto", proy])
    if a.audio:
        s, _ = paso("alinear audio", [PY, os.path.join(REELS, "alinear.py"), os.path.abspath(a.audio), "--proyecto", proy])
    else:
        # voz más calmada que la de los reels: menos exageración y algo más de aire entre frases
        p0 = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
        s, _ = paso("voz", [PY, os.path.join(REELS, "voz_local.py"), "--proyecto", proy,
                            "--exageracion", str(p0.get("exageracion", 0.55)), "--pausa", str(p0.get("pausaFrases", 0.6))])
        i = s.find("Comprobación")
        informe.append("## Voz\n```\n" + s[i:s.find("voz unida", i)].strip() + "\n```")
    avisos = [l for l in s.splitlines() if l.startswith("AVISO")]
    if avisos:
        informe.append("## Avisos del alineado\n" + "\n".join(f"- {x}" for x in avisos))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    s, _ = paso("pausas entre capítulos", [PY, os.path.join(AQUI, "pausas.py"), "--proyecto", proy])
    informe.append("## Pausas\n" + s.strip())
    dur = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8")).get("duracion", 0)
    if dur < DURACION_MIN:
        sys.exit(f"Con la voz, el vídeo dura {dur / 60:.1f} min: el mínimo son {DURACION_MIN // 60} min. "
                 "Añade un capítulo con datos y fuente y vuelve a lanzar (la voz ya hecha no se repite).")
    if not a.sin_musica and plan.get("musica") is not False:
        # por defecto la música tranquila de vídeo largo; "musica": {"estilo": "reel"} usa la rápida de los reels
        rapida = isinstance(plan.get("musica"), dict) and plan["musica"].get("estilo") == "reel"
        script = os.path.join(REELS, "musica.py") if rapida else os.path.join(AQUI, "musica_fondo.py")
        s, _ = paso("música", [PY, script, "--proyecto", proy])
        informe.append("## Música\n" + s.strip())
    s, c = paso("capítulos", [sys.executable, os.path.join(AQUI, "capitulos.py"), "--proyecto", proy], parar=False)
    informe.append("## Capítulos\n```\n" + s.strip() + "\n```")
    s, _ = paso("enganche", [sys.executable, os.path.join(AQUI, "enganche.py"), "--proyecto", proy], parar=False)
    informe.append("## Enganche\n" + s.strip())
    print(s.strip())
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
        for _ in range(80):  # render.mjs para solo antes del límite de tiempo y sigue al relanzarlo
            # al parar a medias sale con código de error: eso no es un fallo, se relanza y sigue donde iba
            s, r = paso("vídeo", ["node", "render.mjs", "video", *extra], parar=False)
            if "PARCIAL" in s:
                continue
            if r:
                print(s[-1500:])
                sys.exit("Paró en «vídeo». Todo está en salida/video.log")
            break
        video = "salida/borrador.mp4" if a.borrador else "salida/video.mp4"
        # sin subtítulos en pantalla, las palabras ya no cuentan como movimiento: una toma de unos 3 s (como en los
        # vídeos largos de referencia, que cortan cada 2–3 s) no es un hueco
        hueco = HUECO if plan.get("subtitulos", "linea") != "no" else "3.0"
        s, c = paso("ritmo", [PY, os.path.join(REELS, "ritmo.py"), video, "--tiempos", "src/datos/tiempos.json", "--hueco", hueco], parar=False)
        informe.append("## Ritmo\n" + s.strip())
        paso("portada", ["node", "render.mjs", "portada"])
        s, c = paso("revisión del vídeo", [PY, os.path.join(REELS, "revisar.py"), "--proyecto", proy, "--video", video], parar=False)
        informe.append("## Revisión del vídeo\n" + "\n".join(l for l in s.strip().splitlines() if "Fetching" not in l))
        # Borrador de los textos para YouTube: título, descripción con capítulos y fuentes
        limpio = lambda t: re.sub(r"\s+", " ", t.replace("*", "")).strip()
        yt = plan.get("youtube", {})
        caps = os.path.join(proy, "salida", "capitulos.txt")
        fuentes = os.path.join(proy, "salida", "FUENTES.md")
        desc = f"{yt.get('descripcion', limpio(plan['frases'][0]['texto']))}\n\n"
        if yt.get("enlace"):
            desc += f"Más detalles y fuentes: {yt['enlace']}\n\n"
        if os.path.exists(caps):
            desc += "Capítulos\n" + open(caps, encoding="utf-8").read() + "\n"
        # Las fuentes de la descripción salen de "youtube.fuentes" del plan ([nombre, url]); FUENTES.md es el registro de
        # trabajo (descargas, permisos) y no se pega tal cual: traería archivos que no se usaron.
        if yt.get("fuentes"):
            desc += "Fuentes\n" + "".join(f"- {n}: {u}\n" for n, u in yt["fuentes"])
        else:
            informe.append("## Descripción\nFalta \"youtube.fuentes\" en el plan: la descripción sale sin fuentes. Añádelas ([nombre, url]) y relanza.")
        # descripcion.txt va tal cual a publicar-video.mjs; youtube.txt lleva además el título, para revisarlo
        open(os.path.join(proy, "salida", "descripcion.txt"), "w", encoding="utf-8").write(desc)
        with open(os.path.join(proy, "salida", "youtube.txt"), "w", encoding="utf-8") as f:
            f.write(f"TÍTULO\n{yt.get('titulo', plan.get('titulo', ''))}\n\nCATEGORÍA\n{yt.get('categoria', '26')}\n\nDESCRIPCIÓN\n{desc}")
    escribir_srt(proy)
    with open(os.path.join(proy, "salida", "informe.md"), "w", encoding="utf-8") as f:
        f.write(f"# Informe de {plan.get('titulo', 'vídeo')} ({time.time() - t0:.0f} s)\n\n" + "\n\n".join(informe) + "\n")
    print(f"LISTO en {time.time() - t0:.0f} s → salida/informe.md")


if __name__ == "__main__":
    main()
