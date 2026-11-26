"""Render actual gate evidence from the generated .blend; never touch the prototype project."""
import argparse
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_base import material

parser = argparse.ArgumentParser()
parser.add_argument("--blend", default=str(ROOT / "public/models/characters/base-a-v2.blend"))
parser.add_argument("--output-dir", type=Path, default=ROOT / "docs/capturas")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
args.output_dir.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()), load_ui=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 16
scene.render.resolution_x, scene.render.resolution_y = 800, 850
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.12, .14, .18, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .6
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.data.materials.append(material("gray"))
floor.location.z = .04
for name, position, energy, size in [("Key", (-3, -4, 5), 650, 4), ("Fill", (4, -1, 3), 350, 3)]:
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size = energy, "DISK", size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat("-Z", "Y").to_euler()
camera_data = bpy.data.cameras.new("ReviewCamera")
camera = bpy.data.objects.new("ReviewCamera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type, camera_data.ortho_scale = "ORTHO", 2.05
views = {}


def render(name, position):
    camera.location = position
    camera.rotation_euler = (Vector((0, 0, .90)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(args.output_dir / f"correcciones-2-base-{name}.png")
    bpy.ops.render.render(write_still=True)
    points = [world_to_camera_view(scene, camera, obj.matrix_world @ vertex.co)
              for obj in scene.objects if obj.type == "MESH" and obj.name.startswith(("Head", "Hair", "Ear"))
              for vertex in obj.data.vertices]
    width, height = scene.render.resolution_x, scene.render.resolution_y
    views[name] = {"head_bounds_px": [min(p.x for p in points) * width,
                                      (1 - max(p.y for p in points)) * height,
                                      max(p.x for p in points) * width,
                                      (1 - min(p.y for p in points)) * height]}


render("front", (0, -5, 1.4))
render("profile", (5, -.1, 1.4))
render("three-quarter", (3, -5, 1.9))
rig = bpy.data.objects["BaseRig"]
for name in ("LowerArm.L", "LowerLeg.L"):
    rig.pose.bones[name].rotation_mode = "XYZ"
    rig.pose.bones[name].rotation_euler.x = .65
render("deformation", (3, -5, 1.9))
for bone in rig.pose.bones:
    bone.rotation_euler = (0, 0, 0)
body = bpy.data.objects["BaseBody"]
wire = body.modifiers.new("Review structural edges", "WIREFRAME")
wire.thickness, wire.use_replace = .0016, False
wire.material_offset = 0
render("wire", (0, -5, 1.4))
(args.output_dir / "correcciones-2-render-views.json").write_text(
    json.dumps(views, indent=2), encoding="utf-8")
print("RENDER_REVIEW_COMPLETE: front, profile, three-quarter, deformation, wire")
