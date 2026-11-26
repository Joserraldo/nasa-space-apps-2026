"""Arma los GLB de la Etapa D (antena Tall Dish de NASA, panel solar de Craftpix) para ui/public/modelos.
Uso: blender -b --factory-startup -P construir_modelos.py -- <salida>
Las fuentes viven fuera del repo (NASA y CRAFT, abajo); fuentes y licencias en ui/public/modelos/FUENTES.md.
Convención de salida: base en y = 0, centro en planta en el origen, frente hacia +z (glTF)."""
import bpy, bmesh, sys, math, mathutils
a = sys.argv[sys.argv.index("--") + 1:]
SALIDA = a[0]
NASA = "C:/Users/mpaul/Documents/ss-referencias/nasa3d/"
CRAFT = "C:/Users/mpaul/Documents/ss-fuentes/craftpix/"

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def importar(f):
    antes = set(bpy.data.objects)
    if f.lower().endswith(".fbx"): bpy.ops.import_scene.fbx(filepath=f)
    else: bpy.ops.import_scene.gltf(filepath=f)
    return [o for o in bpy.data.objects if o not in antes and o.type == "MESH"]

def aplicar(objs):
    for o in bpy.data.objects: o.select_set(False)
    for o in objs:
        o.select_set(True)
        if o.parent:
            m = o.matrix_world.copy(); o.parent = None; o.matrix_world = m
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def caja(objs):
    mn = mathutils.Vector((1e9,) * 3); mx = -mn
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    return mn, mx

def normalizar(objs, escala):
    """Escala, apoya en el suelo y centra en planta (Blender z arriba; -y = frente glTF +z)."""
    for o in objs: o.scale = (escala,) * 3; o.location *= escala
    aplicar(objs)
    mn, mx = caja(objs)
    d = mathutils.Vector(((mn.x + mx.x) / -2, (mn.y + mx.y) / -2, -mn.z))
    for o in objs: o.location += d
    aplicar(objs)

def unir(objs, nombre):
    for o in bpy.data.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = nombre; o.data.name = nombre
    return o

def tris(o):
    o.data.calc_loop_triangles(); return len(o.data.loop_triangles)

def exportar(objs, nombre):
    for o in bpy.data.objects: o.select_set(o in objs)
    ruta = f"{SALIDA}/{nombre}.glb"
    bpy.ops.export_scene.gltf(filepath=ruta, export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=True, export_image_format="JPEG", export_jpeg_quality=82,
                              export_materials="EXPORT")
    mn, mx = caja(objs)
    print("EXPORT", nombre, "tris", sum(tris(o) for o in objs), "dims", [round(mx[i] - mn[i], 2) for i in range(3)])

def material_simple(nombre, color, rugosidad=0.7, metal=0.0):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rugosidad
    b.inputs["Metallic"].default_value = metal
    return m

# ---------------- Antena: Tall Dish (plato, giro y poste), plato reducido y girado hacia la Tierra ----------------
reset()
plato = importar(NASA + "Tall Dish (dish).glb"); giro = importar(NASA + "Tall Dish (turntable).glb"); poste = importar(NASA + "Tall Dish (post).glb")
aplicar(plato + giro + poste)
# El plato reducido: colapso de aristas al 40 % (presupuesto: reducir el plato antes que subir el techo).
p = unir(plato, "Dish")
mod = p.modifiers.new("dec", "DECIMATE"); mod.ratio = 0.4
bpy.context.view_layer.objects.active = p; bpy.ops.object.modifier_apply(modifier="dec")
for o in [p] + giro:  # plato inclinado 35 grados hacia el frente, sobre su giro
    o.rotation_euler = (math.radians(35), 0, 0)
aplicar([p] + giro)
gris = material_simple("Dish_White", (0.78, 0.76, 0.72), 0.55, 0.15)
for o in [p] + giro:
    o.data.materials.clear(); o.data.materials.append(gris)
todo = [p] + giro + poste
normalizar(todo, 0.0029)
an = unir(todo, "Antenna_TallDish")
exportar([an], "antena-tall-dish")

# ---------------- Panel solar Craftpix: celdas separadas del marco por banda de la paleta ----------------
reset()
pan = importar(CRAFT + "Solar_panel.fbx")
aplicar(pan)
o = pan[0]
uv = o.data.uv_layers.active.data
celdas = material_simple("Panel_Cells", (0.07, 0.09, 0.16), 0.3, 0.4)
marco = material_simple("Panel_Frame", (0.72, 0.71, 0.68), 0.6, 0.2)
oscuro = material_simple("Panel_Dark", (0.08, 0.08, 0.08), 0.7, 0.1)
o.data.materials.clear()
for m in (celdas, marco, oscuro): o.data.materials.append(m)
cuenta = {}
for poly in o.data.polygons:
    v = sum(uv[i].uv.y for i in poly.loop_indices) / len(poly.loop_indices)
    banda = min(3, int((1 - (v % 1.0)) * 4))  # 0 negro, 1 rojo, 2 gris oscuro, 3 gris (de arriba abajo)
    cuenta[banda] = cuenta.get(banda, 0) + poly.area
    poly.material_index = {0: 0, 1: 2, 2: 2, 3: 1}[banda]
print("BANDAS", {k: round(v, 2) for k, v in cuenta.items()})
normalizar(pan, 0.7)
exportar(pan, "panel-solar")
