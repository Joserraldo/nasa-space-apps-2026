"""Generate the style A gate candidate. No named characters, variants or production animations."""
import argparse
import json
import sys
from pathlib import Path
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mesh_builder import build_body, revised_height
from rig import bind_body, bind_rigid, create_rig
from validate import validate_character, validate_deformation
from character_details import build_head, build_uniform

ROOT = Path(__file__).resolve().parents[2]
PALETTE = json.loads((ROOT / "palette.json").read_text(encoding="utf-8"))
COLORS = {item["id"]: item["base"] for item in PALETTE["colors"]}


def material(token):
    name = f"palette_{token}"
    if bpy.data.materials.get(name):
        return bpy.data.materials[name]
    value = bpy.data.materials.new(name)
    rgb = [int(COLORS[token][offset:offset + 2], 16) / 255 for offset in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
    value.diffuse_color = (*linear, 1)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*linear, 1)
    bsdf.inputs["Roughness"].default_value = .65
    return value


def block(name, location, size, token, rig, bevel=.018, bone="Head", rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    modifier = obj.modifiers.new("Planar chamfer", "BEVEL")
    modifier.width, modifier.segments = bevel, 1
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material(token))
    bind_rigid(obj, rig, bone)
    return obj


def generate():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    builder, body = build_body()
    rig = create_rig()
    bind_body(body, builder, rig)
    for token in ("black", "red", "skin"):
        body.data.materials.append(material(token))
    # Face regions follow complete rings and meridians; no threshold-generated sleeve zigzags.
    build_head(rig, material, block)
    build_uniform(rig, material, block)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj != body:
            for vertex in obj.data.vertices:
                vertex.co.z = revised_height(vertex.co.z)
            obj.data.update()
    report = validate_character()
    report["deformation_probes"] = validate_deformation(rig)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    lo = min(v.co.z for obj in meshes for v in obj.data.vertices)
    hi = max(v.co.z for obj in meshes for v in obj.data.vertices)
    head = bpy.data.objects["Head_faceted"]
    chin = min(v.co.z for v in head.data.vertices)
    skull_height = max(v.co.z for v in head.data.vertices) - chin
    visible_head_height = hi - chin
    report["proportions"] = {"height_m": hi - lo, "skull_height_m": skull_height,
                             "skull_to_height": skull_height / (hi - lo), "hair_blocks": 5,
                             "visible_head_to_height": visible_head_height / (hi - lo),
                             "eye_inlay": "coplanar front-face material, zero protrusion"}
    if not (.2 <= skull_height / (hi - lo) <= .25 and .2 <= visible_head_height / (hi - lo) <= .25):
        raise ValueError(f"Head proportion outside style A: {report['proportions']}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type in ("MESH", "ARMATURE"))
    bpy.context.view_layer.objects.active = rig
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "public/models/characters/base-a.glb"))
    parser.add_argument("--report", default=str(ROOT / "docs/capturas/correcciones-2-base-validation.json"))
    parser.add_argument("--blend", type=Path, help="Editable scene destination")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    report = generate()
    blend_path = args.blend or output.with_name("base-a-v2.blend")
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path.resolve()))
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", use_selection=True,
                              export_skins=True, export_animations=False, export_yup=True)
    # Reimport the actual artifact in an empty scene; glTF triangulation is expected here.
    original = report["triangles"]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(output))
    # Blender's importer can create an unskinned Icosphere bone-display widget; it is not a GLB primitive.
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and
              any(mod.type == "ARMATURE" for mod in obj.modifiers)]
    triangles = sum(len(p.vertices) - 2 for obj in meshes for p in obj.data.polygons)
    rigs = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if triangles != original or len(rigs) != 1 or len(rigs[0].data.bones) != 22:
        raise ValueError(f"GLB round-trip: triangles {original}->{triangles}, rigs={len(rigs)}, "
                         f"bones={[list(r.data.bones.keys()) for r in rigs]}")
    if not all(obj.vertex_groups and any(m.type == "ARMATURE" for m in obj.modifiers) for obj in meshes):
        raise ValueError("GLB round-trip lost skinning")
    report["round_trip"] = {"triangles": triangles, "bones": 22, "skinned_meshes": len(meshes)}
    report["glb_bytes"] = output.stat().st_size
    Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("BASE_CHARACTER_VALIDATION", json.dumps(report))


if __name__ == "__main__":
    main()
