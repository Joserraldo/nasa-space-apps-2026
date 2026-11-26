"""Build Base A and Tess from the C4 anatomical cage; use run.ps1."""
import argparse
import json
import sys
from math import pi
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from anatomy_cage import ramp, retopologize
from build_base import ROOT, material
from build_variant import TESS, add_accessory, add_hair, closed_skin_mesh, loft_faces
from validate import validate_character, validate_deformation


DEFAULT_GUIDE = ROOT / "_work/ref-anatomia/source/lowpoly_male_base_mesh-TPOSE.fbx"
TOKENS = ("crewCharcoal", "black", "red", "skin")
PALETTE_MAP = {"red": "uniformWarning", "skin": "skin_warm_umber"}
ARM_ANCHORS = [(0, 0, 1.314), (.161, .027, 1.296), (.336, .021, 1.142),
               (.479, -.010, .989), (.541, -.027, .923)]
LEG_ANCHORS = [(.103, .017, .952), (.118, .043, .449), (.138, .017, .125),
               (.142, -.081, .039), (.150, -.157, .029)]

BASE_HAIR = {
    "hair_color": "hair",
    "hair": {
        "crown": [(1.639, 0, .011, .142, .131), (1.688, -.010, .010, .157, .139),
                  (1.748, -.021, .013, .130, .104), (1.774, -.033, .026, .075, .068)],
        "sweep": [(1.620, -.121, -.062, .032, .057), (1.662, -.100, -.086, .067, .062),
                  (1.719, -.041, -.101, .116, .050), (1.753, -.016, -.073, .087, .046)],
        "temple": [(1.539, .131, .003, .024, .039), (1.579, .134, .016, .031, .063),
                   (1.646, .117, .031, .046, .101), (1.702, .083, .033, .063, .079)],
        "nape": [(1.538, -.018, .103, .060, .039), (1.586, -.017, .111, .119, .057),
                 (1.666, -.012, .099, .141, .086), (1.731, -.018, .072, .104, .079)],
        "knot": [(1.677, -.044, .145, .059, .053), (1.724, -.049, .163, .091, .071),
                 (1.770, -.056, .163, .085, .062), (1.800, -.063, .151, .054, .042)],
    },
}


def start_from_guide(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(path))
    sources = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(sources) != 1:
        raise ValueError("The guide must import as one mesh")
    source = sources[0]
    vertices = [source.matrix_world @ vertex.co for vertex in source.data.vertices]
    faces = [list(face.vertices) for face in source.data.polygons]
    guide_mesh = source.data
    bpy.data.objects.remove(source, do_unlink=True)
    bpy.data.meshes.remove(guide_mesh)
    return retopologize(vertices, faces)


def make_rig():
    data = bpy.data.armatures.new("BaseRig")
    rig = bpy.data.objects.new("BaseRig", data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def add(name, head, tail, parent=None):
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent:
            bone.parent = data.edit_bones[parent]

    trunk = [(0, 0, 0), (0, .017, .902), (0, .007, 1.052), (0, .014, 1.218),
             (0, .006, 1.343), (0, .004, 1.440), (0, .011, 1.712)]
    parents = ("Root", "Hips", "Spine", "Chest", "Neck", "Head")
    add("Root", trunk[0], (0, 0, .12))
    for i, name in enumerate(parents[1:], 1):
        add(name, trunk[i], trunk[i + 1], parents[i - 1])
    for side, sign in (("L", 1), ("R", -1)):
        for parent, names, anchors in (
            ("Chest", ("Shoulder", "UpperArm", "LowerArm", "Hand"), ARM_ANCHORS),
            ("Hips", ("UpperLeg", "LowerLeg", "Foot", "Toe"), LEG_ANCHORS),
        ):
            points = [(sign * x, y, z) for x, y, z in anchors]
            for i, stem in enumerate(names):
                name = f"{stem}.{side}"
                add(name, points[i], points[i + 1], parent)
                parent = name
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    return rig


def chain_weights(value, first, transitions):
    """Smoothly transition between neighboring joints, max two weights per chain."""
    for pivot, width, name in transitions:
        if value < pivot + width:
            t = ramp(value, pivot - width, pivot + width)
            t = t * t * (3 - 2 * t)
            return {first: 1 - t, name: t}
        first = name
    return {first: 1}


def weights(point, arm_support):
    x, y, z = point
    side = "L" if x >= 0 else "R"
    width = abs(x)
    trunk = chain_weights(z, "Hips", [(1.031, .098, "Spine"), (1.192, .076, "Chest"),
                                     (1.359, .038, "Neck"), (1.433, .020, "Head")])
    if arm_support > 1e-8:
        travel = (width - ARM_ANCHORS[1][0]) * .71 - (z - 1.296) * .70
        arm = chain_weights(travel, f"Shoulder.{side}", [(.024, .049, f"UpperArm.{side}"),
                            (.231, .072, f"LowerArm.{side}"), (.448, .047, f"Hand.{side}")])
        return mix_weights(trunk, arm, arm_support)
    if z < .978:
        leg = chain_weights(-z, f"UpperLeg.{side}", [(-.449, .095, f"LowerLeg.{side}"),
                            (-.125, .053, f"Foot.{side}")])
        if z < .083:
            leg = mix_weights(leg, {f"Toe.{side}": 1},
                              (1 - ramp(y, -.133, -.057)) * (1 - ramp(z, .035, .083)))
        amount = (1 - ramp(z, .80, .978)) * (ramp(width, .01, .09) if z > .75 else 1)
        return mix_weights(trunk, leg, amount)
    return trunk


def mix_weights(a, b, amount):
    return {name: weight for name, weight in
            [(name, w * (1 - amount)) for name, w in a.items()] +
            [(name, w * amount) for name, w in b.items()] if weight > 1e-9}


def make_body(cage, loops, rig, tess):
    mesh = bpy.data.meshes.new("C4_deforming_surface")
    mesh.from_pydata(cage.points, [], cage.faces)
    for token in TOKENS:
        mesh.materials.append(material(PALETTE_MAP.get(token, token) if tess else token))
    for face, token in zip(mesh.polygons, cage.zones):
        face.material_index = TOKENS.index(token)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new("BaseBody", mesh)
    bpy.context.collection.objects.link(obj)
    obj["joint_loops"] = json.dumps(loops)
    obj["anatomy_revision"] = "C4"
    obj.parent = rig
    groups = {bone.name: obj.vertex_groups.new(name=bone.name) for bone in rig.data.bones}
    for vertex in mesh.vertices:
        influences = weights(vertex.co, cage.arm_support[vertex.index])
        total = sum(influences.values())
        for name, weight in influences.items():
            if weight > 1e-7:
                groups[name].add([vertex.index], weight / total, "REPLACE")
    modifier = obj.modifiers.new("Anatomy skinning", "ARMATURE")
    modifier.object = rig
    return obj


def make_badge(body, rig):
    outline = [(.045, 1.247), (.080, 1.230), (.115, 1.247),
               (.115, 1.263), (.080, 1.248), (.045, 1.263)]
    bpy.context.view_layer.update()
    vertices = []
    for inset in (-.005, .002):
        for x, z in outline:
            ok, hit, _, _ = body.ray_cast(Vector((x, -.5, z)), Vector((0, 1, 0)))
            if not ok:
                raise ValueError("Badge must lie over the chest surface")
            vertices.append((x, hit.y + inset, z))
    return closed_skin_mesh("Chest_chevron", vertices, loft_faces(2, 6), "hull", rig, "Chest")


def add_tess(rig):
    recipe = {"hair_color": TESS["hair_color"], "hair": {}}
    for name, rings in TESS["hair"].items():
        recipe["hair"][name] = [(z - .014, x * .83, y * .97, w * .96, d)
                                for z, x, y, w, d in rings]
    add_hair(recipe, rig)
    for accessory in TESS["accessories"]:
        x, y, z = accessory["position"]
        add_accessory({**accessory, "position": (x - .006, y - .022, z + .070)}, rig)


def generate(guide, tess):
    cage, loops = start_from_guide(guide)
    rig = make_rig()
    body = make_body(cage, loops, rig, tess)
    if tess:
        add_tess(rig)
    else:
        add_hair(BASE_HAIR, rig)
    make_badge(body, rig)
    return rig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--guide", type=Path, default=DEFAULT_GUIDE)
    parser.add_argument("--tess", action="store_true")
    parser.add_argument("--blend", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.blend.exists() or args.output.exists():
        parser.error("Build to new paths; promote only the verified outputs.")
    rig = generate(args.guide.resolve(), args.tess)
    report = validate_character()
    report["deformation_probes"] = validate_deformation(rig)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()))
    bpy.ops.export_scene.gltf(filepath=str(args.output.resolve()), export_format="GLB",
                              use_selection=True, export_skins=True, export_animations=False, export_yup=True)
    print("C4_ASSET", json.dumps(report))


if __name__ == "__main__":
    main()
