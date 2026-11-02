"""Genera la voz del reel en local (Chatterbox en Apple Silicon), por bloques de frases, la comprueba con Whisper y la alinea.

Uso:
  python3 voz_local.py --entorno                  instala el entorno en ~/.cache/jham-reels/venv (una vez, ~2 min)
  python3 voz_local.py --proyecto ~/reel          genera lo que falte, comprueba, une y alinea
  python3 voz_local.py --proyecto ~/reel --solo 3,7        repite esos bloques (después de cambiar el "voz" de sus frases)

Lee el texto de "voz" de cada frase del plan (o "texto" si no tiene) y genera juntas las frases seguidas, para que la
entonación continúe y las pausas no salgan todas iguales. Un bloque ya generado con el mismo texto no se repite. Si
Whisper lo entiende mal, repite la toma hasta 3 veces y se queda con la mejor.

Opciones: --referencia audio.wav (otra voz, 5-10 s), --exageracion 0.7 (energía), --max-caracteres 450, --sin-alinear.
"""
import argparse
import difflib
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
VENV = os.path.expanduser("~/.cache/jham-reels/venv")
PY = os.path.join(VENV, "bin", "python")
REFERENCIA = os.path.join(os.path.dirname(AQUI), "assets", "voz", "voz01.wav")
MODELO = "mlx-community/chatterbox-multilingual-v3"
WHISPER = "mlx-community/whisper-large-v3-turbo"
PAQUETES = ["mlx-audio==0.6.3", "misaki", "mlx-whisper", "num2words", "numpy", "scipy", "sherpa-onnx==1.13.8"]
SILENCIO = 0.25
PAUSA = 0.45  # pausa máxima dentro de la voz: más que la de alinear.py, para no igualar el ritmo natural
UMBRAL = 0.8
INTENTOS = 3
DURACION_MAX = 59  # Instagram rechaza por API los reels largos
CARACTERES_POR_SEGUNDO = 15.7  # medido en reels ya hechos, sin acelerar


def entorno():
    if platform.system() != "Darwin" or platform.machine() != "arm64":
        sys.exit("Chatterbox con MLX necesita un Mac con Apple Silicon. Aquí usa voz.py (ElevenLabs o grabación).")
    uv = shutil.which("uv")
    os.makedirs(os.path.dirname(VENV), exist_ok=True)
    if uv:
        if not os.path.exists(PY):
            subprocess.check_call([uv, "venv", "-q", "--seed", "-p", "3.12", VENV])
        subprocess.check_call([uv, "pip", "install", "-q", "--python", PY] + PAQUETES)
    else:
        if not os.path.exists(PY):
            subprocess.check_call([sys.executable, "-m", "venv", VENV])
        subprocess.check_call([PY, "-m", "pip", "install", "-q"] + PAQUETES)
    print(f"entorno listo: {PY}")


def plano(t):
    t = unicodedata.normalize("NFD", t.replace("*", "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", t).split()


def parecido(texto, oido):
    return difflib.SequenceMatcher(None, plano(texto), plano(oido)).ratio()


def variantes(texto):
    """Otras formas de escribir la frase, de menos a más cambio."""
    minusculas = re.sub(r"\b[A-ZÁÉÍÓÚÑ]{2,}\b", lambda m: m[0].lower(), texto)
    palabras = texto.split(" ")
    coma = " ".join(palabras[:2]).rstrip(",") + ", " + " ".join(palabras[2:]) if len(palabras) > 3 else texto
    return [v for v in dict.fromkeys([minusculas, coma, texto.replace(":", ",")]) if v != texto]


def agrupar(frases, maximo):
    """Junta frases seguidas en bloques: generadas juntas, la entonación continúa de una a otra."""
    bloques, voz, esperado = [], [], []
    for fr in frases:
        t = re.sub(r"\s+", " ", (fr.get("voz") or fr["texto"]).replace("*", "")).strip()
        if voz and len(" ".join(voz + [t])) > maximo:
            bloques.append((" ".join(voz), " ".join(esperado)))
            voz, esperado = [], []
        voz.append(t)
        esperado.append(fr["texto"])
    bloques.append((" ".join(voz), " ".join(esperado)))
    return bloques


def ffmpeg(proy):
    try:
        f = json.load(open(os.path.join(proy, "entorno.json"), encoding="utf-8")).get("ffmpeg")
        if f and os.path.exists(f):
            return f
    except OSError:
        pass
    return "ffmpeg"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--entorno", action="store_true")
    ap.add_argument("--solo", default="", help="números de frase separados por comas")
    ap.add_argument("--referencia", default=REFERENCIA)
    ap.add_argument("--exageracion", type=float, default=0.7)
    ap.add_argument("--max-caracteres", type=int, default=450)
    ap.add_argument("--sin-alinear", action="store_true")
    a = ap.parse_args()
    if a.entorno:
        return entorno()
    if not os.path.exists(PY):
        entorno()
    if os.path.abspath(sys.prefix) != VENV:
        os.execv(PY, [PY] + sys.argv)

    import mlx_whisper  # solo existe dentro del entorno

    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    ruta_plan = os.path.join(proy, "src", "datos", "plan.json")
    plan = json.load(open(ruta_plan, encoding="utf-8"))
    frases = plan["frases"]
    carpeta = os.path.join(proy, "salida", "voz_frases")
    os.makedirs(carpeta, exist_ok=True)
    ruta_ind = os.path.join(carpeta, "indice.json")
    indice = json.load(open(ruta_ind, encoding="utf-8")) if os.path.exists(ruta_ind) else {}
    solo = {int(x) for x in a.solo.split(",") if x.strip()}
    huella_voz = hashlib.sha1(open(a.referencia, "rb").read()).hexdigest()[:10] + f":{a.exageracion}"

    bloques = agrupar(frases, a.max_caracteres)
    maximo = plan.get("duracionMax", DURACION_MAX)
    estimado = sum(len(voz) for voz, _ in bloques) / CARACTERES_POR_SEGUNDO + 1.5
    print(f"Duración estimada: {estimado:.0f} s (máximo {maximo} s).")
    if estimado > maximo:
        print(f"AVISO: el guion pasaría de {maximo} s. Recorta texto en vez de acelerar la voz, o pon \"duracionMax\" en el plan.")
    for k, (voz, oido_esperado) in enumerate(bloques, start=1):
        pre = f"b{k:02d}"
        wav = os.path.join(carpeta, pre + ".wav")
        clave = f"{huella_voz}|{voz}"
        if os.path.exists(wav) and indice.get(pre, {}).get("clave") == clave and k not in solo:
            continue
        mejor, oido = -1, ""
        copia = wav + ".mejor"
        # El modelo varía entre tomas: si Whisper entiende mal el bloque, se repite y se queda la mejor.
        for _ in range(INTENTOS):
            if os.path.exists(wav):
                os.remove(wav)
            r = subprocess.run([PY, "-m", "mlx_audio.tts.generate", "--model", MODELO, "--text", voz, "--lang_code", "es",
                                "--exaggeration", str(a.exageracion), "--ref_audio", a.referencia,
                                "--output_path", carpeta, "--file_prefix", pre, "--join_audio"], capture_output=True, text=True)
            if not os.path.exists(wav):
                sys.exit(f"Falló el bloque {k}: {r.stderr[-800:]}")
            actual = mlx_whisper.transcribe(wav, path_or_hf_repo=WHISPER, language="es")["text"].strip()
            p = parecido(oido_esperado, actual)
            if p > mejor:
                mejor, oido = p, actual
                shutil.copy(wav, copia)
            if mejor >= UMBRAL:
                break
        shutil.move(copia, wav)
        indice[pre] = {"clave": clave, "oido": oido}
        json.dump(indice, open(ruta_ind, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{k}/{len(bloques)} {voz[:70]}", flush=True)

    print("\nComprobación (lo que oye Whisper frente al texto de pantalla):")
    dudosos = []
    for k, (_, esperado) in enumerate(bloques, start=1):
        oido = indice[f"b{k:02d}"]["oido"]
        p = parecido(esperado, oido)
        if p < UMBRAL:
            dudosos.append(k)
        print(f"{'  ' if p >= UMBRAL else '? '}{k:2d}. {p:.0%}  {oido}")
    if dudosos:
        print(f"\nREVISA los bloques {dudosos}: cambia el \"voz\" de sus frases y repítelos con --solo.")

    ff = ffmpeg(proy)
    args = [ff, "-v", "error", "-y"]
    n = len(bloques)
    for k in range(1, n + 1):
        args += ["-i", os.path.join(carpeta, f"b{k:02d}.wav")]
    args += ["-f", "lavfi", "-t", str(SILENCIO), "-i", "anullsrc=r=24000:cl=mono"]
    partes = "".join(f"[{i}:a][{n}:a]" for i in range(n))
    salida = os.path.join(proy, "salida", "voz_local.wav")
    subprocess.check_call(args + ["-filter_complex", f"{partes}concat=n={2 * n}:v=0:a=1[a]", "-map", "[a]", salida])
    print(f"\nvoz unida: {salida}")
    if not a.sin_alinear:
        subprocess.check_call([PY, os.path.join(AQUI, "alinear.py"), salida, "--proyecto", proy, "--motor", "auto", "--pausa", str(PAUSA)])


if __name__ == "__main__":
    main()
