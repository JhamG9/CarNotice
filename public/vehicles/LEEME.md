# Imágenes de los vehículos del comparador

Una imagen por vehículo, referenciada desde la columna `image_url` de la tabla `vehicles`.

- Formato WebP, unos 1.600 px de ancho, menos de 300 KB, proporción 16:9.
- Nombre: el `slug` del vehículo, por ejemplo `deepal-s05-620-premium-lidar-2027-cn.webp`.
- En la base de datos se guarda la ruta, sin dominio: `/vehicles/deepal-s05-620-premium-lidar-2027-cn.webp`.
- No renombrar ni mover un archivo ya referenciado: la base de datos seguiría apuntando a la ruta vieja.

Cada foto lleva su crédito en las columnas `image_credit` (autor y licencia) e `image_source_url` (página de la foto). Varias versiones del mismo modelo pueden compartir la foto: se copia con el `slug` de cada una.

Las fotos de las notas no van aquí: van en `src/assets/images/`.
