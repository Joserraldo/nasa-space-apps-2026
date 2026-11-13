"""docs/science/glosario.md + textos de "Datos usados" → data/i18n/{es,en}.json. Uso: python -I data/scripts/glosario.py"""
import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
filas = [l for l in (RAIZ / "docs/science/glosario.md").read_text(encoding="utf-8").splitlines() if l.startswith("| ") and not l.startswith("| Palabra")]


def slug(w: str) -> str:
    w = unicodedata.normalize("NFD", w).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", w).strip("-")


USADOS = {
    "datos.usados.titulo": ("Datos de NASA que usamos y por qué", "NASA data we used and why"),
    "datos.usados.donki": ("Las tormentas son reales: salen de DONKI, la base de datos de clima espacial de la NASA, con su código y su fecha.",
                           "The storms are real: they come from DONKI, NASA's space weather database, with their code and date."),
    "datos.usados.radlab": ("Lo que pasó en Marte lo midió el detector RAD del rover Curiosity (datos de NASA OSDR RadLab).",
                            "What happened on Mars was measured by the RAD detector on the Curiosity rover (data from NASA OSDR RadLab)."),
    "datos.usados.trek": ("El mapa de Jezero viene de NASA Mars Trek: la altura del suelo es real, y con ella calculamos qué tan plano, soleado y protegido es cada lugar.",
                          "The Jezero map comes from NASA Mars Trek: the ground height is real, and we used it to work out how flat, sunny and protected each place is."),
    "datos.usados.osdr": ("Las tarjetas de ciencia cuentan experimentos reales guardados en NASA OSDR.",
                          "The science cards tell about real experiments stored in NASA OSDR."),
    "datos.usados.dosis": ("Las dosis de radiación vienen de artículos científicos: la de Marte, del rover Curiosity (NASA); las de la Luna y la Estación Espacial, de un estudio de la misión china Chang’e-4.",
                           "Radiation doses come from scientific papers: Mars from the Curiosity rover (NASA); the Moon and the Space Station from a study of China's Chang’e-4 mission."),
    "datos.usados.noEnVivo": ("Todos estos datos están guardados en el juego: son reales, pero no en vivo.",
                              "All this data is saved in the game: it is real, but not live."),
}

for lang, col_palabra, col_def in (("es", 0, 2), ("en", 1, 3)):
    p = RAIZ / f"data/i18n/{lang}.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    d = {k: v for k, v in d.items() if not k.startswith("datos.glosario.")}
    for f in filas:
        c = [x.strip() for x in f.strip().strip("|").split("|")]
        k = slug(c[0])
        d[f"datos.glosario.{k}.palabra"] = c[col_palabra]
        d[f"datos.glosario.{k}.def"] = c[col_def]
    for k, v in USADOS.items():
        d[k] = v[0] if lang == "es" else v[1]
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(f"{len(filas)} palabras")
