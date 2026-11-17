"""Craftpix FBX -> GLB for the game. The pack paints every model with a 4-band palette texture; here each
band becomes a named material (Casco, Acento, Grafito, Oscuro) with no texture, so the game applies its own.
With --celdas, the largest flat dark face group (the solar panel face) becomes "Celdas" with 0..1 UVs.
Usage: blender -b --python exportar.py -- <fbx> <out.glb> <thumb_prefix> [--celdas]"""
import bpy, bmesh, sys, math, mathutils
args = sys.argv[sys.argv.index("--") + 1:]
fbx, glb, png = args[:3]
celdas = "--celdas" in args
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
o = next(x for x in bpy.context.scene.objects if x.type == "MESH")
o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = o.data
xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
me.transform(mathutils.Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
# Palette rows from the top of the image (v = 1) down: black, accent, graphite, shell (measured below).
NOMBRES = ["Casco", "Acento", "Grafito", "Oscuro", "Celdas"]
COLORES = [(0.9, 0.88, 0.85, 1), (0.1, 0.55, 0.6, 1), (0.03, 0.03, 0.035, 1), (0.004, 0.004, 0.006, 1), (0.05, 0.12, 0.45, 1)]
me.materials.clear()
for n, c in zip(NOMBRES, COLORES):
    m = bpy.data.materials.new(n); m.use_nodes = True
    b = next(x for x in m.node_tree.nodes if x.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = c; b.inputs["Roughness"].default_value = 0.7
    me.materials.append(m)
bm = bmesh.new(); bm.from_mesh(me)
uv = bm.loops.layers.uv.active
BANDAS = eval(args[args.index("--bandas") + 1]) if "--bandas" in args else None
cuenta = {}
for f in bm.faces:
    v = sum(l[uv].uv.y for l in f.loops) / len(f.loops)
    v = v - math.floor(v)
    fila = min(63, int((1 - v) * 64))
    f.material_index = BANDAS[fila]
    cuenta[f.material_index] = cuenta.get(f.material_index, 0) + 1
if celdas:
    # Group dark faces by normal; the group with the largest area is the panel face.
    grupos = {}
    for f in bm.faces:
        if f.material_index != 3 or f.normal.z < 0.1: continue
        k = tuple(round(c, 1) for c in f.normal)
        grupos.setdefault(k, []).append(f)
    k, caras = max(grupos.items(), key=lambda kv: sum(f.calc_area() for f in kv[1]))
    n = mathutils.Vector(k).normalized()
    u = n.cross(mathutils.Vector((0, 0, 1))).normalized(); w = n.cross(u).normalized()
    pts = [(l.vert.co.dot(u), l.vert.co.dot(w)) for f in caras for l in f.loops]
    u0, u1 = min(p[0] for p in pts), max(p[0] for p in pts); w0, w1 = min(p[1] for p in pts), max(p[1] for p in pts)
    for f in caras:
        f.material_index = 4
        for l in f.loops:
            l[uv].uv = ((l.vert.co.dot(u) - u0) / (u1 - u0), (l.vert.co.dot(w) - w0) / (w1 - w0))
    print("CELDAS", len(caras), "normal", k, "tam", round(u1 - u0, 2), round(w1 - w0, 2))
bm.to_mesh(me); bm.free()
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_yup=True, export_apply=True, export_animations=False, export_materials="EXPORT")
d = max(o.dimensions)
cam_d = bpy.data.cameras.new("c"); cam = bpy.data.objects.new("c", cam_d); bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam
sun_d = bpy.data.lights.new("s", "SUN"); sun_d.energy = 4; sun = bpy.data.objects.new("s", sun_d); bpy.context.scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), 0, math.radians(30))
w = bpy.data.worlds.new("w"); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.55, 0.45, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.9
s = bpy.context.scene; s.render.engine = "BLENDER_EEVEE"; s.render.resolution_x = 560; s.render.resolution_y = 420
for nombre, pos in (("frente", (d * 0.5, -d * 1.6, d * 0.8)), ("arriba", (0.001, -0.001, d * 2.1)), ("atras", (-d * 0.5, d * 1.6, d * 0.8))):
    cam.location = pos
    cam.rotation_euler = (mathutils.Vector((0, 0, o.dimensions.z * 0.4)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    s.render.filepath = f"{png}_{nombre}.png"; bpy.ops.render.render(write_still=True)
print("LISTO", glb, "x,y(fondo),z(alto)", [round(v, 2) for v in o.dimensions], "caras por material", cuenta)
