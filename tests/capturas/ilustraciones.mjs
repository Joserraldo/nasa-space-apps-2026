// Recorta fuentes RGBA originales y codifica AVIF/WebP sin ampliación.
// Uso desde la raíz: node tests/capturas/ilustraciones.mjs
import { spawnSync } from "node:child_process";

const PYTHON = String.raw`
from pathlib import Path
from PIL import Image
import hashlib, json, sys

root = Path.cwd()
source = root / "tests/capturas/ilustraciones/fuente"
output = root / "ui/public/ilustraciones"
docs = root / "assets/ilustraciones-entrada"
output.mkdir(parents=True, exist_ok=True)
docs.mkdir(parents=True, exist_ok=True)

# Retira únicamente nuestros artefactos de la corrida previa, si aún coinciden con su SHA.
previous = docs / "manifest.json"
if previous.is_file():
    old = json.loads(previous.read_text(encoding="utf-8"))
    for asset in old.get("assets", []):
        for variant in asset.get("outputs", []):
            for info in variant.get("outputs", {}).values():
                stale = root / info.get("path", "")
                if stale.is_file() and hashlib.sha256(stale.read_bytes()).hexdigest() == info.get("sha256"):
                    stale.unlink()

assets = [
    ("portada-nino", (448, 656)),
    ("portada-nave", (280, 560)),
    ("portada-planeta", (200, 400)),
    ("portada-asteroide", (120, 240)),
    ("carga-nino", (200, 384)),
    ("carga-panel", (140, 280)),
    ("carga-invernadero", (130, 248)),
    ("carga-habitat", (180, 360)),
]
records, missing = [], []
for name, requested_widths in assets:
    src = source / (name + ".png")
    if not src.is_file():
        missing.append(src.relative_to(root).as_posix())
        continue
    raw = src.read_bytes()
    original = Image.open(src)
    original.load()
    size_source = list(original.size)
    profile = original.info.get("icc_profile")
    gamma = original.info.get("gamma")
    rgba = original.convert("RGBA")
    # Ignora motas alfa invisibles fuera de la ilustración (método del generador anterior).
    bounds = rgba.getchannel("A").point(lambda value: 255 if value > 24 else 0).getbbox()
    if bounds is None:
        raise RuntimeError(name + ": source alpha is empty")
    x0, y0, x1, y1 = bounds
    margin = 4
    crop = (max(0, x0-margin), max(0, y0-margin),
            min(rgba.width, x1+margin), min(rgba.height, y1+margin))
    cropped = rgba.crop(crop)
    variants = []
    for requested in requested_widths:
        width = min(requested, cropped.width)
        height = max(1, round(cropped.height * width / cropped.width))
        # Resize premultiplied alpha to prevent fringe halos; RGB values otherwise stay in source space.
        resized = cropped.convert("RGBa").resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")
        alpha = list(resized.getchannel("A").getextrema())
        if alpha != [0, 255]:
            raise RuntimeError(name + "-" + str(width) + ": alpha lost " + repr(alpha))
        outputs = {}
        for fmt in ("avif", "webp"):
            dest = output / (name + "-" + str(width) + "." + fmt)
            options = {"quality": 92, "method": 6}
            if fmt == "avif":
                options.update({"subsampling": "4:4:4", "speed": 6})
            else:
                options.update({"exact": True})
            if profile:
                options["icc_profile"] = profile
            resized.save(dest, format=fmt.upper(), **options)
            with Image.open(dest) as encoded:
                encoded.load()
                encoded_alpha = list(encoded.convert("RGBA").getchannel("A").getextrema())
                if encoded.size != (width, height) or encoded_alpha != [0, 255]:
                    raise RuntimeError(dest.name + ": encoded dimensions/alpha invalid")
            outputs[fmt] = {
                "path": dest.relative_to(root).as_posix(),
                "width_px": width, "height_px": height,
                "bytes": dest.stat().st_size,
                "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(),
                "quality": 92,
                "chroma": "4:4:4" if fmt == "avif" else None,
                "alpha_extrema_verified": encoded_alpha,
            }
        variants.append({"requested_width_px": requested, "actual_width_px": width,
                         "height_px": height, "upscaled": False, "outputs": outputs})
    records.append({
        "id": name, "source_path": src.relative_to(root).as_posix(),
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "source_bytes": len(raw), "source_dimensions_px": size_source,
        "source_mode": original.mode, "source_has_icc": profile is not None,
        "source_gamma": gamma,
        "color_note": "source samples kept in original encoding; ICC passed through if supplied",
        "alpha_threshold": 24, "alpha_bounds_exclusive_px": list(bounds), "crop_margin_px": margin,
        "crop_box_exclusive_px": list(crop),
        "crop_dimensions_px": [cropped.width, cropped.height],
        "outputs": variants,
    })

manifest = {
    "generator": "tests/capturas/ilustraciones.mjs + Pillow",
    "formats": {"avif": {"quality": 92, "chroma": "4:4:4", "alpha": True},
                "webp": {"quality": 92, "alpha": True}},
    "no_upscaling": True, "missing_sources": missing, "assets": records,
}
(docs / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"assets": len(records), "missing": missing,
                  "outputs": sum(len(a["outputs"]) * 2 for a in records),
                  "actual_widths": {a["id"]: [v["actual_width_px"] for v in a["outputs"]] for a in records}},
                 ensure_ascii=False))
if missing:
    sys.exit(2)
`;

const result = spawnSync("python", ["-c", PYTHON], { cwd: process.cwd(), encoding: "utf8" });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
