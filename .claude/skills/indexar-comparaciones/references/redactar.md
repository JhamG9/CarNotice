# Cómo escribir el texto de una comparación

Proyecto: /Users/jhamgiron/Desktop/garash (sitio Mejor Eléctrico, en español, para lectores de toda Latinoamérica y España).
Cada comparación ya tiene página en /es/comparador/<par>/ con el comparador, el gráfico y unas «Preguntas rápidas»
automáticas. Lo que falta, y lo que escribes, es el texto propio bajo el título «¿Cuál conviene?»: el análisis que una
persona haría al comparar los dos carros. Es lo que hará que Google indexe la página, así que tiene que ser útil y
distinto en cada comparación, no una plantilla con los nombres cambiados.

## Datos

- Usa SOLO los datos de `fichas.json` (en la carpeta de trabajo del lote, la que te indiquen).
  Son exactamente las dos versiones que compara la página (las más básicas del mercado que comparten). Busca cada
  carro por marca, modelo y mercado. El significado de cada campo está en /Users/jhamgiron/Desktop/garash/README.md,
  sección «Base de datos: tabla vehicles» (léela antes).
- Nada de otras fuentes ni de memoria: ni precios, ni ventas, ni historia de la marca, ni versiones que no estén en
  la ficha. Si un dato falta en una de las dos fichas, no lo compares, o di que no hay dato.
- Autonomía: solo se comparan cifras del mismo ciclo (WLTP con WLTP). Si un carro es de rango extendido o híbrido,
  dilo y trátalo como tal.
- Cifras exactas como en la ficha, con coma decimal (42,2 kWh), unidades km, kW, kWh, litros, mm, kg, s. Si das
  potencia en hp, usa `power_hp` de la ficha.
- Di en el primer párrafo qué versiones y de qué mercado se comparan (por ejemplo «las versiones de entrada que se
  venden en Colombia», o «las fichas europeas»), porque cambian de batería y equipo según el país.

## Qué escribir

- Entre 300 y 450 palabras, en 4 a 6 párrafos. Sin título principal (la página ya lo tiene). Puedes usar uno o dos
  subtítulos `###` si ayudan, no es obligatorio.
- Interpreta, no enumeres: cada dato va con lo que significa para quien compra (más autonomía para quien viaja, más
  baúl para una familia, carga rápida lenta en un viaje largo, tracción, tamaño para ciudad).
- Termina diciendo para quién conviene cada uno, con razones concretas. No declares un ganador absoluto si los datos
  no lo dan, y aclara que la comparación no tiene en cuenta el precio.
- Español neutro. «Baúl» o «maletero» (usa «baúl»), «carro».

## Reglas de redacción (obligatorias, de CLAUDE.md del proyecto)

1. Sin comentario de relleno («es importante señalar que», «vale la pena destacar», «cabe mencionar»).
2. Sin cierres estereotipados («en conclusión», «en resumen», «en general», «para finalizar»).
3. Sin calificativos promocionales («impresionante», «revolucionario», «excelente») salvo que un dato en la misma
   frase lo justifique.
4. Nada vago ni grandilocuente sin evidencia.
5. Cada hecho con su interpretación, causa o consecuencia.
6. Nada inventado.
7. Sin frases de chatbot.
8. Comillas correctas, sin marcado roto. Rayas largas (—) solo si son gramaticalmente necesarias; mejor coma o punto.
9. Como mucho un conector de relleno («además», «por otra parte», «asimismo») por párrafo.
10. Varía la longitud y la estructura de los párrafos. Evita listas de tres por costumbre.
11. Sin placeholders ni restos técnicos.

## Archivo

Crea /Users/jhamgiron/Desktop/garash/src/content/comparaciones/<par>.md (el nombre exacto del par que te dieron):

```markdown
---
descripcion: "Una frase de 120 a 160 caracteres para Google: qué se compara y la diferencia principal."
fecha: AAAA-MM-DD   # la fecha del día
---

Primer párrafo...
```

Al terminar, cuenta las palabras de cada archivo (`wc -w`) y relee cada uno contra las reglas. Devuelve la lista de
archivos con su número de palabras y, por cada uno, las cifras que usaste con el campo de la ficha de donde salió.
No edites ningún otro archivo del proyecto.
