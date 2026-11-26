"""Build a named character by applying a recipe to the C3 Base A scene."""
import argparse
import json
import sys
from pathlib import Path

import bmesh
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_base import block, generate, material
from rig import bind_rigid
from validate import validate_character, validate_deformation


# Coordinates are in the final C3 rest pose: meters, Z up, -Y forward.
# Hair sections give (height, center X, center Y, half width, half depth).
TESS = {
    "skin": {"name": "skin_warm_umber", "srgb": "#78503C"},
    "accent": "warning",
    "hair_color": "hair",
    "hair": {
        "crown": [
            (1.653, .002, .012, .144, .115),
            (1.702, .006, .002, .161, .133),
            (1.752, .018, .013, .149, .123),
            (1.797, .024, .017, .109, .085),
            (1.810, .027, .019, .066, .059),
        ],
        "side_lock": [
            (1.447, .172, -.020, .021, .026),
            (1.485, .183, -.027, .046, .052),
            (1.559, .163, -.048, .056, .070),
            (1.642, .135, -.056, .056, .081),
            (1.721, .095, -.043, .058, .085),
        ],
        "fringe": [
            (1.617, .125, -.110, .027, .016),
            (1.655, .075, -.111, .069, .031),
            (1.701, .013, -.108, .110, .035),
            (1.753, -.016, -.067, .102, .052),
        ],
        "temple": [
            (1.548, -.137, .034, .026, .032),
            (1.581, -.140, .026, .038, .059),
            (1.655, -.132, .014, .043, .084),
            (1.729, -.085, .009, .049, .087),
        ],
        "nape": [
            (1.493, .032, .121, .091, .032),
            (1.542, .013, .121, .139, .064),
            (1.648, .009, .095, .145, .074),
            (1.725, .004, .068, .127, .068),
        ],
    },
    "accessories": [
        {
            "name": "thigh_holster", "shape": "block", "bone": "UpperLeg.L",
            "color": "darkGray", "position": (.181, -.096, .578),
            "size": (.110, .077, .164), "bevel": .014,
        },
        {
            "name": "open_wrench", "shape": "outline_xz", "bone": "UpperLeg.L",
            "color": "hull", "position": (.201, -.136, .553), "depth": .028,
            "outline": [
                (-.015, -.108), (.014, -.109), (.024, -.094), (.015, .036),
                (.048, .060), (.055, .100), (.042, .123), (.022, .082),
                (-.001, .076), (-.020, .096), (-.010, .138), (-.040, .125),
                (-.054, .098), (-.052, .061), (-.018, .035), (-.023, -.093),
            ],
        },
    ],
}
VARIANTS = {"tess": TESS}

HAIR_SECTION = (
    (.70, -1), (1, -.61), (1, .39), (.66, 1),
    (-.66, 1), (-1, .39), (-1, -.61), (-.70, -1),
)


def resolve_color(color):
    if isinstance(color, str):
        return material(color)
    name, hex_rgb = color["name"], color["srgb"]
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    srgb = [int(hex_rgb[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    rgba = (*(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in srgb), 1)
    value = bpy.data.materials.new(name)
    value.diffuse_color = rgba
    shader = value.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Roughness"].default_value = .65
    return value


def closed_skin_mesh(name, points, faces, color, rig, bone):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(resolve_color(color))
    bind_rigid(obj, rig, bone)
    return obj


def loft_faces(rings, sides):
    last = (rings - 1) * sides
    faces = [tuple(reversed(range(sides))), tuple(range(last, last + sides))]
    for offset in range(0, last, sides):
        for i in range(sides):
            a, b = offset + i, offset + (i + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    return faces


def add_hair(recipe, rig):
    for name, rings in recipe["hair"].items():
        points = [(x + dx * width, y + dy * depth, z)
                  for z, x, y, width, depth in rings for dx, dy in HAIR_SECTION]
        closed_skin_mesh(f"Hair_{name}", points, loft_faces(len(rings), len(HAIR_SECTION)),
                         recipe["hair_color"], rig, "Head")


def add_accessory(part, rig):
    name = f"Gear_{part['name']}"
    if part["shape"] == "block":
        return block(name, part["position"], part["size"], part["color"], rig,
                     bevel=part["bevel"], bone=part["bone"])
    if part["shape"] != "outline_xz":
        raise ValueError(f"Unknown accessory shape: {part['shape']}")
    x, y, z = part["position"]
    half_depth = part["depth"] / 2
    points = [(x + dx, layer, z + dz) for layer in (y - half_depth, y + half_depth)
              for dx, dz in part["outline"]]
    return closed_skin_mesh(name, points, loft_faces(2, len(part["outline"])),
                            part["color"], rig, part["bone"])


def apply_variant(recipe):
    rig = bpy.data.objects["BaseRig"]
    colors = {"palette_red": resolve_color(recipe["accent"]),
              "palette_skin": resolve_color(recipe["skin"])}
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH":
            continue
        if obj.name.startswith("Hair_"):
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        for slot in obj.material_slots:
            if slot.name in colors:
                slot.material = colors[slot.name]
    add_hair(recipe, rig)
    for part in recipe["accessories"]:
        add_accessory(part, rig)
    return rig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--variant", choices=VARIANTS, default="tess")
    parser.add_argument("--source", type=Path, help="Optional delivered C3 .blend; otherwise regenerate C3")
    parser.add_argument("--blend", type=Path, required=True, help="Editable variant destination")
    parser.add_argument("--output", type=Path, required=True, help="Uncompressed GLB destination")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    if args.source and args.source.resolve() in (args.blend.resolve(), args.output.resolve()):
        parser.error("The variant must not overwrite its source")
    if args.blend.suffix != ".blend" or args.output.suffix != ".glb":
        parser.error("Expected --blend to end in .blend and --output in .glb")
    for path in (args.blend, args.output):
        path.parent.mkdir(parents=True, exist_ok=True)

    if args.source:
        bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), load_ui=False)
    else:
        generate()
    rig = apply_variant(VARIANTS[args.variant])
    report = validate_character()
    report["deformation_probes"] = validate_deformation(rig)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type in ("MESH", "ARMATURE"))
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()))
    bpy.ops.export_scene.gltf(filepath=str(args.output.resolve()), export_format="GLB",
                              use_selection=True, export_skins=True, export_animations=False, export_yup=True)
    print("VARIANT_VALIDATION", json.dumps(report))


if __name__ == "__main__":
    main()
