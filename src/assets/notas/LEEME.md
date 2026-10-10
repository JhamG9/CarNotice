# Fotos de las notas

Aquí van las fotos reales de las notas. Mientras una nota no tenga foto, la plantilla pinta un marcador de posición.

- Origen: salas de prensa oficiales de los fabricantes. Nada de fotos de stock.
- Proporción 16:9, mínimo 1600 × 900 px. La plantilla recorta a 16:9 si no coincide.
- Nombre: el slug de la nota, por ejemplo `suv-electrico-compacto-llega-a-la-region.jpg`.

En el Markdown de la nota:

```yaml
imagen: ../../assets/notas/suv-electrico-compacto-llega-a-la-region.jpg
imagenAlt: "Descripción breve de lo que se ve en la foto"
```

`imagenAlt` es obligatorio cuando hay `imagen`.
