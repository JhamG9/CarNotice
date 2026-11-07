"""Pruebas de pronunciacion.py: cómo debe leer la voz cifras, unidades, monedas y códigos.

Uso: ~/.cache/jham-reels/venv/bin/python probar_pronunciacion.py
Si cambias pronunciacion.py, corre esto. Añade aquí cada caso que la voz haya leído mal.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pronunciacion as p  # noqa: E402

CASOS = {
    "Llega a 180 km/h en 2026": "Llega a ciento ochenta kilómetros por hora en dos mil veintiséis",
    "Carga de 10 a 80 % en 28 min": "Carga de diez a ochenta por ciento en veintiocho minutos",
    "Del 10-80 % en 31 min": "Del diez al ochenta por ciento en treinta y un minutos",
    "0-100 en 5,5 s": "Cero a cien en cinco coma cinco segundos",
    "Cuesta COP 89,99 millones": "Cuesta ochenta y nueve coma noventa y nueve millones de pesos colombianos",
    "DESDE $159,99 M": "DESDE ciento cincuenta y nueve coma noventa y nueve millones de pesos",
    "Cuesta 30.000 € o 25.000 USD": "Cuesta treinta mil euros o veinticinco mil dólares",
    "US$ 25.000": "Veinticinco mil dólares",
    "Pesa 1.850 kg y rinde 4,5 L/100 km": "Pesa mil ochocientos cincuenta kilos y rinde cuatro coma cinco litros cada cien kilómetros",
    "45 kWh y 1 kW": "Cuarenta y cinco kilovatios hora y un kilovatio",
    "21 baterías y 21 km": "Veintiuna baterías y veintiún kilómetros",
    "1 hora y 1 millón de autos": "Una hora y un millón de autos",
    "El 3.º lugar y la 2.ª versión": "El tercer lugar y la segunda versión",
    "El Kia EV3 y el Deepal S05": "El Kia e uve tres y el Dípal S cero cinco",
    "Leapmotor C10": "Lip motor ce diez",
    "Carga 2× más rápido: +181 km": "Carga dos veces más rápido: más ciento ochenta y un kilómetros",
    "En 2,05 s": "En dos coma cero cinco segundos",
    "a −7 °C": "A menos siete grados",
    "¡Hola! ¿Lo comprarías?! Llegó el EV3!": "Hola. ¿Lo comprarías? Llegó el e uve tres.",
    "Vende 1.234.567 carros": "Vende un millón doscientos treinta y cuatro mil quinientos sesenta y siete carros",
}


def main():
    dic = json.load(open(p.DICCIONARIO, encoding="utf-8"))
    fallos = 0
    for texto, esperado in CASOS.items():
        sale = p.a_voz(texto, dic)
        if sale != esperado:
            fallos += 1
            print(f"FALLA  {texto}\n  sale:     {sale}\n  esperado: {esperado}")
    print(f"{len(CASOS) - fallos}/{len(CASOS)} bien")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
