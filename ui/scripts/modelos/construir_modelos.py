"""Arma los GLB de la Etapa D para ui/public/modelos: antena Tall Dish de NASA, panel y kit Craftpix, los cuatro
modelos CC BY de la colonia e Ingenuity de NASA. moon_walk.glb se copia tal cual (no pasa por Blender: se estira).
Uso: blender -b --factory-startup -P construir_modelos.py -- <salida> [secciones: antena panel kit ccby ingenuity]
Las fuentes viven fuera del repo (NASA y CRAFT, abajo); fuentes y licencias en ui/public/modelos/FUENTES.md.
Convención de salida: base en y = 0, centro en planta en el origen, frente hacia +z (glTF)."""
import bpy, bmesh, sys, math, mathutils
a = sys.argv[sys.argv.index("--") + 1:]
SALIDA = a[0]
SECCIONES = set(a[1:]) or {"antena", "panel", "kit", "ccby", "ingenuity", "quaternius"}
DESCARGAS = "C:/Users/mpaul/Downloads/"
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
if "antena" in SECCIONES:
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
if "panel" in SECCIONES:
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
    # Colapso al 45 % sin mezclar materiales: lo pesado son los caños curvos de arriba (presupuesto D2).
    mod = o.modifiers.new("dec", "DECIMATE"); mod.ratio = 0.45; mod.delimit = {"MATERIAL"}
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="dec")
    normalizar(pan, 0.7)
    exportar(pan, "panel-solar")

# ---------------- Kit Craftpix Space Colony: un GLB con una malla por pieza (Etapa D2, colonia) ----------------
if "kit" in SECCIONES:
    # Escala original del kit (en metros), base en y = 0, centrada en planta y con la entrada hacia +z: el kit trae la
    # entrada hacia -x, se gira 90 grados. Sin materiales: la escena pone uno solo con la paleta compartida (UV intactas).
    # `Section` ya corre a lo largo de y (glTF z) y no se gira.
    REDUCIR = {"Home_colonists": 0.5, "Research_center": 0.6, "Connecting_gateway": 0.5, "Farm": 0.7, "Main_house": 0.7, "Main_house_2lv": 0.75, "Resource_warehouse": 0.7}
    KIT = ["Main_house", "Main_house_2lv", "Home_colonists", "Research_center", "Resource_warehouse", "Connecting_gateway", "Section", "Farm"]
    reset()
    piezas = []
    for n in KIT:
        objs = importar(CRAFT + n + ".fbx")
        aplicar(objs)
        if n != "Section":
            for o in objs: o.matrix_world = mathutils.Matrix.Rotation(math.radians(90), 4, "Z") @ o.matrix_world
            aplicar(objs)
        mn, mx = caja(objs)
        d = mathutils.Vector(((mn.x + mx.x) / -2, (mn.y + mx.y) / -2, -mn.z))
        for o in objs: o.location += d
        aplicar(objs)
        o = unir(objs, "Kit_" + n)
        o.data.materials.clear()
        # Las piezas pesadas, colapsadas al 60 % (presupuesto de 200 mil triángulos con la colonia entera).
        if n in REDUCIR:
            mod = o.modifiers.new("dec", "DECIMATE"); mod.ratio = REDUCIR[n]; mod.delimit = {"UV"}
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="dec")
        piezas.append(o)
    for o in bpy.data.objects: o.select_set(o in piezas)
    bpy.ops.export_scene.gltf(filepath=f"{SALIDA}/kit-colonia.glb", export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=True, export_materials="NONE")
    for o in piezas:
        mn, mx = caja([o])
        print("KIT", o.name, "tris", tris(o), "dims", [round(mx[i] - mn[i], 2) for i in range(3)])

# ---------------- Color por vértice: un material para piezas de colores planos (una llamada de dibujo) ----------------
def colorear(objs, color_de, nombre_mat):
    """Pasa el color de cada material a un atributo de esquina y deja un solo material que lo lee."""
    for o in objs:
        colores = [color_de(s.material) for s in o.material_slots] or [(0.6, 0.6, 0.6)]
        attr = o.data.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
        for p in o.data.polygons:
            c = colores[min(p.material_index, len(colores) - 1)]
            for li in p.loop_indices: attr.data[li].color = (*c, 1)
        o.data.materials.clear()
        for p in o.data.polygons: p.material_index = 0
    m = bpy.data.materials.new(nombre_mat); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.85
    vc = m.node_tree.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"
    m.node_tree.links.new(vc.outputs["Color"], b.inputs["Base Color"])
    for o in objs: o.data.materials.append(m)

def color_base(m):
    if not m or not m.use_nodes: return (0.6, 0.6, 0.6)
    b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    return tuple(b.inputs["Base Color"].default_value[:3]) if b else (0.6, 0.6, 0.6)

def exportar_vc(objs, nombre):
    for o in bpy.data.objects: o.select_set(o in objs)
    bpy.ops.export_scene.gltf(filepath=f"{SALIDA}/{nombre}.glb", export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=True, export_vertex_color="ACTIVE", export_animations=False)
    mn, mx = caja(objs)
    print("EXPORT", nombre, "tris", sum(tris(o) for o in objs), "dims", [round(mx[i] - mn[i], 2) for i in range(3)])

def ancho_a(objs, metros):
    """Escala para que el lado mayor en planta mida `metros`."""
    mn, mx = caja(objs)
    return metros / max(mx.x - mn.x, mx.y - mn.y)

# ---------------- Paleta del sistema estético (`clasificacion-objetos.md`, igual que `PALETA` de polvoKit.ts) ----------------
def lineal(hexa):
    c = [int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
BLANCO, GRIS, GRAFITO, AZUL = lineal("#E8E6E1"), lineal("#A8A29A"), lineal("#2E3238"), lineal("#5BA9C9")

def a_paleta(c, oscuro_a=GRAFITO):
    """Lleva un color plano a la paleta por su luminancia: claro a blanco, medio a gris, oscuro a `oscuro_a`."""
    l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    return BLANCO if l > 0.28 else GRIS if l > 0.15 else oscuro_a

# ---------------- Los cuatro CC BY 4.0 de la colonia (crédito en FUENTES.md) ----------------
# Forma tal cual; solo escala, apoyo en el suelo y frente hacia +z (las puertas ya miran a -y de Blender).
if "ccby" in SECCIONES:
    # Hábitat principal: domo geodésico de vidrio azul con torre de regolito impreso (Jason_Phillips). Textura propia.
    for archivo, nombre, metros in (("medium_low_poly_habitat.glb", "habitat-domo", 7.6), ("low_poly_antenna_habitat.glb", "torre-comunicaciones", 6.4)):
        reset()
        objs = importar(DESCARGAS + archivo)
        aplicar(objs)
        normalizar(objs, ancho_a(objs, metros))
        o = unir(objs, "CCBY_" + nombre)
        exportar([o], nombre)
    # Reciclador de agua: tanques y tuberías (anton.engdahl). Colores planos a color por vértice, llevados a la paleta;
    # las tapas oscuras de los tanques pasan al azul único del agua (color por función, `clasificacion-objetos.md`).
    reset()
    objs = importar(DESCARGAS + "mars_science_station_low_poly.glb")
    aplicar(objs)
    normalizar(objs, ancho_a(objs, 2.9))
    def color_reciclador(m):
        c = color_base(m)
        if 0.07 < c[0] < 0.12: return AZUL
        return a_paleta(c)
    colorear(objs, color_reciclador, "Recycler_VC")
    exportar_vc([unir(objs, "CCBY_Recycler")], "reciclador-agua")
    # Cápsula de llegada (MauricioPB) sin su astronauta (quieto y sin esqueleto: el tripulante es moon_walk).
    reset()
    objs = importar(DESCARGAS + "low_poly_astronaut_and_crew_module.glb")
    aplicar(objs)
    astronauta = [o for o in objs if sum((o.matrix_world @ mathutils.Vector(c)).x for c in o.bound_box) / 8 > 1.0]
    for o in astronauta: bpy.data.objects.remove(o)
    objs = [o for o in bpy.data.objects if o.type == "MESH"]
    normalizar(objs, 1.25)
    colorear(objs, lambda m: a_paleta(color_base(m)), "Capsule_VC")
    exportar_vc([unir(objs, "CCBY_Capsule")], "capsula-llegada")

# ---------------- Ingenuity (NASA 3D Resources): colores planos de NASA, rotores aparte para girarlos ----------------
if "ingenuity" in SECCIONES:
    reset()
    objs = importar(NASA + "Ingenuity Mars Helicopter.glb")
    aplicar(objs)
    def color_ingenuity(m):
        n = (m.name if m else "").lower()
        if "blade" in n or "carbon" in n or "dark" in n: return (0.05, 0.05, 0.055)
        if "gold" in n: return (0.75, 0.48, 0.1)
        if "chopper_sp" in n: return (0.05, 0.07, 0.12)
        if "gunmetal" in n or "grey" in n or "binoculars" in n: return (0.3, 0.3, 0.3)
        return (0.5, 0.5, 0.5)
    colorear(objs, color_ingenuity, "Ingenuity_VC")
    rotores = [o for o in objs if o.name.startswith("rotors_")]
    cuerpo = unir([o for o in objs if o not in rotores], "Ingenuity_Body")
    # Un cuarto de los triángulos (forma intacta: lo pesado son las palas y las patas; presupuesto de 200 mil).
    for o in [cuerpo] + rotores:
        mod = o.modifiers.new("dec", "DECIMATE"); mod.ratio = 0.25
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="dec")
    piezas = [cuerpo] + rotores
    mn, mx = caja(piezas)
    d = mathutils.Vector(((mn.x + mx.x) / -2, (mn.y + mx.y) / -2, -mn.z))
    for o in piezas: o.data.transform(mathutils.Matrix.Translation(d))
    # Cada rotor con su origen en el eje: la escena lo gira sobre y.
    for o in rotores:
        c = sum((v.co for v in o.data.vertices), mathutils.Vector()) / len(o.data.vertices)
        c.z = 0
        o.data.transform(mathutils.Matrix.Translation(-c)); o.location = c
    exportar_vc(piezas, "ingenuity")

# ---------------- Quaternius Ultimate Space Kit (CC0, poly.pizza): piezas sueltas en un GLB, a la paleta ----------------
# El color sale del atlas compartido (muestreado en el centro UV de cada cara) y se lleva a la paleta: claros a blanco,
# medios a gris, oscuros a grafito y los saturados al acento más cercano. Sin textura ni material: la escena pone uno.
QUAT = "C:/Users/mpaul/Documents/ss-fuentes/quaternius-space/"
PIEZAS_Q = {"Rover": 0.25, "SolarPanel_Ground": 1, "Roof_Antenna": 1, "Roof_Radar": 1, "Ramp": 1, "MetalSupport": 1, "House_Long": 1, "House_Cylinder": 1}
ACENTOS_Q = {"azul": lineal("#5BA9C9"), "amarillo": lineal("#F2B705"), "rojo": lineal("#E0453A"), "cian": lineal("#4FD1E0")}
if "quaternius" in SECCIONES:
    import colorsys
    reset()
    piezas = []
    for n, ratio in PIEZAS_Q.items():
        objs = importar(QUAT + n + ".glb")
        aplicar(objs)
        o = unir(objs, "Q_" + n)
        img = next((nd.image for s in o.material_slots if s.material and s.material.use_nodes for nd in s.material.node_tree.nodes if nd.type == "TEX_IMAGE" and nd.image), None)
        px = list(img.pixels) if img else None
        w, h = (img.size[0], img.size[1]) if img else (1, 1)
        uv = o.data.uv_layers.active.data if o.data.uv_layers.active else None
        attr = o.data.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
        for p in o.data.polygons:
            c = (0.6, 0.6, 0.6)
            if px and uv:
                u = sum(uv[i].uv.x for i in p.loop_indices) / len(p.loop_indices) % 1.0
                v = sum(uv[i].uv.y for i in p.loop_indices) / len(p.loop_indices) % 1.0
                k = (int(v * h) * w + int(u * w)) * 4
                c = tuple(px[k:k + 3])
            hh, ss, vv = colorsys.rgb_to_hsv(*[x ** (1 / 2.2) for x in c])
            if ss > 0.45 and vv > 0.3:
                destino = min(ACENTOS_Q.values(), key=lambda a: abs(colorsys.rgb_to_hsv(*[x ** (1 / 2.2) for x in a])[0] - hh))
            else:
                destino = a_paleta(c)
            for li in p.loop_indices: attr.data[li].color = (*destino, 1)
        o.data.materials.clear()
        if ratio < 1:
            mod = o.modifiers.new("dec", "DECIMATE"); mod.ratio = ratio
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="dec")
        # Base en y = 0 y centro en planta (las piezas de techo vienen a 4 m de alto).
        mn, mx = caja([o])
        o.data.transform(mathutils.Matrix.Translation(((mn.x + mx.x) / -2, (mn.y + mx.y) / -2, -mn.z)))
        piezas.append(o)
    m = bpy.data.materials.new("Quaternius_VC"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.85
    vc = m.node_tree.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"
    m.node_tree.links.new(vc.outputs["Color"], b.inputs["Base Color"])
    for o in piezas: o.data.materials.append(m)
    exportar_vc(piezas, "quaternius")
    for o in piezas:
        mn, mx = caja([o]); print("Q", o.name, "tris", tris(o), "dims", [round(mx[i] - mn[i], 2) for i in range(3)])
