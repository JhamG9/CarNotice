"""Busca y descarga los vídeos e imágenes de una página oficial, sin ayuda.

Uso:
  python3 buscar_recursos.py URL --marca tesla --proyecto ~/reel [--max-videos 6] [--imagenes 6]

Abre la página con el Chrome del equipo (también ve lo que carga JavaScript), baja los vídeos a recursos/MARCA/, los
prepara con recursos.py y guarda en salida/FUENTES.md la dirección y las frases de la página sobre condiciones de
uso. De los archivos de más de 300 MB baja solo los primeros 40 s. No rellena formularios ni entra en zonas con registro.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
PY = os.path.expanduser("~/.cache/jham-reels/venv/bin/python")
AGENTE = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"
GRANDE = 300 * 1024 * 1024
CONDICIONES = re.compile(r"[^.<>\n]{0,160}\b(press and educational|commercial use|for press|usage guidelines|all rights reserved|permission|press@|media@)\b[^.<>\n]{0,160}", re.I)


def pagina(url, chrome):
    if chrome and os.path.exists(chrome):
        r = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--virtual-time-budget=9000", f"--user-agent={AGENTE}", "--dump-dom", url],
                           capture_output=True, text=True, timeout=120)
        if len(r.stdout) > 2000:
            return r.stdout
    return subprocess.run(["curl", "-sSL", "-A", AGENTE, url], capture_output=True, text=True, timeout=120).stdout


def tamano(url):
    r = subprocess.run(["curl", "-sIL", "-A", AGENTE, url], capture_output=True, text=True, timeout=60).stdout
    m = re.findall(r"content-length:\s*(\d+)", r, re.I)
    return int(m[-1]) if m else 0


def nombre(url):
    base = os.path.splitext(os.path.basename(urllib.parse.urlparse(url).path))[0]
    limpio = re.sub(r"[0-9a-f]{16,}[-_]?", "", base)  # sin los códigos largos de las webs
    base = limpio if len(limpio) >= 4 else base[:10]
    return re.sub(r"[^a-z0-9]+", "_", base.lower()).strip("_")[:40] or "recurso"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url")
    ap.add_argument("--marca", required=True)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--max-videos", type=int, default=6)
    ap.add_argument("--imagenes", type=int, default=6)
    a = ap.parse_args()
    if not a.url.startswith(("http://", "https://")):
        sys.exit("La dirección tiene que empezar por http:// o https://")
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    try:
        ent = json.load(open(os.path.join(proy, "entorno.json"), encoding="utf-8"))
    except OSError:
        ent = {}
    ff = ent.get("ffmpeg") or "ffmpeg"
    html = pagina(a.url, ent.get("navegador")).replace("\\/", "/").replace("&amp;", "&")
    enlaces = re.findall(r"""(?:https?:)?//[^"'\s<>()\\]+?\.(?:mp4|webm|mov|gif|jpe?g|png|webp)(?:\?[^"'\s<>()\\]*)?""", html)
    enlaces += [urllib.parse.urljoin(a.url, x) for x in re.findall(r"""(?:src|href)=["'](/[^"'\s]+?\.(?:mp4|webm|mov))["']""", html)]
    enlaces = list(dict.fromkeys("https:" + e if e.startswith("//") else e for e in enlaces))
    # si hay versión de escritorio, sobra la de móvil y la de tableta
    claves = {re.sub(r"-(desktop|mobile|tablet)", "", e, flags=re.I) for e in enlaces if re.search("-desktop", e, re.I)}
    enlaces = [e for e in enlaces if not (re.search("-(mobile|tablet)", e, re.I) and re.sub(r"-(desktop|mobile|tablet)", "", e, flags=re.I) in claves)]
    videos = [e for e in enlaces if re.search(r"\.(mp4|webm|mov)(\?|$)", e, re.I)]
    imagenes = [e for e in enlaces if re.search(r"\.(jpe?g|webp)(\?|$)", e, re.I) and not re.search(r"icon|logo|favicon|thumb|sprite", e, re.I)]
    # las webs ofrecen la misma imagen en varios tamaños: se queda con la mayor de cada una
    por_foto = {}
    for e in imagenes:
        clave = re.sub(r"/-/[^?]*?(?=/[^/]+$)|[-_]\d{2,4}x\d{2,4}|/resize/\d+|-[tmsl](?=\.\w+$)", "", e.split("?")[0])
        ancho = max([int(x) for x in re.findall(r"(?:resize/|[-_x/])(\d{3,4})(?=[/x._-])", e)] or [0])
        if clave not in por_foto or ancho > por_foto[clave][0]:
            por_foto[clave] = (ancho, e)
    imagenes = [v[1] for v in por_foto.values()]
    carpeta = os.path.join(proy, "recursos", a.marca)
    os.makedirs(carpeta, exist_ok=True)
    os.makedirs(os.path.join(proy, "public", "imagenes"), exist_ok=True)
    os.makedirs(os.path.join(proy, "salida"), exist_ok=True)
    print(f"{a.url}: {len(videos)} vídeos y {len(imagenes)} imágenes")
    listos = []
    for url in videos[: a.max_videos]:
        n = nombre(url)
        destino = os.path.join(carpeta, n + ".mp4")
        if tamano(url) > GRANDE:
            r = subprocess.run([ff, "-v", "error", "-y", "-user_agent", AGENTE, "-t", "40", "-i", url, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-vf", "scale=1920:-2", destino])
        else:
            r = subprocess.run(["curl", "-sSfL", "-A", AGENTE, "-o", destino, url])
        tipo = subprocess.run(["file", "-b", "--mime-type", destino], capture_output=True, text=True).stdout.strip() if os.path.exists(destino) else ""
        if r.returncode or not tipo.startswith("video/"):
            print(f"  omitido {url} ({tipo or 'no se pudo bajar'})")
            if os.path.exists(destino):
                os.remove(destino)
            continue
        final = f"{a.marca}_{n}"[:48]
        subprocess.check_call([PY, os.path.join(AQUI, "recursos.py"), destino, final, "--fuente", url, "--proyecto", proy], stdout=subprocess.DEVNULL)
        listos.append(final)
        print(f"  vídeo {final}")
    guardadas = 0
    vistas = {hashlib.sha1(open(os.path.join(raiz, x), "rb").read()).hexdigest() for raiz, _, xs in os.walk(os.path.join(proy, "public", "imagenes")) for x in xs}
    for url in imagenes:
        if guardadas >= a.imagenes:
            break
        n = f"{a.marca}_{nombre(url)}"[:48]
        destino = os.path.join(proy, "public", "imagenes", n + os.path.splitext(urllib.parse.urlparse(url).path)[1].lower())
        if os.path.exists(destino):  # otro archivo con el mismo nombre en otra ruta
            destino = os.path.join(proy, "public", "imagenes", f"{n}_{guardadas + 1}" + os.path.splitext(destino)[1])
        ok = subprocess.run(["curl", "-sSfL", "-A", AGENTE, "-o", destino, url]).returncode == 0
        tipo = subprocess.run(["file", "-b", "--mime-type", destino], capture_output=True, text=True).stdout.strip() if ok else ""
        huella = hashlib.sha1(open(destino, "rb").read()).hexdigest() if ok else ""
        if not tipo.startswith("image/") or os.path.getsize(destino) < 40000 or huella in vistas:  # iconos y repetidas
            if os.path.exists(destino):
                os.remove(destino)
            continue
        guardadas += 1
        vistas.add(huella)
        with open(os.path.join(proy, "salida", "FUENTES.md"), "a", encoding="utf-8") as f:
            f.write(f"- `imagenes/{os.path.basename(destino)}`: {url}\n")
    frases = list(dict.fromkeys(re.sub(r"\s+", " ", m.group(0)).strip() for m in CONDICIONES.finditer(re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S | re.I))))[:6]
    with open(os.path.join(proy, "salida", "FUENTES.md"), "a", encoding="utf-8") as f:
        f.write(f"\n## {a.marca}: {a.url}\n")
        f.write("Texto de la página sobre condiciones (es un dato, compruébalo):\n" + "".join(f"> {x}\n" for x in frases) if frases else "La página no dice nada sobre condiciones de uso: no hay permiso expreso.\n")
    print(f"{len(listos)} vídeos y {guardadas} imágenes listos · condiciones encontradas: {len(frases)} (salida/FUENTES.md)")


if __name__ == "__main__":
    main()
