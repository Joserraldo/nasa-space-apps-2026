"""CH-06 EVA astronaut: 'Rigged Low Poly Astronaut' (MrLentereng, rig) over ThunderWare Games' model, both CC0.
The package ships without its texture, so faces get palette tokens by region (dominant bone + facing).
Geometry is not edited. Usage: blender -b -P build_eva.py -- <src.fbx> <out.glb> <render_prefix>"""
import bpy, sys, math, mathutils
SRC, OUT_GLB, OUT_IMG = sys.argv[sys.argv.index("--") + 1:]
TOKENS = {"white": "#D4D2C2", "gray": "#BEC3C1", "darkGray": "#757D78", "black": "#1D2220", "tessAmber": "#D9A04E"}

def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
body = next(o for o in bpy.context.scene.objects if o.type == "MESH")
body.name = "EVA_Suit"
me = body.data
mats = {}
for t, h in TOKENS.items():
    m = bpy.data.materials.new("palette_" + t); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = lin(h); b.inputs["Roughness"].default_value = 0.8
    mats[t] = m
me.materials.clear()
order = list(TOKENS)
for t in order: me.materials.append(mats[t])
groups = {g.index: g.name.lower() for g in body.vertex_groups}
mw = body.matrix_world; nmat = mw.to_3x3().inverted().transposed()
zs = [(mw @ v.co).z for v in me.vertices]; zmin, zmax = min(zs), max(zs); height = zmax - zmin
ys = [(mw @ v.co).y for v in me.vertices]

def dominant(poly):
    acc = {}
    for vi in poly.vertices:
        for g in me.vertices[vi].groups:
            acc[g.group] = acc.get(g.group, 0) + g.weight
    return groups.get(max(acc, key=acc.get), "") if acc else ""

head_faces = [p for p in me.polygons if ("head" in dominant(p) or "neck" in dominant(p))]
head_y = sum((mw @ p.center).y for p in head_faces) / len(head_faces)
head_hz = [((mw @ p.center).z - zmin) / height for p in head_faces]
hz_lo, hz_hi = min(head_hz), max(head_hz)
print("EVA head", round(head_y, 3), round(hz_lo, 3), round(hz_hi, 3))
counts = {}
for p in me.polygons:
    bone = dominant(p)
    c = mw @ p.center; n = (nmat @ p.normal).normalized(); hz = (c.z - zmin) / height
    if "head" in bone or "neck" in bone:
        band = hz_lo + (hz_hi - hz_lo) * 0.35 < hz < hz_lo + (hz_hi - hz_lo) * 0.85
        token = "black" if (band and c.y < head_y - 0.05 and abs(n.z) < 0.6 and abs(n.x) < 0.75) else "white"   # visor: front of the helmet
    elif "hand" in bone or any(f in bone for f in ("index", "middle", "ring", "pinky", "thumb")):
        token = "gray"
    elif "foot" in bone or "ball" in bone or "toe" in bone:
        token = "darkGray"
    elif ("spine" in bone or "clavicle" in bone) and c.y > 0.12:
        token = "gray"   # life-support pack on the back
    else:
        token = "white"
    p.material_index = order.index(token); counts[token] = counts.get(token, 0) + 1
me.calc_loop_triangles()
print("EVA tris", len(me.loop_triangles), "bones", len(arm.data.bones), "faces by token", counts)

sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"; sc.render.resolution_x, sc.render.resolution_y = 900, 1000
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.78, 0.74, 1)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
c = mathutils.Vector((0, 0, zmin + height / 2))
cam = bpy.data.objects.new("c", bpy.data.cameras.new("c")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 2.1
for view, ang in (("front", 0), ("tq", 35), ("side", 90), ("back", 180)):
    r = math.radians(ang); cam.location = c + mathutils.Vector((math.sin(r) * 10, -math.cos(r) * 10, 0))
    cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT_IMG}_{view}.png"; bpy.ops.render.render(write_still=True)
for o in list(sc.objects):
    if o.type not in ("MESH", "ARMATURE"): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_animations=False)
print("EVA exported", OUT_GLB)
