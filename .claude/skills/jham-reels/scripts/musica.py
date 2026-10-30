"""Compone la música del reel (electrónica a 140 bpm) sincronizada con los cortes de escena, y la deja
ya bajada debajo de la voz en public/musica.wav. Todo con numpy/scipy: sin samples ni derechos de terceros.

Uso: python musica.py --proyecto ~/reel      (después de alinear: lee plan.json y tiempos.json)

El golpe fuerte (drop) cae en una frase a un 62 % del reel, y la subida ocupa la frase anterior. Para elegirla a
mano, en el plan: "musica": { "subida": 7 } (número de frase, desde 1). Marca con "sensible": true las frases
que hablen de muertes o temas serios: ni el golpe ni la subida caerán en ellas.
"""
import argparse
import json
import os
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 140
BEAT = 60 / BPM
rng = np.random.default_rng(7)


def leer_wav(ruta):
    with wave.open(ruta) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        sr = w.getframerate()
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x


def filtro(x, tipo, f, orden=2):
    return sosfilt(butter(orden, f, btype=tipo, fs=SR, output="sos"), x)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def kick():
    t = t_(0.42)
    f = 46 + 140 * np.exp(-t * 32)
    cuerpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = filtro(rng.standard_normal(len(t)), "highpass", 3000) * np.exp(-t * 400) * 0.4
    return np.tanh((cuerpo + click) * 1.6)


def clap():
    t = t_(0.3)
    n = filtro(rng.standard_normal(len(t)), "bandpass", [900, 4200])
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 30) * (t > 0.012)
    return n * env * 0.55


def hat(abierto=False):
    t = t_(0.25 if abierto else 0.06)
    return filtro(rng.standard_normal(len(t)), "highpass", 7500) * np.exp(-t * (14 if abierto else 70)) * 0.28


def saw(f, dur, detune=(0,)):
    t = t_(dur)
    s = sum(2 * ((t * f * (1 + d)) % 1) - 1 for d in detune) / len(detune)
    return s


def nota(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def impacto():
    t = t_(2.2)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
    ruido = filtro(rng.standard_normal(len(t)), "lowpass", 2500) * np.exp(-t * 5) * 0.5
    return np.tanh((boom + ruido) * 1.4)


def subida(dur):
    t = t_(dur)
    p = t / dur
    ruido = filtro(rng.standard_normal(len(t)), "highpass", 1200) * p ** 2 * 0.5
    tono = np.sin(2 * np.pi * np.cumsum(180 + 1400 * p ** 2) / SR) * p ** 1.5 * 0.25
    return ruido + tono


def poner(pista, sonido, en, vol=1.0):
    i = int(en * SR)
    if i >= len(pista):
        return
    e = min(len(pista), i + len(sonido))
    pista[i:e] += sonido[: e - i] * vol


def elegir_drop(plan, inicios, dur):
    """Frase (índice desde 0) en la que cae el golpe: ni ella ni la anterior pueden ser sensibles."""
    frases = plan["frases"]
    pedida = (plan.get("musica") or {}).get("subida")
    if pedida:
        return min(len(frases) - 1, max(1, int(pedida) - 1))
    sensible = [bool(f.get("sensible")) for f in frases]
    ultima = len(frases) - 1  # la última es la llamada a la acción, que ya lleva su golpe
    buenas = [i for i in range(2, ultima) if not sensible[i] and not sensible[i - 1]]
    if not buenas:
        return None
    return min(buenas, key=lambda i: abs(inicios[i] - dur * 0.62))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    a = ap.parse_args()
    proy = os.path.abspath(os.path.expanduser(a.proyecto))
    plan = json.load(open(os.path.join(proy, "src", "datos", "plan.json"), encoding="utf-8"))
    tiempos = json.load(open(os.path.join(proy, "src", "datos", "tiempos.json"), encoding="utf-8"))
    voz_ruta = os.path.join(proy, "public", "voz.wav")
    salida = os.path.join(proy, "public", "musica.wav")
    if not os.path.exists(voz_ruta):
        sys.exit("No hay public/voz.wav: alinea la voz antes de crear la música.")
    dur = float(tiempos["duracion"])
    inicios = [max(0.0, float(f["inicio"]) - 0.03) for f in tiempos["frases"]]
    cortes = inicios
    n = int((dur + 0.5) * SR)
    bombo, caja, platos, bajo, arpegio, colchon, fx = (np.zeros(n) for _ in range(7))

    # secciones (en segundos) a partir de los cortes: la tensión sube antes del golpe y de la llamada a la acción
    i_drop = elegir_drop(plan, inicios, dur)
    drop = inicios[i_drop] if i_drop is not None else None
    pre_drop = inicios[i_drop - 1] if i_drop is not None else None
    cta = inicios[-1]
    pre_cta = inicios[-2] if len(inicios) > 1 else max(0.0, cta - 2.7)
    arranca_arp = inicios[3] if len(inicios) > 3 else dur * 0.2

    # progresión i – VI – VII – v en Mi menor (un acorde por compás)
    acordes = [[40, 47, 52, 55], [36, 43, 48, 52], [38, 45, 50, 54], [35, 42, 47, 50]]
    k = kick()
    nb = int(dur / BEAT) + 2
    for b in range(nb):
        tb = b * BEAT
        if tb >= dur:
            break
        quieto = (drop is not None and drop - 4 * BEAT < tb < drop) or cta - 3 * BEAT < tb < cta  # sin bombo en el último compás de cada subida
        if not quieto:
            poner(bombo, k, tb, 0.95)
        if b % 2 == 1 and not quieto:
            poner(caja, clap(), tb, 0.8)
        for s in range(4):  # semicorcheas
            ts = tb + s * BEAT / 4
            poner(platos, hat(abierto=(s == 2)), ts, 0.55 if s == 2 else 0.35 + 0.1 * (s % 2))
        acorde = acordes[(b // 4) % 4]
        # bajo rodante: corcheas en contratiempo
        if not quieto:
            for s in (1, 2, 3):
                poner(bajo, saw(nota(acorde[0] - 12 + 12 * (s == 3)), BEAT / 4 * 0.9, (0, 0.006)) * np.exp(-t_(BEAT / 4 * 0.9) * 6), tb + s * BEAT / 4, 0.55)
        if tb >= arranca_arp:
            for s in range(4):
                m = acorde[[1, 2, 3, 2][s]] + 24
                poner(arpegio, saw(nota(m), BEAT / 4 * 0.8, (-0.004, 0.004)) * np.exp(-t_(BEAT / 4 * 0.8) * 9), tb + s * BEAT / 4, 0.22)
        if b % 4 == 0:
            d = 4 * BEAT
            pad = sum(saw(nota(m + 12), d, (-0.008, 0, 0.008)) for m in acorde[1:]) / 3
            env = np.minimum(1, t_(d) / 0.3) * np.minimum(1, (d - t_(d)) / 0.4)
            poner(colchon, pad * env, tb, 0.25)

    # golpes y subidas sincronizados con el vídeo
    poner(fx, impacto(), 0.0, 1.0)
    if drop is not None:
        poner(fx, subida(drop - pre_drop), pre_drop, 1.0)
        poner(fx, impacto(), drop, 1.1)
    poner(fx, subida(cta - pre_cta), pre_cta, 0.9)
    poner(fx, impacto(), cta, 1.0)
    for c in cortes[1:]:
        if (drop is None or abs(c - drop) > 0.1) and abs(c - cta) > 0.1:
            poner(fx, filtro(rng.standard_normal(int(0.35 * SR)), "bandpass", [400, 6000]) * np.exp(-t_(0.35) * 9) * 0.35, c - 0.12, 1.0)

    bajo = np.tanh(filtro(bajo, "lowpass", 700) * 1.8)
    arpegio = filtro(arpegio, "lowpass", 5000)
    eco = np.zeros_like(arpegio)
    retardo = int(BEAT * 0.75 * SR)
    eco[retardo:] = arpegio[:-retardo] * 0.35
    arpegio += eco
    colchon = filtro(colchon, "lowpass", 2400)

    # compresión lateral: todo lo que no es bombo se agacha en cada golpe
    lado = np.ones(n)
    env_k = 1 - 0.65 * np.exp(-t_(BEAT) * 14)
    for b in range(nb):
        i = int(b * BEAT * SR)
        e = min(n, i + len(env_k))
        lado[i:e] = np.minimum(lado[i:e], env_k[: e - i])

    tono = (bajo * 0.9 + arpegio + colchon) * lado
    mezcla = bombo * 0.9 + caja * 0.6 + platos * 0.5 + tono

    # filtro que se abre en la subida y en el último tramo (barrido de tensión)
    oscuro = filtro(mezcla, "lowpass", 600)
    abre = np.ones(n)
    for a, z in ([(pre_drop, drop)] if drop is not None else []) + [(pre_cta, cta)]:
        i, j = int(a * SR), int(z * SR)
        abre[i:j] = np.linspace(0.35, 1, j - i) ** 1.5
    mezcla = mezcla * abre + oscuro * (1 - abre) + fx * 0.8  # los golpes y subidas van sin filtrar

    mezcla = np.tanh(mezcla * 0.9)
    final = int(1.2 * SR)
    mezcla[-final:] *= np.linspace(1, 0, final)

    # baja la música mientras habla la voz (sidechain con la voz)
    voz = leer_wav(voz_ruta)[:n]
    voz = np.pad(voz, (0, n - len(voz)))
    rms = np.sqrt(np.convolve(voz ** 2, np.ones(SR // 20) / (SR // 20), mode="same"))
    habla = np.clip(rms / 0.04, 0, 1)
    habla = np.convolve(habla, np.ones(SR // 8) / (SR // 8), mode="same")
    mezcla *= 1 - 0.5 * habla

    mezcla = mezcla[: int(dur * SR)]
    mezcla *= 0.32 / max(1e-6, np.abs(mezcla).max())  # muy por debajo de la voz
    estereo = np.stack([mezcla, mezcla], axis=1)
    with wave.open(salida, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((estereo * 32767).astype(np.int16).tobytes())
    golpe = f"golpe en la frase {i_drop + 1} ({drop:.2f} s)" if drop is not None else "sin golpe central"
    print(f"música: {dur:.1f} s, {golpe}, llamada a la acción en {cta:.2f} s → {salida}")


if __name__ == "__main__":
    main()
