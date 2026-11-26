"""Assemble the Tess pilot sheet from rendered GLBs and the preserved v1 frame."""
import argparse
import json
from math import ceil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "docs/referencias/v1/v1-t039.90.jpg"
BACKGROUND, PANEL = "#17232D", "#26343D"
TEXT, MUTED, AMBER = "#F5F4EA", "#BCD0DB", "#FFB020"
FONT_DIR = Path("C:/Windows/Fonts")


def label(draw, position, text, size=22, *, color=TEXT, bold=False):
    font = ImageFont.truetype(str(FONT_DIR / ("arialbd.ttf" if bold else "arial.ttf")), size)
    draw.text(position, text, font=font, fill=color)


def open_image(path, mode):
    with Image.open(path) as image:
        return image.convert(mode)


def place_scaled(sheet, image, x, y, width):
    height = round(width * image.height / image.width)
    sheet.paste(image.resize((width, height), Image.Resampling.LANCZOS), (x, y))
    return y + height


def silhouette_iou(images, bottom):
    region = (0, 0, images[0].width, ceil(bottom))
    a, b = [im.getchannel("A").crop(region).point(lambda v: 255 if v >= 128 else 0)
            for im in images]
    return ImageChops.darker(a, b).histogram()[255] / ImageChops.lighter(a, b).histogram()[255]


def place_distance_comparison(sheet, draw, directory, report, top):
    x, tile_width, tile_height = 987, 226, 159
    label(draw, (x, top), "Distance check / original pixel scale", 30, bold=True)
    width, height = report["resolution_px"]
    label(draw, (x, top + 39), f"{report['distance_to_target_m']} m to target / "
          f"{report['vertical_fov_deg']}\N{DEGREE SIGN} vertical FOV / {width} x {height} source", color=MUTED)
    y = top + 92
    metrics = {}
    for i, (view, name) in enumerate((("front", "Front"), ("three-quarter", "Three-quarter"))):
        images = [open_image(directory / f"{key}-10m-{view}.png", "RGBA") for key in ("base", "variant")]
        for j, (image, tag) in enumerate(zip(images, ("Base A / C3", "Tess"))):
            px = x + 2 * i * (tile_width + 9) + i * 24 + j * (tile_width + 9)
            label(draw, (px, y - 23), f"{name} / {tag}", 18, color=AMBER if j else MUTED)
            center_x, center_y = image.width // 2, image.height // 2
            left, upper = center_x - tile_width // 2, center_y - tile_height // 2
            crop = image.crop((left, upper, left + tile_width, upper + tile_height))
            sheet.paste(PANEL, (px, y, px + tile_width, y + tile_height))
            sheet.paste(crop, (px, y), crop.getchannel("A"))
        bottom = max(report[key][view]["head_bounds_px"][3] for key in ("base", "variant"))
        metrics[view] = round(silhouette_iou(images, bottom), 4)
    bounds = report["variant"]["front"]["character_bounds_px"]
    label(draw, (x, y + tile_height + 12), f"Tess projects to {bounds[3] - bounds[1]:.0f} px in height "
          "from the front. Crops are not magnified.", 20, color=MUTED)
    return metrics


def assemble(directory, output):
    report = json.loads((directory / "variant-review.json").read_text(encoding="utf-8"))
    sheet = Image.new("RGB", (2218, 926), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    label(draw, (35, 26), "T6.2 / CHARACTER PILOT", 20, color=AMBER, bold=True)
    label(draw, (35, 56), "Tess, the engineer", 53, bold=True)
    label(draw, (35, 122), "Style reference / v1-t039.90.jpg", 27, bold=True)
    label(draw, (987, 122), "Tess / exported GLB", 27, bold=True)
    label(draw, (1336, 129), "A-pose / matched orthographic framing", 21, color=MUTED)
    end_ref = place_scaled(sheet, open_image(REFERENCE, "RGB"), 35, 175, 915)
    for i, (view, name) in enumerate((("front", "Front"), ("profile", "Left profile"),
                                      ("three-quarter", "Three-quarter"))):
        x = 987 + i * 403
        end_render = place_scaled(sheet, open_image(directory / f"variant-{view}.png", "RGB"), x, 175, 392)
        label(draw, (x, end_render + 9), name, 21, color=MUTED, bold=True)
    label(draw, (35, end_ref + 12), "Complete frame. Compare stylization and workwear, not pose or likeness.",
          20, color=MUTED)
    label(draw, (35, end_ref + 65), "Work bob / amber panels / thigh wrench", 30, bold=True)
    label(draw, (35, end_ref + 107), "Asymmetric locks and a clipped nape replace the C3 bun.", 22, color=MUTED)
    label(draw, (35, end_ref + 143), "The continuous body, charcoal boots and C3 armature are unchanged.",
          22, color=MUTED)
    metrics = place_distance_comparison(sheet, draw, directory, report, end_render + 42)
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    print(f"VARIANT_REFERENCE_SHEET {sheet.width}x{sheet.height} head-region alpha IoU {metrics}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True, help="Directory from review_variant.py")
    parser.add_argument("--output", type=Path, required=True, help="Reference sheet PNG destination")
    args = parser.parse_args()
    assemble(args.output_dir, args.output)


if __name__ == "__main__":
    main()
