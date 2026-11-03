# Verificar textos de comparación

Lee `references/redactar.md` de la skill `indexar-comparaciones`
(las reglas con que se escribieron) y verifica los archivos que te asignen en
/Users/jhamgiron/Desktop/garash/src/content/comparaciones/. Los datos de verdad están en `fichas.json`, en la carpeta
de trabajo del lote que te indiquen. No escribiste estos textos: busca lo que no se sostiene.

Para cada archivo comprueba:

1. **Cada cifra** (batería, autonomía y su ciclo, potencia, hp, torque, aceleración, velocidad, carga DC/AC y su rango
   de %, minutos, baúl, medidas, peso, garantías, pantalla, airbags, estrellas NCAP) coincide con su campo en la ficha
   de ESA versión y mercado. Las diferencias calculadas (restas, «casi el doble») tienen que salir bien.
2. **Nada de fuera de la ficha:** sin precios, ventas, historia, ni cálculos inventados (por ejemplo «kWh útiles» o
   porcentajes de batería que la ficha no trae). Si aparece, quítalo.
3. **Vacío no es «no lo tiene»:** un campo ausente o null en la ficha es «sin dato». Solo `false` permite decir que
   no lo trae de serie. Corrige cualquier frase que convierta un dato que falta en una ausencia.
4. **Autonomía:** solo se comparan cifras del mismo ciclo; rango extendido e híbridos dichos como tales.
5. **El primer párrafo** dice qué versiones y de qué mercado. **El cierre** dice para quién conviene cada uno y que no
   se tiene en cuenta el precio.
6. **Reglas de redacción** de las instrucciones (sin relleno, sin cierres de manual, sin promoción, máximo un conector
   por párrafo, rayas largas solo si son necesarias).
7. **Frontmatter:** `descripcion` de 160 caracteres o menos y fiel al texto; `fecha` con la fecha del lote. Cuerpo de 300 a 450
   palabras (cuenta sin el frontmatter).

Corrige tú mismo los errores, directamente en el archivo, con el cambio mínimo. No reescribas lo que está bien ni
toques otros archivos. Devuelve una tabla: archivo, problema encontrado, corrección hecha (o «sin cambios»). Termina
con una línea `TODO VERIFICADO` o `QUEDAN DUDAS:` y cuáles.
