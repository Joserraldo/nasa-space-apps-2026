"""Reimport a variant and Base A; measure and render them with matched 10 m cameras."""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_base import material

TARGET = Vector((0, 0, .90))
CLOSE_VIEWS = {
    "front": (0, -5, 1.4),
    "profile": (5, 0, 1.4),
    "three-quarter": (3, -5, 1.9),
    "back": (0, 5, 1.4),
}
DISTANCE = 10
VFOV = 54


def import_character(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path.resolve()))
    scene = bpy.context.scene
    rig, = [obj for obj in scene.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in scene.objects if obj.type == "MESH" and
              any(mod.type == "ARMATURE" and mod.object == rig for mod in obj.modifiers)]
    if not meshes:
        raise ValueError(f"No skinned meshes in {path}")
    for mesh in meshes:
        for vert in mesh.data.vertices:
            if abs(sum(g.weight for g in vert.groups) - 1) > 1e-5:
                raise ValueError(f"Missing or non-normalized imported weights: {mesh.name}/{vert.index}")
    return scene, rig, meshes


def joint_rest_pose(rig):
    return {bone.name: (bone.parent.name if bone.parent else None,
                        tuple(value for row in bone.matrix_local for value in row)) for bone in rig.data.bones}


def require_same_skeleton(base, candidate):
    if base.keys() != candidate.keys() or len(base) != 22:
        raise ValueError("Expected identical 22-joint sets in Base A and the variant")
    max_delta = 0
    for name, (parent, matrix) in base.items():
        other_parent, other_matrix = candidate[name]
        if parent != other_parent:
            raise ValueError(f"Joint hierarchy differs at {name}")
        max_delta = max(max_delta, *(abs(a - b) for a, b in zip(matrix, other_matrix)))
    if max_delta > 1e-5:
        raise ValueError(f"Joint rest matrices differ by {max_delta}")
    return max_delta


def setup_studio(scene):
    scene.render.engine = "CYCLES"
    scene.cycles.device, scene.cycles.samples = "CPU", 16
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.world = bpy.data.worlds.new("Review world")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (.12, .14, .18, 1)
    background.inputs["Strength"].default_value = .6
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, .04))
    floor = bpy.context.object
    floor.data.materials.append(material("gray"))
    for name, position, energy, size in [("Key", (-3,-4,5), 650, 4), ("Fill", (4,-1,3), 350, 3)]:
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.shape, light.size = energy, "DISK", size
        obj = bpy.data.objects.new(name, light)
        scene.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat("-Z", "Y").to_euler()
    camera = bpy.data.objects.new("Review camera", bpy.data.cameras.new("Review camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    return camera, floor


def projected_bounds(scene, camera, meshes):
    points = [world_to_camera_view(scene, camera, mesh.matrix_world @ vertex.co)
              for mesh in meshes for vertex in mesh.data.vertices]
    width, height = scene.render.resolution_x, scene.render.resolution_y
    return [round(min(p.x for p in points) * width, 2), round((1 - max(p.y for p in points)) * height, 2),
            round(max(p.x for p in points) * width, 2), round((1 - min(p.y for p in points)) * height, 2)]


def render(scene, camera, position, path, meshes):
    camera.location = position
    camera.rotation_euler = (TARGET - camera.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()
    scene.render.filepath = str(path.resolve())
    bpy.ops.render.render(write_still=True)
    return {
        "character_bounds_px": projected_bounds(scene, camera, meshes),
        "head_bounds_px": projected_bounds(scene, camera, [
            obj for obj in meshes if obj.name.startswith(("Head", "Hair", "Ear"))]),
    }


def render_character(scene, meshes, directory, label, close_views=False):
    camera, floor = setup_studio(scene)
    if close_views:
        scene.render.resolution_x, scene.render.resolution_y = 800, 850
        camera.data.type, camera.data.ortho_scale = "ORTHO", 2.05
        for view, position in CLOSE_VIEWS.items():
            render(scene, camera, position, directory / f"{label}-{view}.png", meshes)

    floor.hide_render = True
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    camera.data.type, camera.data.sensor_fit = "PERSP", "VERTICAL"
    camera.data.angle_y = math.radians(VFOV)
    frame = camera.data.view_frame(scene=scene)
    actual_fov = math.degrees(2 * math.atan(max(v.y / -v.z for v in frame)))
    if not math.isclose(actual_fov, VFOV, abs_tol=1e-4):
        raise ValueError(f"Camera vertical FOV is {actual_fov}, expected {VFOV}")
    return {view: render(scene, camera, TARGET + Vector(direction).normalized() * DISTANCE,
                         directory / f"{label}-10m-{view}.png", meshes)
            for view, direction in (("front", (0, -1, .1)), ("three-quarter", (3, -5, .58)))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-glb", type=Path, required=True)
    parser.add_argument("--variant-glb", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    args.output_dir.mkdir(parents=True, exist_ok=True)
    base_scene, base_rig, base_meshes = import_character(args.base_glb)
    base_skeleton = joint_rest_pose(base_rig)
    base_views = render_character(base_scene, base_meshes, args.output_dir, "base")
    scene, rig, meshes = import_character(args.variant_glb)
    max_delta = require_same_skeleton(base_skeleton, joint_rest_pose(rig))
    variant_views = render_character(scene, meshes, args.output_dir, "variant", close_views=True)
    report = {
        "distance_to_target_m": DISTANCE, "vertical_fov_deg": VFOV, "resolution_px": [1280, 720],
        "joint_count": len(rig.data.bones), "joint_rest_matrix_max_delta": max_delta,
        "skinned_meshes": len(meshes), "triangles": sum(len(p.vertices) - 2 for obj in meshes
                                                      for p in obj.data.polygons),
        "materials": sorted({slot.name for obj in meshes for slot in obj.material_slots}),
        "base": base_views, "variant": variant_views,
    }
    (args.output_dir / "variant-review.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("VARIANT_REVIEW", json.dumps(report))


if __name__ == "__main__":
    main()
