"""Crea la carpeta de trabajo de un vídeo largo (horizontal, 1920×1080) y deja todo listo para renderizar.

Uso:
  python3 preparar.py ~/video                 copia la plantilla horizontal, instala dependencias, busca navegador y ffmpeg
  python3 preparar.py ~/video --actualizar    vuelve a copiar el motor sin tocar src/datos, public/ ni src/propias

Es el mismo preparar.py de jham-reels con la plantilla de esta skill: instalación, navegador y ffmpeg se comparten.
"""
import importlib.util
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
REELS = os.path.join(os.path.dirname(os.path.dirname(AQUI)), "jham-reels", "scripts")

spec = importlib.util.spec_from_file_location("preparar_reels", os.path.join(REELS, "preparar.py"))
preparar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preparar)
preparar.PLANTILLA = os.path.join(os.path.dirname(AQUI), "assets", "plantilla")

if __name__ == "__main__":
    if not os.path.isdir(REELS):
        sys.exit(f"No encuentro la skill jham-reels en {REELS}: esta skill usa sus scripts de voz, música y alineado.")
    preparar.main()
