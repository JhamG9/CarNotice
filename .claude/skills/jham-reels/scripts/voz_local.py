"""Genera la voz del reel en local (Apple Silicon), por bloques de frases, la comprueba con Whisper, empareja el ritmo y la alinea.

Uso:
  python3 voz_local.py --entorno                  instala el entorno en ~/.cache/jham-reels/venv (una vez, ~2 min)
  python3 voz_local.py --proyecto ~/reel          genera lo que falte, comprueba, une y alinea
  python3 voz_local.py --proyecto ~/reel --solo 3,7        repite esos bloques (después de cambiar el "voz" de sus frases)
  python3 voz_local.py --proyecto ~/reel --motor chatterbox   usa otro motor, p. ej. chatterbox (también "motorVoz" en el plan)

Motores: voxcpm2 (VoxCPM2, 48 kHz, 16 pasos; el de por defecto desde el 2026-11-06: más natural y mejor con la R y la
RR) y chatterbox (Chatterbox multilingüe, 24 kHz, más rápido). Los dos copian la voz de referencia (assets/voz/voz02.wav).
Con voxcpm2 se puede pedir un tono en palabras (--tono o "tonoVoz" en el plan); por defecto no se pide ninguno.

Lee el texto de "voz" de cada frase del plan (o "texto" si no tiene) y genera juntas las frases seguidas, para que la
entonación continúe. Un bloque ya generado con el mismo texto y ajustes no se repite. Cada toma se juzga por lo que oye
Whisper, por su ritmo (caracteres por segundo frente al resto de bloques) y por si deja ruido al final; si falla en
algo, repite hasta 3 tomas y se queda con la mejor. Con --emparejar, al unir ajusta como mucho un 6 % los bloques que
van más rápidos o lentos que el resto (deja un leve sonido metálico, por eso no se hace por defecto).

Opciones: --referencia audio.wav (otra voz, 6-15 s), --exageracion 0.7 y --cfg 0.5 (chatterbox), --pasos 16 (voxcpm2),
--max-caracteres (260 en voxcpm2: más largo, la voz se apaga), --pausa 0.45, --sin-alinear.
"""
import argparse
import difflib
import hashlib
import json
import os
import platform
import re
import shutil
import statistics
import subprocess
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
VENV = os.path.expanduser("~/.cache/jham-reels/venv")
PY = os.path.join(VENV, "bin", "python")
REFERENCIA = os.path.join(os.path.dirname(AQUI), "assets", "voz", "voz02.wav")  # elegida el 2026-11-06 (muestra C2); voz01.wav es la anterior
WHISPER = "mlx-community/whisper-large-v3-turbo"
PAQUETES = ["mlx-audio==0.6.4", "misaki", "mlx-whisper", "num2words", "numpy", "scipy", "sherpa-onnx==1.13.8"]
MOTORES = {
    # cps: caracteres por segundo medidos sin acelerar, para estimar la duración antes de generar
    "chatterbox": {"repo": "mlx-community/chatterbox-multilingual-v3", "cps": 15.7, "bloque": 450},
    "voxcpm2": {"repo": "mlx-community/VoxCPM2-8bit", "cps": 17.0, "bloque": 260},
}
MOTOR = "voxcpm2"  # elegido el 2026-11-06: más natural y mejor R/RR que chatterbox
TONO = None  # sin instrucción: voz02 tal cual sonó mejor (2026-11-06; el tono G la apagaba). "tonoVoz" en el plan pide uno
SR = 48000
SILENCIO = 0.25
PAUSA = 0.45  # pausa máxima dentro de la voz: más que la de alinear.py, para no igualar el ritmo natural
UMBRAL = 0.8
INTENTOS = 3
TOLERANCIA_RITMO = 0.12  # una toma que se aparta más que esto del ritmo de las demás se repite
EMPAREJAR = 0.06  # ajuste máximo de velocidad de un bloque al unir
COLA = 0.45  # voz o ruido que sigue más de esto tras la última palabra se corta
DURACION_MAX = 59  # Instagram rechaza por API los reels largos


def entorno():
    if platform.system() != "Darwin" or platform.machine() != "arm64":
        sys.exit("La voz local con MLX necesita un Mac con Apple Silicon. Aquí usa voz.py (ElevenLabs o grabación).")
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


class Voz:
    """Carga el motor y Whisper una sola vez y genera, oye y recorta cada toma."""

    def __init__(self, motor, a):
        from mlx_audio.tts.utils import load_model
        import mlx_whisper
        self.motor, self.a, self.whisper = motor, a, mlx_whisper
        self.modelo = load_model(MOTORES[motor]["repo"])
        self.sr = self.modelo.sample_rate

    def ajustes(self):
        return ajustes(self.motor, self.a)

    def generar(self, texto, ruta):
        import numpy as np
        from scipy.io import wavfile
        partes = [np.array(r.audio, dtype=np.float32)
                  for r in self.modelo.generate(text=texto, ref_audio=self.a.referencia, verbose=False, **self.ajustes())]
        audio = np.concatenate(partes) if partes else np.zeros(1, dtype=np.float32)
        wavfile.write(ruta, self.sr, audio)
        return audio

    def oir(self, ruta):
        r = self.whisper.transcribe(ruta, path_or_hf_repo=WHISPER, language="es", word_timestamps=True, temperature=0.0)
        palabras = [w for s in r["segments"] for w in s.get("words", [])]
        return r["text"].strip(), palabras

    def recortar_cola(self, audio, palabras, ruta):
        """Corta lo que suene mucho después de la última palabra (respiraciones largas, murmullos, ruido)."""
        import numpy as np
        from scipy.io import wavfile
        if not palabras:
            return 0.0
        fin = palabras[-1]["end"] + COLA
        total = len(audio) / self.sr
        if total - fin < 0.15:
            return 0.0
        n = int(fin * self.sr)
        corte = audio[:n].copy()
        f = int(0.08 * self.sr)
        corte[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
        wavfile.write(ruta, self.sr, corte)
        return total - fin


def ajustes(motor, a):
    if motor == "chatterbox":
        return {"lang_code": "es", "exaggeration": a.exageracion, "cfg_weight": a.cfg}
    extra = {"instruct": a.tono} if a.tono else {}
    return {"inference_timesteps": a.pasos, **extra}


def ritmo(voz, palabras, duracion):
    """Caracteres por segundo de habla (de la primera a la última palabra que oye Whisper)."""
    if palabras:
        habla = palabras[-1]["end"] - palabras[0]["start"]
        if habla > 0.5:
            return len(voz) / habla
    return len(voz) / max(duracion, 0.1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--entorno", action="store_true")
    ap.add_argument("--solo", default="", help="números de bloque separados por comas")
    ap.add_argument("--motor", choices=sorted(MOTORES), help=f"motor de voz (por defecto el del plan o {MOTOR})")
    ap.add_argument("--referencia", default=REFERENCIA)
    ap.add_argument("--exageracion", type=float, default=0.7, help="energía (chatterbox)")
    ap.add_argument("--cfg", type=float, default=0.5, help="cuánto se ciñe al texto y a la referencia (chatterbox)")
    ap.add_argument("--pasos", type=int, default=16, help="pasos de difusión, más = más calidad y más lento (voxcpm2)")
    ap.add_argument("--tono", default=None, help='cómo debe sonar, en palabras (voxcpm2; también "tonoVoz" en el plan)')
    ap.add_argument("--max-caracteres", type=int, default=None, help="largo máximo de un bloque (voxcpm2 260, chatterbox 450)")
    ap.add_argument("--sin-alinear", action="store_true")
    ap.add_argument("--emparejar", action="store_true", help="ajusta hasta un 6 %% la velocidad de los bloques al unir (deja un leve sonido metálico)")
    ap.add_argument("--pausa", type=float, default=PAUSA, help="pausa máxima entre frases, en segundos")
    a = ap.parse_args()
    if a.entorno:
        return entorno()
    if not os.path.exists(PY):
        entorno()
    if os.path.abspath(sys.prefix) != VENV:
        os.execv(PY, [PY] + sys.argv)

    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    ruta_plan = os.path.join(proy, "src", "datos", "plan.json")
    plan = json.load(open(ruta_plan, encoding="utf-8"))
    motor = a.motor or plan.get("motorVoz") or MOTOR
    a.tono = a.tono if a.tono is not None else plan.get("tonoVoz", TONO)
    if a.tono in ("", "ninguno"):
        a.tono = None
    if motor not in MOTORES:
        sys.exit(f"motor desconocido: {motor} (hay {', '.join(MOTORES)})")
    frases = plan["frases"]
    carpeta = os.path.join(proy, "salida", "voz_frases")
    os.makedirs(carpeta, exist_ok=True)
    ruta_ind = os.path.join(carpeta, "indice.json")
    indice = json.load(open(ruta_ind, encoding="utf-8")) if os.path.exists(ruta_ind) else {}
    solo = {int(x) for x in a.solo.split(",") if x.strip()}

    bloques = agrupar(frases, a.max_caracteres or MOTORES[motor]["bloque"])
    maximo = plan.get("duracionMax", DURACION_MAX)
    estimado = sum(len(voz) for voz, _ in bloques) / MOTORES[motor]["cps"] + 1.5
    print(f"Motor: {motor}. Duración estimada: {estimado:.0f} s (máximo {maximo} s).")
    if estimado > maximo:
        print(f"AVISO: el guion pasaría de {maximo} s. Recorta texto en vez de acelerar la voz, o pon \"duracionMax\" en el plan.")

    huella_ref = hashlib.sha1(open(a.referencia, "rb").read()).hexdigest()[:10]
    voz_motor = None
    for k, (voz, oido_esperado) in enumerate(bloques, start=1):
        pre = f"b{k:02d}"
        wav = os.path.join(carpeta, pre + ".wav")
        clave = f"{huella_ref}|{motor}|{json.dumps(ajustes(motor, a), sort_keys=True)}|{voz}"
        if os.path.exists(wav) and indice.get(pre, {}).get("clave") == clave and k not in solo:
            continue
        if voz_motor is None:
            print("Cargando el motor de voz y Whisper…", flush=True)
            voz_motor = Voz(motor, a)
        # ritmo de referencia: el de los bloques ya hechos con este motor
        hechos = [v["cps"] for v in indice.values() if v.get("cps") and f"|{motor}|" in v.get("clave", "")]
        objetivo = statistics.median(hechos) if hechos else None  # el primer bloque no tiene con qué compararse
        mejor, copia = None, wav + ".mejor"
        for intento in range(1, INTENTOS + 1):
            audio = voz_motor.generar(voz, wav)
            oido, palabras = voz_motor.oir(wav)
            cola = voz_motor.recortar_cola(audio, palabras, wav)
            p = parecido(oido_esperado, oido)
            cps = ritmo(voz, palabras, len(audio) / voz_motor.sr)
            desvio = abs(cps / objetivo - 1) if objetivo else 0.0
            # primero que se entienda; entre las que se entienden, la de ritmo más parecido al resto
            nota = (p >= UMBRAL, -max(desvio - TOLERANCIA_RITMO, 0), p)
            if mejor is None or nota > mejor["nota"]:
                mejor = {"nota": nota, "oido": oido, "p": p, "cps": cps, "cola": cola, "intento": intento}
                shutil.copy(wav, copia)
            if p >= UMBRAL and desvio <= TOLERANCIA_RITMO:
                break
        shutil.move(copia, wav)
        indice[pre] = {"clave": clave, "oido": mejor["oido"], "cps": round(mejor["cps"], 2)}
        json.dump(indice, open(ruta_ind, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        extra = f" · cola de {mejor['cola']:.1f} s cortada" if mejor["cola"] > 0 else ""
        print(f"{k}/{len(bloques)} toma {mejor['intento']} · {mejor['cps']:.1f} car/s{extra} · {voz[:60]}", flush=True)

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

    # ritmo parejo: cada bloque se lleva hacia la mediana, como mucho un EMPAREJAR
    velocidades = [indice[f"b{k:02d}"].get("cps") for k in range(1, len(bloques) + 1)]
    largos = [v for (voz, _), v in zip(bloques, velocidades) if v and len(voz) >= 60]
    mediana = statistics.median(largos) if len(largos) >= 2 else None
    factores = []
    for (voz, _), v in zip(bloques, velocidades):
        f = 1.0
        if mediana and v and a.emparejar and len(voz) >= 25:
            f = min(max(mediana / v, 1 - EMPAREJAR), 1 + EMPAREJAR)
            if abs(f - 1) < 0.025:
                f = 1.0
        factores.append(f)
    if mediana:
        cambios = [f"{k}: {'+' if f > 1 else ''}{(f - 1) * 100:.0f} %" for k, f in enumerate(factores, start=1) if f != 1]
        print(f"\nRitmo: mediana {mediana:.1f} car/s, de {min(v for v in velocidades if v):.1f} a {max(v for v in velocidades if v):.1f}."
              + (f" Emparejados: {', '.join(cambios)}." if cambios else (" Todos parejos." if a.emparejar else " Sin ajustar (usa --emparejar).")))

    ff = ffmpeg(proy)
    args = [ff, "-v", "error", "-y"]
    n = len(bloques)
    for k in range(1, n + 1):
        args += ["-i", os.path.join(carpeta, f"b{k:02d}.wav")]
    args += ["-f", "lavfi", "-t", str(SILENCIO), "-i", f"anullsrc=r={SR}:cl=mono"]
    filtros = []
    for i, f in enumerate(factores):
        filtros.append(f"[{i}:a]aresample={SR},aformat=channel_layouts=mono" + (f",atempo={f:.4f}" if f != 1 else "") + f"[v{i}]")
    filtros.append(f"[{n}:a]asplit={n}" + "".join(f"[s{i}]" for i in range(n)))
    partes = "".join(f"[v{i}][s{i}]" for i in range(n))
    filtros.append(f"{partes}concat=n={2 * n}:v=0:a=1[a]")
    salida = os.path.join(proy, "salida", "voz_local.wav")
    sys.stdout.flush()
    subprocess.check_call(args + ["-filter_complex", ";".join(filtros), "-map", "[a]", salida])
    print(f"\nvoz unida: {salida}", flush=True)
    if not a.sin_alinear:
        subprocess.check_call([PY, os.path.join(AQUI, "alinear.py"), salida, "--proyecto", proy, "--motor", "auto", "--pausa", str(a.pausa)])


if __name__ == "__main__":
    main()
