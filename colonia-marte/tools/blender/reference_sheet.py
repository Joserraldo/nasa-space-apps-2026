"""Assemble existing pixels only: real Blender render beside the preserved v1 frame."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("--output-dir", type=Path, default=ROOT / "docs/capturas")
parser.add_argument("--output", type=Path, help="Final sheet path; defaults to the output directory")
args = parser.parse_args()
OUT = args.output_dir
reference = Image.open(ROOT / "docs/referencias/v1/v1-t039.90.jpg").convert("RGB")
candidate = Image.open(OUT / "correcciones-2-base-three-quarter.png").convert("RGB")
views = json.loads((OUT / "correcciones-2-render-views.json").read_text(encoding="utf-8"))
# Manually identified VISIBLE hair-to-chin bounds of the foreground reference figure.
# These pixels do not measure the hidden skull, and the frame is not a calibrated orthographic view.
preview_to_native = reference.width / 2048
ref_box = [round(value * preview_to_native) for value in [729, 410, 1005, 772]]
render_box = views["three-quarter"]["head_bounds_px"]
reference_scale = .68
head_height = (ref_box[3] - ref_box[1]) * reference_scale
candidate_scale = head_height / (render_box[3] - render_box[1])
reference = reference.resize(tuple(round(n * reference_scale) for n in reference.size), Image.Resampling.LANCZOS)
candidate = candidate.resize(tuple(round(n * candidate_scale) for n in candidate.size), Image.Resampling.LANCZOS)
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
left_x, reference_y, gutter = 35, 120, 30
right_x = left_x + reference.width + gutter
candidate_y = round(reference_y + ref_box[1] * reference_scale - render_box[1] * candidate_scale)
sheet = Image.new("RGB", (right_x + candidate.width + 35, max(candidate_y + candidate.height + 80, 1100)), "#17232d")
sheet.paste(reference, (left_x, reference_y))
sheet.paste(candidate, (right_x, candidate_y))
draw = ImageDraw.Draw(sheet)
draw.text((35, 25), "T6.1 — visible head scale comparison", font=font, fill="white")
draw.text((35, 65), f"Hair-to-chin apparent height: {head_height:.1f} px in both panels.", font=small, fill="#c5dde9")
draw.text((left_x, reference_y - 30), "v1-t039.90.jpg / complete preserved frame", font=small, fill="white")
draw.text((right_x, candidate_y - 30), "Blender 5.3 / revised base / three-quarter", font=small, fill="white")
for x, box, scale, y in [(left_x, ref_box, reference_scale, reference_y),
                          (right_x, render_box, candidate_scale, candidate_y)]:
    # Small external ticks identify the visible-head interval without painting on the source pixels.
    for edge in (box[1], box[3]):
        py = round(y + edge * scale)
        draw.line((x - 12, py, x - 3, py), fill="#8fd9e7", width=2)
notes_y = reference_y + reference.height + 25
for i, line in enumerate([
    "Comparison uses visible hair-to-chin extent, not an inferred skull measurement.",
    "Reference perspective and lighting differ; this sheet does not certify likeness.",
    "Full front/profile/three-quarter, deformation and wire renders are separate PNG files.",
    "Visual gate remains with the user. No reference geometry or textures were copied.",
]):
    draw.text((left_x, notes_y + i * 30), line, font=small, fill="#c5dde9")
sheet.save(args.output or OUT / "correcciones-2-base-reference-sheet.png")
(OUT / "correcciones-2-reference-scale.json").write_text(json.dumps({
    "reference_visible_head_bounds_px": ref_box, "render_head_bounds_px": render_box,
    "reference_scale": reference_scale, "candidate_scale": candidate_scale,
    "displayed_head_height_px": head_height,
    "method": "visible hair-to-chin extent; reference bounds manually identified; not hidden skull",
}, indent=2), encoding="utf-8")
print("REFERENCE_SHEET", sheet.size, "HEAD_HEIGHT_PX", head_height)
