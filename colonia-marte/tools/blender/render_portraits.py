"""Crew portraits for the dialogue UI: three-quarter head shots rendered from the approved GLBs.
Usage: blender -b -P render_portraits.py -- <characters_dir> <out_dir> name [name...]"""
import bpy, sys, math, mathutils
args = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT, NAMES = args[0], args[1], args[2:]
for name in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f"{SRC}/{name}.glb")
    sc = bpy.context.scene
    arm = next(o for o in sc.objects if o.type == "ARMATURE")
    for o in sc.objects:  # rest pose
        if o.animation_data: o.animation_data.action = None
    head = arm.pose.bones.get("Head") or next(b for b in arm.pose.bones if "head" in b.name.lower())
    target = arm.matrix_world @ head.head + mathutils.Vector((0, 0, 0.09))
    sc.render.engine = "BLENDER_EEVEE"; sc.render.resolution_x = sc.render.resolution_y = 512
    sc.render.film_transparent = True
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.8, 0.85, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    key = bpy.data.objects.new("key", bpy.data.lights.new("key", "SUN")); sc.collection.objects.link(key)
    key.data.energy = 3.2; key.rotation_euler = (math.radians(55), 0, math.radians(-35))
    rim = bpy.data.objects.new("rim", bpy.data.lights.new("rim", "SUN")); sc.collection.objects.link(rim)
    rim.data.energy = 1.6; rim.data.color = (0.6, 0.9, 1.0); rim.rotation_euler = (math.radians(70), 0, math.radians(160))
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c")); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 85
    r = math.radians(-28)
    cam.location = target + mathutils.Vector((math.sin(r) * 1.55, -math.cos(r) * 1.55, 0.05))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT}/{name}.png"
    bpy.ops.render.render(write_still=True)
    print("PORTRAIT", name, tuple(round(v, 2) for v in target))
