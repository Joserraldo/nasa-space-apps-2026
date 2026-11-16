"""Ilustraciones de la órbita (E3): Marte y satélite optimizados en AVIF y WebP.

Lee las capas separadas de tests/capturas/ilustraciones/fuente/ (PNG con transparencia) y escribe en
ui/public/ilustraciones/: orbita-marte-320/548 y orbita-satelite-96/178, en .avif (q92, 4:4:4) y .webp
(q92). Nunca amplía: si el ancho pedido supera el de la fuente, se omite.

Uso (desde la raíz del repo): python tests/capturas/orbita.py
Requiere Pillow con soporte AVIF y WebP.
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
FUENTE = RAIZ / "tests/capturas/ilustraciones/fuente"
SALIDA = RAIZ / "ui/public/ilustraciones"
PIEZAS = {
    "orbita-marte": [320, 548],
    "orbita-satelite": [96, 178],
}
CALIDAD = 92

SALIDA.mkdir(parents=True, exist_ok=True)
for nombre, anchos in PIEZAS.items():
    img = Image.open(FUENTE / f"{nombre}.png").convert("RGBA")
    for ancho in anchos:
        if ancho > img.width:
            continue
        alto = round(img.height * ancho / img.width)
        r = img if ancho == img.width else img.resize((ancho, alto), Image.LANCZOS)
        for ext, opciones in (("avif", {"quality": CALIDAD, "subsampling": "4:4:4"}), ("webp", {"quality": CALIDAD, "method": 6})):
            destino = SALIDA / f"{nombre}-{ancho}.{ext}"
            r.save(destino, **opciones)
            print(f"{destino.relative_to(RAIZ)}  {r.width}x{r.height}  {destino.stat().st_size} B")
