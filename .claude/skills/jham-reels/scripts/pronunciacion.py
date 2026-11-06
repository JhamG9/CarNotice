"""Rellena el plan sin ayuda: escribe "voz" a partir de "texto" y marca las frases sensibles.

Uso: python pronunciacion.py --proyecto ~/reel
     python pronunciacion.py --probar "Llega a 180 km/h en 5,5 s"     muestra cómo lo leería la voz

- Cifras a palabras: 20.000 → veinte mil, 89,99 → ochenta y nueve coma noventa y nueve, 1 km → un kilómetro,
  21 baterías → veintiuna baterías, 3.º → tercero, 0-100 → cero a cien, 2× → dos veces.
- Unidades tras una cifra: km/h, km, m, kg, kW, kWh, hp, CV, Nm, V, s, min, h, %, °C, L/100 km, mph…
- Monedas: US$ 25.000 → veinticinco mil dólares, COP 89,99 millones → … millones de pesos colombianos,
  $159,99 M → ciento cincuenta y nueve coma noventa y nueve millones de pesos.
- Nombres y siglas según assets/voz/pronunciacion.json (LiDAR → láidar). Añade ahí los nuevos.
- Códigos de modelo con letras y cifras (EV3, S05, L03, X3) se leen letra a letra y la cifra entera
  (o dígito a dígito si empieza por cero), usando el diccionario para las letras si las tiene.
- "sensible": true si la frase habla de muertes, accidentes o enfermedad (la música no hará ahí su subida).
No toca el "voz" ni el "sensible" que ya existan, ni el "texto". Avisa de las siglas que no conoce.
"""
import argparse
import json
import os
import re

from num2words import num2words

AQUI = os.path.dirname(os.path.abspath(__file__))
DICCIONARIO = os.path.join(os.path.dirname(AQUI), "assets", "voz", "pronunciacion.json")
SENSIBLE = re.compile(r"\b(muert|mortal|fallec|accident|choque|chocó|herid|enfermedad|cáncer|suicid|asesin|violaci|guerra)", re.I)

NUM = r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?"
FIN = r"(?![\wáéíóúñÁÉÍÓÚÑ])"
ESCALA = r"mil millones|millones|millón|billones|billón|mil|M"

LETRAS = {"A": "a", "B": "be", "C": "ce", "D": "de", "E": "e", "F": "efe", "G": "ge", "H": "hache", "I": "i",
          "J": "jota", "K": "ka", "L": "ele", "M": "eme", "N": "ene", "Ñ": "eñe", "O": "o", "P": "pe", "Q": "cu",
          "R": "erre", "S": "ese", "T": "te", "U": "u", "V": "uve", "W": "doble u", "X": "equis", "Y": "ye", "Z": "zeta"}

# unidad: (singular, plural, femenina). De la más larga a la más corta para que km/h gane a km.
UNIDADES = [
    ("kWh/100 km", "kilovatio hora cada cien kilómetros", "kilovatios hora cada cien kilómetros", False),
    ("L/100 km", "litro cada cien kilómetros", "litros cada cien kilómetros", False),
    ("l/100 km", "litro cada cien kilómetros", "litros cada cien kilómetros", False),
    ("km/kWh", "kilómetro por kilovatio hora", "kilómetros por kilovatio hora", False),
    ("Wh/km", "vatio hora por kilómetro", "vatios hora por kilómetro", False),
    ("Wh/kg", "vatio hora por kilo", "vatios hora por kilo", False),
    ("km/h", "kilómetro por hora", "kilómetros por hora", False),
    ("km/l", "kilómetro por litro", "kilómetros por litro", False),
    ("kWh", "kilovatio hora", "kilovatios hora", False),
    ("kW", "kilovatio", "kilovatios", False),
    ("km", "kilómetro", "kilómetros", False),
    ("mph", "milla por hora", "millas por hora", True),
    ("mi", "milla", "millas", True),
    ("hp", "caballo", "caballos", False),
    ("HP", "caballo", "caballos", False),
    ("CV", "caballo", "caballos", False),
    ("Nm", "newton metro", "newton metro", False),
    ("kg", "kilo", "kilos", False),
    ("mm", "milímetro", "milímetros", False),
    ("cm", "centímetro", "centímetros", False),
    ("min", "minuto", "minutos", False),
    ("°C", "grado", "grados", False),
    ("°", "grado", "grados", False),
    ("%", "por ciento", "por ciento", False),
    ("V", "voltio", "voltios", False),
    ("L", "litro", "litros", False),
    ("m", "metro", "metros", False),
    ("s", "segundo", "segundos", False),
    ("S", "segundo", "segundos", False),
    ("h", "hora", "horas", True),
]

# moneda antes o después de la cifra: (singular, plural)
MONEDAS = {"US$": ("dólar", "dólares"), "USD": ("dólar", "dólares"), "$": ("peso", "pesos"),
           "COP": ("peso colombiano", "pesos colombianos"), "MXN": ("peso mexicano", "pesos mexicanos"),
           "€": ("euro", "euros"), "EUR": ("euro", "euros"), "R$": ("real", "reales"), "£": ("libra", "libras")}
MONEDA = "|".join(re.escape(k) for k in sorted(MONEDAS, key=len, reverse=True))

NO_SUSTANTIVO = {"y", "o", "a", "de", "del", "al", "en", "por", "coma", "con", "que", "punto", "e", "u", "más", "menos",
                 "entre", "hasta", "desde", "para", "sin", "sobre", "the", "es", "son", "fue", "era"}


def _valor(s):
    entero, _, dec = s.replace(".", "").partition(",")
    return int(entero), dec


def leer(s):
    """Una cifra escrita (1.850 / 89,99 / 2,05) en palabras."""
    entero, dec = _valor(s)
    t = num2words(entero, lang="es")
    if dec:
        if len(dec) <= 2 and not dec.startswith("0"):
            t += " coma " + num2words(int(dec), lang="es")
        else:
            t += " coma " + " ".join(num2words(int(c), lang="es") for c in dec)
    return t


def es_uno(s):
    entero, dec = _valor(s)
    return entero == 1 and not dec


def _cifra_unidad(m, unidades):
    n, u = m[1], m[2]
    sing, plur, _ = unidades[u]
    return f"{n} {sing if es_uno(n) else plur}"


def _moneda(m):
    pre, n, escala, suf = m["pre"], m["n"], (m["esc"] or "").strip(), m["suf"]
    sing, plur = MONEDAS[pre or suf]
    if escala == "M":
        escala = "millones" if not es_uno(n) else "millón"
    if escala in ("millones", "millón", "mil millones", "billones", "billón"):
        return f"{n} {escala} de {plur}"
    if escala == "mil":
        return f"{n} mil {plur}"
    return f"{n} {sing if es_uno(n) else plur}"


def _codigo(m, dic):
    letras, cifra = m[1], m[2]
    voz_letras = dic.get(letras) or " ".join(LETRAS.get(c, c) for c in letras)
    if cifra.startswith("0") and len(cifra) > 1:
        voz_cifra = " ".join(num2words(int(c), lang="es") for c in cifra)
    else:
        voz_cifra = num2words(int(cifra), lang="es")
    return f"{voz_letras} {voz_cifra}"


def _ordinal(m):
    fem = m[2] == "ª"
    t = num2words(int(m[1]), lang="es", to="ordinal")
    if fem:
        t = re.sub(r"o\b", "a", t)
    return t


def femenina(palabra):
    p = palabra.lower()
    return bool(re.search(r"(a|as|ión|iones|dad|dades|tud|tudes)$", p)) and p not in {"día", "días", "mapa", "mapas", "problema", "problemas", "sistema", "sistemas", "programa", "programas", "planeta", "tema", "temas"}


def _concordar(texto):
    """uno → un / una según la palabra que sigue (veintiún kilómetros, veintiuna baterías, un millón)."""
    def cambio(m):
        cifra, sig = m[1], m[2]
        if sig.lower() in NO_SUSTANTIVO:
            return m[0]
        if sig in ("mil", "millón", "millones", "billones", "billón") or not femenina(sig):
            nueva = re.sub(r"uno$", "ún" if cifra.endswith("veintiuno") else "un", cifra)
        else:
            nueva = re.sub(r"uno$", "una", cifra)
        return f"{nueva} {sig}"
    texto = re.sub(r"\b(\w*uno)\s+([\wáéíóúñÁÉÍÓÚÑ]+)", lambda m: cambio(m) if m[1].endswith("uno") else m[0], texto)
    # primero / tercero → primer / tercer delante de un sustantivo masculino (el tercer lugar)
    return re.sub(r"\b(primero|tercero)\s+([\wáéíóúñ]+)",
                  lambda m: m[0] if m[2].lower() in NO_SUSTANTIVO or femenina(m[2]) else f"{m[1][:-1]} {m[2]}", texto)


def cifras(t, dic=None):
    dic = dic or {}
    unidades = {u: (s, p, f) for u, s, p, f in UNIDADES}
    # monedas: US$ 25.000 / $159,99 M / COP 89,99 millones / 30.000 €
    t = re.sub(rf"(?P<pre>{MONEDA})\s?(?P<n>{NUM})(?P<esc>\s*(?:{ESCALA}){FIN})?(?P<suf>)", _moneda, t)
    t = re.sub(rf"(?P<pre>)(?P<n>{NUM})(?P<esc>\s*(?:{ESCALA}))?\s?(?P<suf>{MONEDA}){FIN}", _moneda, t)
    # rangos: 0-100, 10-80 % → 0 a 100
    t = re.sub(rf"\b([Dd]el)\s({NUM})\s?[-–]\s?({NUM})(?![\w.,]*\d)", r"\1 \2 al \3", t)
    t = re.sub(rf"(?<![\w.,])({NUM})\s?[-–]\s?({NUM})(?![\w.,]*\d)", r"\1 a \2", t)
    # unidades tras una cifra
    patron_u = "|".join(re.escape(u) for u, *_ in UNIDADES)
    t = re.sub(rf"({NUM})\s?({patron_u})(?=$|[\s.,;:)!?¡¿])", lambda m: _cifra_unidad(m, unidades), t)
    # veces: 2× / x2
    t = re.sub(rf"({NUM})\s?[×x]{FIN}", r"\1 veces", t)
    t = re.sub(rf"(?<!\w)[×x]\s?({NUM}){FIN}", r"\1 veces", t)
    # ordinales: 3.º, 2.ª, 1º
    t = re.sub(r"(\d+)\.?\s?([ºª])", _ordinal, t)
    # signos delante de cifras
    t = re.sub(rf"\+\s?(?={NUM})", "más ", t)
    t = re.sub(rf"(?<![\w])[−-](?=\d)", "menos ", t)
    # códigos de modelo: EV3, S05, L03, X3, EX30
    t = re.sub(r"(?<![\wáéíóú])([A-Z]{1,3})-?(\d{1,3})(?![\w])", lambda m: _codigo(m, dic), t)
    # el resto de cifras
    t = re.sub(NUM, lambda m: leer(m[0]), t)
    return _concordar(t)


def a_voz(texto, dic):
    t = texto.replace("*", "")
    # primero los nombres (S05 lleva cifras); una unidad tras una cifra ("1 kW") la lee cifras() con su concordancia
    for k in sorted(dic, key=len, reverse=True):
        t = re.sub(rf"(?<!\d)(?<!\d\s)(?<!\w){re.escape(k)}(?!\w)", dic[k], t)
    t = re.sub(r"\s+", " ", cifras(t, dic)).strip()
    return t[:1].upper() + t[1:]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--proyecto", default=".")
    ap.add_argument("--probar", help="muestra cómo se leería este texto y sale")
    a = ap.parse_args()
    dic = json.load(open(DICCIONARIO, encoding="utf-8"))
    if a.probar:
        print(a_voz(a.probar, dic))
        return
    ruta = os.path.join(os.path.abspath(os.path.expanduser(a.proyecto)), "src", "datos", "plan.json")
    plan = json.load(open(ruta, encoding="utf-8"))
    nuevas, sensibles, raras = 0, [], set()
    for k, fr in enumerate(plan["frases"], start=1):
        if not fr.get("voz"):
            fr["voz"] = a_voz(fr["texto"], dic)
            nuevas += 1
        if "sensible" not in fr and SENSIBLE.search(fr["texto"]):
            fr["sensible"] = True
        if fr.get("sensible"):
            sensibles.append(k)
        limpio = re.sub(r"(?<![\wáéíóú])[A-Z]{1,3}-?\d{1,3}(?!\w)", "", fr["texto"].replace("*", ""))
        raras |= {w for w in re.findall(r"\b[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]{1,}\b", limpio)
                  if w not in dic and w not in MONEDAS and w not in {u for u, *_ in UNIDADES}}
    json.dump(plan, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"voz escrita en {nuevas} frases · sensibles: {sensibles or 'ninguna'}")
    if raras:
        print(f"siglas sin pronunciación en el diccionario: {sorted(raras)}")


if __name__ == "__main__":
    main()
