"""Crew Q3: Quaternius Ultimate Modular characters (Women: CC-BY, Men: CC0), unmodified geometry.
Allowed operations: recolor materials with measured palette tokens, swap whole parts between pack models
(same 79-bone rig), remove weapon parts, drop combat clips. Usage:
blender -b -P build_crew_q3.py -- <character> <quaternius_root> <out_glb> <out_render_prefix>"""
import bpy, sys, math, mathutils
args = sys.argv[sys.argv.index("--") + 1:]
NAME, ROOT, OUT_GLB, OUT_IMG = args

TOKENS = {  # palette token -> hex (all present in palette.json)
    "crewCharcoal": "#333542", "tessPanel": "#2C2A36", "tessBoot": "#211F2A",
    "tessAmber": "#D9A04E", "tessHair": "#854C41", "tessSkin": "#D29475", "tessBrow": "#4A2C24",
    "niaAccent": "#75CEBA", "niaHair": "#2A2220", "skin": "#987054",
    "veraAccent": "#7E312F", "veraHair": "#93462F",
    "teoAccent": "#566EA5", "teoHair": "#3B2822",
}
SCIFI = "umw/Sci Fi Character/SciFi.fbx"
SCIFI_BODY = {"Blue": "crewCharcoal", "LightBlue": "tessPanel", "Black": "tessBoot", "Skin": "tessSkin"}
CREW = {
    "tess": {"base": SCIFI, "head": None, "accent": "tessAmber",
             "map": {**SCIFI_BODY, "Hair_Black": "tessHair", "Brown": "tessBrow"}},
    "nia": {"base": SCIFI, "head": "umw/Suit/Suit.fbx", "accent": "niaAccent",
            "map": {**SCIFI_BODY, "Skin": "skin", "Hair_Brown": "niaHair", "Hair_Blond": "niaHair", "Brown": "tessBoot"}},
    "vera": {"base": SCIFI, "head": "umw/Soldier/Soldier.fbx", "accent": "veraAccent",
             "map": {**SCIFI_BODY, "Hair_Brown": "veraHair", "Brown": "tessBrow"}},
    "teo": {"base": "umm/Astronaut/Spacesuit.fbx", "head": "umm/Business Man/Suit.fbx", "accent": "teoAccent",
            "map": {"SciFi_Main": "crewCharcoal", "SciFi_MainDark": "tessPanel", "SciFi_Light": "tessPanel",
                    "SciFi_Light_Accent": "teoAccent", "Skin": "skin", "Hair": "teoHair", "Eyebrows": "teoHair",
                    "Eye": "tessBoot"}},
}
KEEP_ACTIONS = ("Idle", "Idle_Neutral", "Walk", "Run", "Wave", "Interact", "Roll", "HitRecieve")
cfg = CREW[NAME]

def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1]

def token_mat(token):
    name = "palette_" + token
    m = bpy.data.materials.get(name)
    if not m:
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = lin(TOKENS[token]); b.inputs["Roughness"].default_value = 0.8
    return m

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=f"{ROOT}/{cfg['base']}")
arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
for o in list(bpy.context.scene.objects):
    if o.type == "MESH" and (o.name == "Pistol" or (cfg["head"] and o.name.endswith("_Head"))):
        bpy.data.objects.remove(o, do_unlink=True)
if cfg["head"]:
    before = set(bpy.context.scene.objects); actions_before = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=f"{ROOT}/{cfg['head']}")
    new = [o for o in bpy.context.scene.objects if o not in before]
    head = next(o for o in new if o.type == "MESH" and o.name.split(".")[0].endswith("_Head"))
    mw = head.matrix_world.copy()
    doomed = [o.name for o in new if o is not head]
    head.parent = arm; head.matrix_world = mw
    for mod in head.modifiers:
        if mod.type == "ARMATURE": mod.object = arm
    for a in [a for a in bpy.data.actions if a not in actions_before]:
        bpy.data.actions.remove(a)  # the head file brings its own copy of the clips
    for n in doomed:
        if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

for path, part in cfg.get("extra", []):  # optional whole parts from other pack models
    before = set(bpy.context.scene.objects); actions_before = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=f"{ROOT}/{path}")
    new = [o for o in bpy.context.scene.objects if o not in before]
    keep = next(o for o in new if o.type == "MESH" and o.name.split(".")[0] == part)
    mw = keep.matrix_world.copy(); doomed = [o.name for o in new if o is not keep]
    keep.parent = arm; keep.matrix_world = mw
    for mod in keep.modifiers:
        if mod.type == "ARMATURE": mod.object = arm
    for a in [a for a in bpy.data.actions if a not in actions_before]: bpy.data.actions.remove(a)
    for n in doomed:
        if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

for o in bpy.context.scene.objects:
    if o.type != "MESH": continue
    for slot in o.material_slots:
        if not slot.material: continue
        base = slot.material.name.split(".")[0]
        if base == "Metal":  # Sci Fi suit hardware carries the role accent, except on the boots
            token = "tessBoot" if o.name.endswith("_Feet") else cfg["accent"]
        elif o.name.endswith("_Feet") and cfg["map"].get(base) == cfg["accent"]:
            token = "tessBoot"  # boots stay dark on every crew member
        else:
            token = cfg["map"].get(base)
        if token is None: raise SystemExit(f"unmapped material {base} on {o.name}")
        slot.material = token_mat(token)

for a in list(bpy.data.actions):
    short = a.name.split("|")[-1]
    if short not in KEEP_ACTIONS: bpy.data.actions.remove(a)
    else: a.name = short
dg = bpy.context.evaluated_depsgraph_get(); tris = 0
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in meshes:
    me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); tris += len(me.loop_triangles); o.evaluated_get(dg).to_mesh_clear()
print("CREW", NAME, "meshes", [o.name for o in meshes], "tris", tris, "bones", len(arm.data.bones),
      "mats", sorted({s.material.name for o in meshes for s in o.material_slots}), "actions", sorted(a.name for a in bpy.data.actions))

sc = bpy.context.scene
if arm.animation_data: arm.animation_data.action = None
for pb in arm.pose.bones: pb.matrix_basis.identity()
sc.render.engine = "BLENDER_EEVEE"; sc.render.resolution_x, sc.render.resolution_y = 700, 1000
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.82, 0.8, 0.76, 1)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bb = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
mn = mathutils.Vector([min(v[i] for v in bb) for i in range(3)]); mx = mathutils.Vector([max(v[i] for v in bb) for i in range(3)])
c = (mn + mx) / 2
cam = bpy.data.objects.new("c", bpy.data.cameras.new("c")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 2.0; c.z = 0.95
for view, ang in (("front", 0), ("tq", 35), ("side", 90), ("back", 180)):
    r = math.radians(ang); cam.location = c + mathutils.Vector((math.sin(r) * 10, -math.cos(r) * 10, 0))
    cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT_IMG}_{view}.png"; bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_animations=True)
print("CREW exported", OUT_GLB)
