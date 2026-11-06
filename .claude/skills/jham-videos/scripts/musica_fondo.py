"""Música de fondo para vídeos largos: tranquila debajo de la voz y más presente solo en los momentos clave.

Uso: python musica_fondo.py --proyecto ~/video      (después de alinear: lee plan.json, tiempos.json y public/voz.wav)

En un vídeo de varios minutos la electrónica rápida de los reels cansa y compite con la voz. Esta música va a 84 bpm,
con colchón de acordes, bajo suave y un arpegio tenue, y cambia de intensidad según el guion:
- gancho (hasta el primer capítulo) y cierre: con pulso (bombo suave y platillo);
- cuerpo: solo colchón, bajo y arpegio, muy por debajo de la voz;
- cada capítulo nuevo: una subida corta y un golpe grave que marcan el cambio;
- escenas de golpe (contador, cifras, pregunta, tachado, comparación): un acento grave discreto;
- tensión: "musica": { "tension": [12] } en el plan (número de frase, desde 1) quita el pulso, oscurece y sube
  hasta esa frase, para el giro de una noticia;
- frases con "sensible": true: solo colchón, sin acentos.
Todo con numpy/scipy: sin samples ni derechos de terceros. Escribe public/musica.wav ya mezclada bajo la voz.
"""
import argparse
import importlib.util
import json
import os
import sys
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "musica_reels", os.path.join(os.path.dirname(os.path.dirname(AQUI)), "jham-reels", "scripts", "musica.py")
)
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)
SR, filtro, t_, saw, nota, poner, leer_wav = m.SR, m.filtro, m.t_, m.saw, m.nota, m.poner, m.leer_wav

BPM = 84
BEAT = 60 / BPM
GOLPES = {"contador", "cifras", "barras", "pregunta", "tachado", "comparacion", "objecion"}
rng = np.random.default_rng(11)


def tipo(e):
    return e.get("nombre", e.get("tipo")) if e.get("tipo") == "propia" else e.get("tipo")


def kick_suave():
    t = t_(0.5)
    f = 42 + 70 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.9


def hat_suave():
    t = t_(0.09)
    return filtro(rng.standard_normal(len(t)), "highpass", 8000) * np.exp(-t * 45) * 0.12


def pluck(f, dur):
    """Nota de tipo piano eléctrico: seno con armónicos que se apaga."""
    t = t_(dur)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.004)


def acento():
    t = t_(1.8)
    boom = np.sin(2 * np.pi * np.cumsum(36 + 30 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.6)
    aire = filtro(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-t * 4) * 0.25
    return boom + aire


def subida(dur):
    t = t_(dur)
    p = t / dur
    ruido = filtro(rng.standard_normal(len(t)), "bandpass", [500, 5000]) * p ** 2.5 * 0.35
    return ruido * np.minimum(1, (dur - t) / 0.05)


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
    frases = plan["frases"]
    opc = plan.get("musica") if isinstance(plan.get("musica"), dict) else {}
    dur = float(tiempos["duracion"])
    ini = [max(0.0, float(f["inicio"]) - 0.03) for f in tiempos["frases"]]
    fin = [float(f["fin"]) for f in tiempos["frases"]]
    n = int((dur + 0.5) * SR)

    # nivel de energía por frase: 1 gancho y cierre, 0,45 cuerpo, 0,2 frases sensibles
    caps = [i for i, f in enumerate(frases) if f.get("capitulo")]
    fin_gancho = ini[caps[0]] if caps and caps[0] > 0 else (ini[2] if len(ini) > 2 else dur * 0.1)
    tension = [int(x) - 1 for x in opc.get("tension", []) if 1 <= int(x) <= len(frases)]
    nivel_f = []
    for i, f in enumerate(frases):
        v = 1.0 if ini[i] < fin_gancho or i == len(frases) - 1 else 0.45
        if f.get("sensible"):
            v = 0.2
        nivel_f.append(v)
    nivel = np.full(n, 0.45)
    for i in range(len(frases)):
        nivel[int(ini[i] * SR): int((fin[i] if i == len(frases) - 1 else ini[i + 1]) * SR)] = nivel_f[i]
    # la tensión: la frase anterior al giro sin pulso, oscura
    oscuro = np.zeros(n)
    for i in tension:
        a0 = int(ini[max(0, i - 1)] * SR)
        oscuro[a0: int(ini[i] * SR)] = 1
        nivel[a0: int(ini[i] * SR)] = 0.3
    suave = np.ones(SR // 2) / (SR // 2)
    nivel = np.convolve(nivel, suave, mode="same")
    oscuro = np.convolve(oscuro, suave, mode="same")

    # progresión i – VI – III – VII en Re menor, dos compases por acorde
    acordes = [[38, 50, 53, 57], [34, 46, 50, 53], [41, 48, 53, 57], [36, 48, 52, 55]]
    pulso, colchon, bajo, arp, fx = (np.zeros(n) for _ in range(5))
    k = kick_suave()
    nb = int(dur / BEAT) + 2
    for b in range(nb):
        tb = b * BEAT
        if tb >= dur:
            break
        ac = acordes[(b // 8) % 4]
        if b % 2 == 0:
            poner(pulso, k, tb, 1.0)
        poner(pulso, hat_suave(), tb + BEAT / 2, 1.0)
        # arpegio en corcheas, notas del acorde una octava arriba
        for s in range(2):
            mnota = ac[[1, 2, 3, 2, 1, 3, 2, 3][(b * 2 + s) % 8]] + 12
            poner(arp, pluck(nota(mnota), BEAT * 1.5), tb + s * BEAT / 2, 0.16)
        if b % 8 == 0:
            d = 8 * BEAT
            env = np.minimum(1, t_(d) / 1.2) * np.minimum(1, (d - t_(d)) / 1.2)
            pad = sum(saw(nota(x), d, (-0.006, 0, 0.006)) for x in ac[1:]) / 3
            poner(colchon, pad * env, tb, 0.3)
            poner(bajo, np.sin(2 * np.pi * nota(ac[0]) * t_(d)) * env, tb, 0.55)

    for i, f in enumerate(frases):
        if i == 0:
            continue
        if f.get("sensible"):
            continue
        if f.get("capitulo") or i in tension:
            # sin ruido de «viento»: en la pausa antes del capítulo la música sube un poco y respira, y entra un acento grave
            a0, a1 = int(max(fin[i - 1], ini[i] - 2.0) * SR), int(ini[i] * SR)
            nivel[a0:a1] = np.maximum(nivel[a0:a1], np.linspace(0.45, 0.8, max(0, a1 - a0)))
            poner(fx, acento(), ini[i], 0.55)
        elif tipo(f["escena"]) in GOLPES or f.get("golpe"):
            poner(fx, acento(), ini[i], 0.25)
    poner(fx, acento(), 0.0, 0.6)

    colchon = filtro(colchon, "lowpass", 1400)
    arp = filtro(arp, "lowpass", 3500)
    eco = np.zeros_like(arp)
    r = int(BEAT * 0.75 * SR)
    eco[r:] = arp[:-r] * 0.3
    arp += eco
    pulso_on = np.clip((nivel - 0.6) / 0.3, 0, 1)  # el pulso solo suena con nivel alto
    tono = colchon * (0.6 + 0.4 * nivel) + bajo * (0.5 + 0.5 * nivel) + arp * np.clip(nivel * 1.4, 0.15, 1) * (1 - oscuro)
    mezcla = tono + pulso * pulso_on * 0.8
    mezcla = mezcla * (1 - 0.6 * oscuro) + filtro(mezcla, "lowpass", 500) * 0.6 * oscuro + fx * 0.7
    mezcla = np.tanh(mezcla * 0.8)
    fade_in, fade_out = int(0.4 * SR), int(2.5 * SR)
    mezcla[:fade_in] *= np.linspace(0, 1, fade_in)
    final = int(dur * SR)
    mezcla[final - fade_out: final] *= np.linspace(1, 0, fade_out)

    # bajo la voz: más agachada que en los reels, porque aquí la voz explica
    voz = leer_wav(voz_ruta)[:n]
    voz = np.pad(voz, (0, n - len(voz)))
    rms = np.sqrt(np.convolve(voz ** 2, np.ones(SR // 20) / (SR // 20), mode="same"))
    habla = np.convolve(np.clip(rms / 0.04, 0, 1), np.ones(SR // 6) / (SR // 6), mode="same")
    mezcla *= 1 - 0.5 * habla
    mezcla = mezcla[:final]
    mezcla *= 0.3 / max(1e-6, np.abs(mezcla).max())
    estereo = np.stack([mezcla, mezcla], axis=1)
    with wave.open(salida, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((estereo * 32767).astype(np.int16).tobytes())
    print(f"música de fondo: {dur:.1f} s a {BPM} bpm, {len(caps)} capítulos marcados, tensión en {[x + 1 for x in tension] or 'ninguna'} → {salida}")


if __name__ == "__main__":
    main()
