# Formato noticia: contar una noticia como historia

Para vídeos que llegan por la página de inicio y las sugerencias de YouTube, no por búsqueda. La gente no busca el
tema: se queda porque quiere saber cómo termina. Funciona para cualquier nicho (carros, mascotas, zapatos…) con una
noticia que tenga conflicto. En el plan: `"formato": "noticia"` (activa la revisión de enganche de `video.py`).

## Qué noticia sirve

- Tiene **protagonistas** (una marca, una persona, un país, un gobierno) y **algo en juego** (mercado, dinero, seguridad, una regla).
- Tiene **un antes y un después**: algo cambió y alguien gana o pierde.
- Hay **vídeo real** para contarla: salas de prensa de las marcas, organismos oficiales, ferias. Sin vídeo, mejor otro tema.
- Los datos tienen fuente (la nota del sitio, si existe). La historia no inventa nada: el drama sale de los hechos.

## Estructura

| Parte | Cuándo | Qué hace |
|---|---|---|
| Gancho | 0–10 s | El conflicto en una frase, con imagen que lo muestra. «Tesla dominaba Colombia. En seis meses, eso cambió.» Nada de presentación. |
| Promesa | 10–30 s | Qué va a saber quien se quede: «cómo pasó, quién gana y qué significa si vas a comprar». |
| Contexto | 30–90 s | Cómo estaban las cosas antes. Los protagonistas y lo que tenían. |
| Detonante | — | El hecho que lo cambia todo, con su cifra. |
| Desarrollo | 2–3 capítulos | Cada capítulo responde una pregunta y **termina abriendo otra** («pero eso no fue lo más raro…»). |
| Giro | a mitad del vídeo | Un dato o un hecho que cambia cómo se veía la historia. |
| Desenlace | — | Responde la pregunta del gancho, con su consecuencia para quien mira. |
| Cierre | 15–20 s | Qué viene ahora y una sola petición (comentar o suscribirse). |

## Reglas de enganche (las revisa `video.py`)

1. **Vídeo en movimiento en dos de cada tres escenas** (`Clips` con `video`). Las fotos y las tarjetas solo para los
   datos clave. Con menos, el informe lo marca.
2. **Nada igual más de 20 s**: cambia de toma, de escena o de dato. Una escena larga se parte en tomas (`clips` con
   2–4 vídeos que cambian en las palabras clave).
3. **Un golpe cada 30–40 s**: una cifra que sorprende (`contador`), una pregunta (`pregunta`), un «no es X, es Y»
   (`tachado`) o un giro. El informe avisa de los tramos largos sin golpe.
4. **Preguntas abiertas entre capítulos**: la última frase de cada capítulo deja algo pendiente; la primera del
   siguiente lo retoma.
5. **El gancho se ve, no solo se dice**: la primera escena es vídeo con el titular encima (`Clips` con `lineas`).
6. **Honestidad**: el gancho no promete lo que el vídeo no da. Nada de «increíble» ni «nadie te lo cuenta» sin un dato.

## Recursos de vídeo

- Salas de prensa de las marcas y de los organismos (vídeos para uso informativo): `buscar_recursos.py` de jham-reels
  los baja, los pasa a 1080p y propone tomas. Anota la fuente en cada clip.
- Ferias y presentaciones oficiales (transmisiones de la marca en su web, no en su canal de YouTube).
- No usar vídeos de canales de YouTube (ni de las marcas): YouTube los reclama por Content ID.
- Planifica 8–15 tomas distintas para un vídeo de 5 minutos; una misma toma no se repite más de dos veces.

## Duración

De 4 a 8 minutos. Una noticia rara vez sostiene más; si hay material para más, son dos vídeos.
