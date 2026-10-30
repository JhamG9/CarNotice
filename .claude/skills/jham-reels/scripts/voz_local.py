"""Genera la voz del reel en local (Chatterbox en Apple Silicon), frase por frase, la comprueba con Whisper y la alinea.

Uso:
  python3 voz_local.py --entorno                  instala el entorno en ~/.cache/jham-reels/venv (una vez, ~2 min)
  python3 voz_local.py --proyecto ~/reel          genera lo que falte, comprueba, une y alinea
  python3 voz_local.py --proyecto ~/reel --solo 3,7        repite esas frases (después de cambiar su "voz" en el plan)

Lee el texto de "voz" de cada frase del plan (o "texto" si no tiene). Una frase ya generada con el mismo texto no se
repite. Si Whisper entiende mal una frase, prueba sola otras grafías (siglas en minúsculas, una coma), se queda con la que
mejor se entiende y la guarda en el "voz" del plan. Repetir el mismo texto daría el mismo resultado.

Opciones: --referencia audio.wav (otra voz, 5-10 s), --exageracion 0.7 (energía), --sin-alinear.
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
UMBRAL = 0.8


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

    for k, fr in enumerate(frases, start=1):
        texto = re.sub(r"\s+", " ", (fr.get("voz") or fr["texto"]).replace("*", "")).strip()
        pre = f"f{k:02d}"
        wav = os.path.join(carpeta, pre + ".wav")
        clave = f"{huella_voz}|{texto}"
        if os.path.exists(wav) and indice.get(pre, {}).get("clave") == clave and k not in solo:
            continue
        if os.path.exists(wav):
            os.remove(wav)
        generar = lambda t: subprocess.run([PY, "-m", "mlx_audio.tts.generate", "--model", MODELO, "--text", t, "--lang_code", "es",
                                            "--exaggeration", str(a.exageracion), "--ref_audio", a.referencia,
                                            "--output_path", carpeta, "--file_prefix", pre, "--join_audio"], capture_output=True, text=True)
        r = generar(texto)
        if not os.path.exists(wav):
            sys.exit(f"Falló la frase {k}: {r.stderr[-800:]}")
        oido = mlx_whisper.transcribe(wav, path_or_hf_repo=WHISPER, language="es")["text"].strip()
        mejor = parecido(fr["texto"], oido)
        if mejor < UMBRAL:
            copia = wav + ".mejor"
            shutil.copy(wav, copia)
            for otra in variantes(texto):
                generar(otra)
                oido2 = mlx_whisper.transcribe(wav, path_or_hf_repo=WHISPER, language="es")["text"].strip()
                p = parecido(fr["texto"], oido2)
                if p > mejor:
                    mejor, oido, texto = p, oido2, otra
                    shutil.copy(wav, copia)
                if mejor >= UMBRAL:
                    break
            shutil.move(copia, wav)
            fr["voz"] = texto
            json.dump(plan, open(ruta_plan, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            clave = f"{huella_voz}|{texto}"
        indice[pre] = {"clave": clave, "oido": oido}
        json.dump(indice, open(ruta_ind, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{k}/{len(frases)} {texto}", flush=True)

    print("\nComprobación (lo que oye Whisper frente al texto de pantalla):")
    dudosas = []
    for k, fr in enumerate(frases, start=1):
        oido = indice[f"f{k:02d}"]["oido"]
        p = parecido(fr["texto"], oido)
        if p < UMBRAL:
            dudosas.append(k)
        print(f"{'  ' if p >= UMBRAL else '? '}{k:2d}. {p:.0%}  {oido}")
    if dudosas:
        print(f"\nREVISA las frases {dudosas}: ya se probaron otras grafías. Mira si falla la voz o solo Whisper con una sigla.")

    ff = ffmpeg(proy)
    args = [ff, "-v", "error", "-y"]
    n = len(frases)
    for k in range(1, n + 1):
        args += ["-i", os.path.join(carpeta, f"f{k:02d}.wav")]
    args += ["-f", "lavfi", "-t", str(SILENCIO), "-i", "anullsrc=r=24000:cl=mono"]
    partes = "".join(f"[{i}:a][{n}:a]" for i in range(n))
    salida = os.path.join(proy, "salida", "voz_local.wav")
    subprocess.check_call(args + ["-filter_complex", f"{partes}concat=n={2 * n}:v=0:a=1[a]", "-map", "[a]", salida])
    print(f"\nvoz unida: {salida}")
    if not a.sin_alinear:
        subprocess.check_call([PY, os.path.join(AQUI, "alinear.py"), salida, "--proyecto", proy, "--motor", "auto"])


if __name__ == "__main__":
    main()
