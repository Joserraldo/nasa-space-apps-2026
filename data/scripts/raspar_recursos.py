"""Raspa las páginas de la pestaña Resources del reto (lista oficial) → data/raw/recursos/.

Uso (venv fuera del repo con `pip install "scrapling[fetchers,rag]"`, SIN `scrapling install`):
    python -I data/scripts/raspar_recursos.py            # todo
    python -I data/scripts/raspar_recursos.py csa-food   # solo una fuente (por id)

Reglas: solo fuentes de la lista oficial; robots.txt se respeta; una petición cada PAUSA segundos;
User-Agent genérico; nada de navegadores, antibots ni logins. No usa la clave de NASA.
Guarda Markdown limpio (no el HTML) + meta.json con URL, fecha de consulta, dueño y estado HTTP.
Lo crudo NO es "en vivo": es una copia con fecha de consulta.
Las fuentes con "chrome": True necesitan JavaScript: sus notas se escribieron a mano con Claude in Chrome y
solo se vuelven a raspar si se piden por id.
"""
import json
import re
import sys
import time
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from scrapling.fetchers import Fetcher

RAIZ = Path(__file__).resolve().parents[2]
SALIDA = RAIZ / "data/raw/recursos"
UA = "Mozilla/5.0 (compatible; edu-hackathon-research/0.1; static copy for a kids' science game)"
PAUSA = 4.0
HOY = date.today().isoformat()

# Lista oficial: pestaña Resources del reto, leída con Chrome el 2026-11-14 (ver reto-resources.md).
FUENTES = [
    # nasa-open-apis: se baja aparte con nasa_apis() (sus archivos estáticos).
    {"id": "donki", "url": "https://ccmc.gsfc.nasa.gov/tools/DONKI/", "dueno": "NASA CCMC"},
    {"id": "osdr-repo", "chrome": True, "url": "https://osdr.nasa.gov/bio/repo/", "dueno": "NASA OSDR"},
    {"id": "radlab-data-api", "url": "https://visualization.osdr.nasa.gov/radlab/gui/data-api/", "dueno": "NASA OSDR"},
    {"id": "mars-trek", "chrome": True, "url": "https://trek.nasa.gov/mars/", "dueno": "NASA JPL"},
    {"id": "csa-stem", "url": "https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp",
     "dueno": "Agencia Espacial Canadiense (CSA), socio, no NASA"},
    {"id": "csa-food", "url": "https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/",
     "dueno": "Agencia Espacial Canadiense (CSA), socio, no NASA",
     # El kit es un "paquete web": se siguen (un salto, mismo sitio) solo las páginas de comida que enlaza.
     "seguir": ["/eng/sciences/food-production/", "/eng/youth-educators/activities/fitness-and-nutrition/",
                "/eng/astronauts/living-in-space/eating-in-space", "/eng/youth-educators/tomatosphere",
                "/eng/youth-educators/activities/tomatosphere"], "max": 15},
]

# OSDR search API (recurso oficial con API): se usa la API, no scraping.
OSDR_API = "https://osdr.nasa.gov/osdr/data/search"
# Temas que nombra el reto (huesos, músculo, inmunidad, sueño) + los del juego (radiación, plantas, comida).
OSDR_TERMINOS = ["radiation", "plant", "food", "bone", "muscle", "immune", "sleep"]
OSDR_PAGINA = 100

_robots: dict[str, RobotFileParser] = {}
_ultima = 0.0


def permitido(url: str) -> bool:
    base = "{0.scheme}://{0.netloc}".format(urlparse(url))
    if base not in _robots:
        rp = RobotFileParser()
        try:
            r = pedir(base + "/robots.txt", respetar=False)
            rp.parse(r.body.decode("utf-8", "replace").splitlines() if r.status == 200 else [])
        except Exception:
            rp.parse([])  # sin robots.txt legible: se permite, con la misma pausa
        _robots[base] = rp
    return _robots[base].can_fetch(UA, url)


def pedir(url: str, respetar: bool = True, params: dict | None = None):
    global _ultima
    if respetar and not permitido(url):
        raise PermissionError(f"robots.txt no permite {url}")
    espera = PAUSA - (time.monotonic() - _ultima)
    if espera > 0:
        time.sleep(espera)
    _ultima = time.monotonic()
    return Fetcher.get(url, headers={"User-Agent": UA}, stealthy_headers=False, timeout=40, retries=1, params=params)


def slug(url: str) -> str:
    p = urlparse(url).path.strip("/").split("/")[-1] or "index"
    return re.sub(r"[^a-z0-9]+", "-", p.lower().replace(".asp", "")).strip("-") or "index"


# Correos de contacto institucional que sí se pueden guardar; cualquier otro (p. ej. de investigadores) se oculta.
CORREOS_PERMITIDOS = {"info@asc-csa.gc.ca", "contact-ssd-api@jpl.nasa.gov", "marstrek@jpl.nasa.gov", "genelab-outreach@lists.nasa.gov"}
# Restos del pie de página de canada.ca que no aportan nada.
RUIDO = re.compile(r'^\s*(\[Top of page\]\(#top[^)]*\)|.*Date modified:.*)\s*$', re.M)


def limpiar(texto: str) -> str:
    """Oculta correos personales (privacidad) y quita restos de navegación."""
    texto = re.sub(r"[\w.+-]+@[\w-]+(\.[\w-]+)+",
                   lambda m: m.group(0) if m.group(0).lower() in CORREOS_PERMITIDOS else "[correo omitido]", texto)
    return re.sub(r"\n{3,}", "\n\n", RUIDO.sub("", texto))


def guardar(carpeta: Path, nombre: str, url: str, r, dueno: str) -> dict:
    carpeta.mkdir(parents=True, exist_ok=True)
    md = ""
    if r.status == 200:
        md = limpiar((r.markdown(css_selector="main") if r.css("main") else r.markdown(main_content_only=True)).strip())
    (carpeta / f"{nombre}.md").write_text(
        f"<!-- Fuente: {url} · Dueño: {dueno} · Consultado: {HOY} · Copia estática, no en vivo -->\n\n{md}\n", encoding="utf-8", newline="\n")
    return {"url": url, "archivo": f"{nombre}.md", "estado": r.status, "caracteres": len(md)}


def raspar(f: dict) -> dict:
    carpeta = SALIDA / f["id"]
    meta = {"id": f["id"], "dueno": f["dueno"], "consultadoEl": HOY, "paginas": []}
    try:
        r = pedir(f["url"])
        meta["paginas"].append(guardar(carpeta, "index", f["url"], r, f["dueno"]))
        if f.get("seguir") and r.status == 200:
            vistos = {f["url"].rstrip("/")}
            enlaces = (r.css("main a::attr(href)") or r.css("a::attr(href)")).getall()
            for href in enlaces:
                u = urljoin(f["url"], href).split("#")[0]
                mismo = urlparse(u).netloc == urlparse(f["url"]).netloc
                if mismo and urlparse(u).path.startswith(tuple(f["seguir"])) and u.rstrip("/") not in vistos and len(vistos) <= f["max"]:
                    vistos.add(u.rstrip("/"))
                    try:
                        meta["paginas"].append(guardar(carpeta, slug(u), u, pedir(u), f["dueno"]))
                    except PermissionError as e:
                        meta["paginas"].append({"url": u, "error": str(e)})
    except Exception as e:  # se anota y se sigue con la siguiente fuente
        meta["error"] = f"{type(e).__name__}: {e}"[:300]
    carpeta.mkdir(parents=True, exist_ok=True)
    (carpeta / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return meta


def nasa_apis() -> dict:
    """api.nasa.gov se arma con JavaScript, pero su contenido está en archivos estáticos (lo vimos con Chrome):
    assets/html/overview.html, authentication.html y assets/json/apis.json (documentación de cada API)."""
    from markdownify import markdownify

    base = "https://api.nasa.gov/assets/"
    carpeta = SALIDA / "nasa-open-apis"
    meta = {"id": "nasa-open-apis", "dueno": "NASA", "consultadoEl": HOY, "paginas": [],
            "nota": "index.md: notas leídas con Claude in Chrome. El resto sale de los archivos estáticos que carga la página."}
    for nombre in ("overview", "authentication"):
        r = pedir(f"{base}html/{nombre}.html")
        meta["paginas"].append(guardar(carpeta, nombre, f"{base}html/{nombre}.html", r, "NASA"))
    r = pedir(f"{base}json/apis.json")
    for api in r.json() if r.status == 200 else []:
        nombre = "api-" + re.sub(r"[^a-z0-9]+", "-", api["name"].lower()).strip("-")
        md = limpiar(markdownify(api.get("html_template", ""), heading_style="ATX").strip())
        (carpeta / f"{nombre}.md").write_text(
            f"<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «{api['name']}») · Dueño: NASA · Consultado: {HOY} · Copia estática, no en vivo -->\n\n{md}\n",
            encoding="utf-8", newline="\n")
        meta["paginas"].append({"url": f"{base}json/apis.json#{api['name']}", "archivo": f"{nombre}.md", "estado": r.status, "caracteres": len(md)})
    (carpeta / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return meta


CAMPOS_OSDR = ["Accession", "Study Title", "organism", "Project Type", "Flight Program", "Mission",
               "Study Factor Name", "Study Assay Measurement Type", "Study Publication Title", "Study Description"]


def resumir(h: dict) -> dict:
    """Solo lo útil para tarjetas de ciencia (ID real del estudio y de qué trata). El JSON completo pesa ~250 KB por búsqueda."""
    out = {k: h.get(k) for k in CAMPOS_OSDR if h.get(k) not in (None, "", {"Start Date": "", "End Date": "", "Name": ""})}
    if isinstance(out.get("Study Description"), str) and len(out["Study Description"]) > 600:
        out["Study Description"] = out["Study Description"][:600] + "…"
    if out.get("Accession"):
        out["url"] = f"https://osdr.nasa.gov/bio/repo/data/studies/{out['Accession']}"
    return out


def osdr_busquedas() -> dict:
    carpeta = SALIDA / "osdr-search-api"
    carpeta.mkdir(parents=True, exist_ok=True)
    meta = {"id": "osdr-search-api", "dueno": "NASA OSDR", "consultadoEl": HOY, "consultas": []}
    for t in OSDR_TERMINOS:
        estudios, total, desde = [], None, 0
        params = {"term": t, "type": "cgene", "size": OSDR_PAGINA}
        try:
            while total is None or desde < total:  # todas las páginas, no solo la primera
                r = pedir(OSDR_API, params={**params, "from": desde})
                if r.status != 200:
                    raise RuntimeError(f"HTTP {r.status} en from={desde}")
                hits = r.json().get("hits") or {}
                total = int(hits.get("total") or 0)
                lote = hits.get("hits", [])
                if not lote:
                    break
                estudios += [resumir(h.get("_source", {})) for h in lote]
                desde += len(lote)
            (carpeta / f"{t}.json").write_text(json.dumps(estudios, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
            meta["consultas"].append({"url": OSDR_API, "params": params, "estado": 200, "archivo": f"{t}.json", "total": total, "guardados": len(estudios)})
        except Exception as e:
            meta["consultas"].append({"url": OSDR_API, "params": params, "error": f"{type(e).__name__}: {e}"[:300]})
    (carpeta / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return meta


if __name__ == "__main__":
    solo = set(sys.argv[1:])
    for f in FUENTES:
        # Páginas que solo se leen con JavaScript: sus notas se escribieron con Claude in Chrome y no se pisan.
        if f.get("chrome") and f["id"] not in solo:
            continue
        if not solo or f["id"] in solo:
            m = raspar(f)
            print(f["id"], m.get("error") or [(p.get("estado"), p.get("caracteres")) for p in m["paginas"]])
    if not solo or "nasa-open-apis" in solo:
        m = nasa_apis()
        print("nasa-open-apis", [(p.get("archivo"), p.get("caracteres")) for p in m["paginas"]])
    if not solo or "osdr-search-api" in solo:
        m = osdr_busquedas()
        print("osdr-search-api", [(c.get("params", {}).get("term"), c.get("total"), c.get("guardados"), c.get("error")) for c in m["consultas"]])
