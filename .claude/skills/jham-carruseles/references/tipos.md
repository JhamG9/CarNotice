# Tipos de carrusel

Un carrusel funciona cuando alguien quiere guardarlo para después o mandárselo a otra persona. Antes de empezar,
responde: ¿a quién le sirve esto y por qué lo guardaría? Si la respuesta es «a quien esté entre estos dos carros», el
público es muy pequeño: busca un ángulo más amplio.

Los ejemplos de abajo son de carros, porque es el tema de Mejor Eléctrico, pero las estructuras sirven para
cualquier tema: «Los 5 platos más premiados de Latinoamérica» es un ranking, «Cómo elegir un juguete seguro para tu
perro» es una guía.

## Medidas

- **De 5 a 8 láminas** casi siempre. El máximo de la API es 10.
- **Portada:** promete algo concreto con un número o una pregunta («Los 5 eléctricos con más autonomía en
  Colombia»). Título de 2 o 3 líneas cortas.
- **Una idea por lámina.** Si una lámina necesita dos títulos, son dos láminas.
- **Cierre:** qué hacer ahora (guardarlo, comparar en mejorelectrico.com, comentar). Una sola acción.
- Las reglas de redacción de `CLAUDE.md` valen aquí: sin relleno, sin calificativos sin dato, sin listas de tres por
  costumbre.

## Ranking

Una lista ordenada por un dato: autonomía, carga rápida, maletero, potencia, tamaño.

- **Estructura:** portada → una lámina `ranking` por puesto (del último al primero, para que la curiosidad aguante,
  o del primero al último si el primero es la noticia) → lámina `texto` o `dato` con el criterio y lo que no entró →
  `cierre`.
- **Criterio escrito y justo:** mismo ciclo (WLTP con WLTP), mismo mercado, mismas versiones (la mejor de cada
  modelo, o la más básica: dilo). Un modelo cuenta una vez.
- **Di el universo:** «entre los carros del comparador de Mejor Eléctrico» y qué quedó fuera (los que solo tienen
  cifra NEDC o CLTC, por ejemplo). Es honesto y lleva al sitio.
- La `barra` de cada puesto es su valor dividido por el del primero.
- En las `notas` va lo que interpreta el dato (batería, precio si hay fuente, para qué le sirve a quién), no otra
  cifra suelta.

## Guía práctica

Cómo hacer algo: qué revisar antes de comprar un usado, cómo planear un viaje largo, cómo leer los ciclos de
autonomía, cómo cargar en casa.

- **Estructura:** portada con la promesa → láminas `lista` o `texto` con los pasos (uno o dos por lámina) → un `dato`
  que muestre por qué importa → `cierre` con «Guárdalo».
- Cada paso con su porqué y su fuente (manual, organismo oficial, fabricante).

## Comparación

Dos carros que la gente compara de verdad (los mismos rivales que tienen página en el comparador, o los que más se
buscan).

- **Estructura:** portada con los dos → una `comparacion` por área (autonomía y carga, espacio, potencia) → un `dato`
  o `texto` con el veredicto y para quién conviene cada uno → `cierre` con el enlace al comparador.
- Mismo mercado y versiones equivalentes. Si no comparten mercado, dilo.
- Marca con `gana` solo lo que es mejor sin discusión. Más batería no es mejor por sí sola; más autonomía con el mismo
  ciclo, sí.

## Mito o duda

Una creencia común y lo que dicen los datos: «¿cargar al 100 % daña la batería?», «¿los eléctricos se incendian
más?».

- **Estructura:** portada con la pregunta → `texto` con lo que se cree → `dato` con lo que mide la fuente → `texto`
  con el matiz (cuándo sí importa) → `cierre`.
- La respuesta llega a mitad del carrusel, no en la portada: la portada abre la pregunta.

## Noticia

Un lanzamiento, una llegada a un país, un cambio de norma.

- **Estructura:** portada con el titular y la foto → `dato` con la cifra principal → `lista` o `ranking` con
  versiones, precios o fechas → `texto` con lo que cambia para quien compra → `cierre`.
- Fecha y fuente de cada precio. Los precios cambian: anótalo en `guion.md` para revisarlo antes de publicar.
