"""Render the saved C4 poses using a fixed orthographic studio."""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_base import material


VIEWS = {"front": (0, -5, .9), "profile": (5, 0, .9), "three-quarter": (2.8, -5, 1.65)}


def setup():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = 560, 680
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studiolight_rotate_z = .3
    shading.color_type = "MATERIAL"
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.cavity_ridge_factor, shading.cavity_valley_factor = .32, .48
    shading.curvature_ridge_factor, shading.curvature_valley_factor = .37, .45
    camera = bpy.data.objects.new("C4 review camera", bpy.data.cameras.new("C4 review camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type, camera.data.ortho_scale = "ORTHO", 2.12
    return scene, camera


def render(scene, camera, path, view, target=(0, 0, .9)):
    camera.location = view
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(path.resolve())
    bpy.ops.render.render(write_still=True)


def rotate_bone(rig, name, axis, degrees):
    bone = rig.pose.bones[name]
    local = bone.bone.matrix_local.to_quaternion().inverted() @ Vector(axis)
    bone.rotation_mode = "QUATERNION"
    bone.rotation_quaternion = Quaternion(local, math.radians(degrees))


def bend_toward(rig, name, forward, degrees=90):
    bone = rig.data.bones[name]
    direction = (bone.tail_local - bone.head_local).normalized()
    axis = direction.cross(Vector(forward)).normalized()
    rotate_bone(rig, name, axis, degrees)


def pose_stats(body):
    bpy.context.view_layer.update()
    evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        ratios = [p.area / original.area for p, original in zip(mesh.polygons, body.data.polygons)]
        return {"moved": sum((a.co - b.co).length > .001 for a, b in zip(body.data.vertices, mesh.vertices)),
                "area_ratio": [min(ratios), max(ratios)], "min_z": min(v.co.z for v in mesh.vertices)}
    finally:
        evaluated.to_mesh_clear()


def apply_pose(rig, name):
    if name == "elbow90":
        bend_toward(rig, "LowerArm.L", (0, -1, 0))
    elif name == "knee90":
        bend_toward(rig, "LowerLeg.L", (0, 1, 0))
    elif name == "arm-up":
        bend_toward(rig, "UpperArm.L", (.12, -.08, 1), 135)
    elif name == "seated":
        for side in "LR":
            rotate_bone(rig, f"UpperLeg.{side}", (1, 0, 0), -87)
            rotate_bone(rig, f"LowerLeg.{side}", (1, 0, 0), 90)
            bend_toward(rig, f"LowerArm.{side}", (0, -1, 0), 68)
        rig.location.z = -.70


def measure(body, rig):
    points = [vertex.co for vertex in body.data.vertices]
    hair = [v.co for o in bpy.context.scene.objects if o.name.startswith("Hair_") for v in o.data.vertices]
    head_top = max(v.z for v in hair + points)
    chin = points[369]
    bones = rig.data.bones
    return {"height": head_top, "chin": tuple(chin), "shoulders": (points[145] - points[395]).length,
            "upper_arm": bones["UpperArm.L"].length, "forearm": bones["LowerArm.L"].length,
            "thigh": bones["UpperLeg.L"].length, "shin": bones["LowerLeg.L"].length,
            "wrist": tuple(bones["Hand.L"].head_local), "index_tip": tuple(points[95]),
            "boot_depth": max(v.y for v in points if v.z < .09) - min(v.y for v in points if v.z < .09),
            "body_vertices": len(points), "body_faces": len(body.data.polygons)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blend", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--poses", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    directory = args.output_dir
    directory.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(args.blend.resolve()), load_ui=False)
    scene, camera = setup()
    rig, body = bpy.data.objects["BaseRig"], bpy.data.objects["BaseBody"]
    report = measure(body, rig)
    for name, direction in VIEWS.items():
        render(scene, camera, directory / f"{args.label}-{name}.png", direction)
    wire = body.modifiers.new("Structural quad edges", "WIREFRAME")
    wire.thickness, wire.use_replace = .0021, False
    wire.material_offset = 1
    for slot in body.material_slots:
        slot.material = material("hull")
    body.data.materials.append(material("black"))
    for polygon in body.data.polygons:
        polygon.material_index = 3
    for obj in scene.objects:
        if obj.type == "MESH" and obj != body:
            obj.hide_render = True
    render(scene, camera, directory / f"{args.label}-wire.png", (1.45, -5, 1.10))
    body.modifiers.remove(wire)
    if args.poses:
        report["poses"] = {}
        for name in ("elbow90", "knee90", "arm-up", "seated"):
            for bone in rig.pose.bones:
                bone.rotation_quaternion = (1, 0, 0, 0)
            rig.location.z = 0
            apply_pose(rig, name)
            report["poses"][name] = pose_stats(body)
            target = (0, -.15 if name == "seated" else 0,
                      .66 if name == "seated" else 1.02 if name == "arm-up" else .9)
            camera.data.ortho_scale = 2.28
            render(scene, camera, directory / f"{args.label}-{name}.png", (4.2, -5, 1.65), target)
    (directory / f"{args.label}-measures.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
