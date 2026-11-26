"""Style A silhouette details. Original shapes; references constrain proportions, not asset identity."""
import bpy
from mesh_builder import QuadBody
from rig import bind_rigid


def build_head(rig, material, block):
    head = QuadBody()
    outline = [(.72, -1), (1, -.62), (1, .55), (.68, 1),
               (-.68, 1), (-1, .55), (-1, -.62), (-.72, -1)]
    levels = [(1.395, .095, .095), (1.425, .125, .115), (1.475, .155, .14),
              (1.58, .18, .15), (1.626, .18, .15), (1.651, .18, .15),
              (1.71, .17, .14), (1.76, .14, .115)]
    previous = None
    for row, (z, width, depth) in enumerate(levels):
        ring = [head.vertex((x * width, y * depth, z), {"Head": 1}) for x, y in outline]
        if previous:
            start = len(head.faces)
            head.bridge(previous, ring)
            if row == 5:
                # Front polygon is the eye inlay itself: zero protruding geometry.
                head.materials[start + 7] = 1
        else:
            head.cap(ring)
        previous = ring
    head.cap(previous)
    obj = head.object()
    obj.name = "Head_faceted"
    obj.data.materials.append(material("skin"))
    obj.data.materials.append(material("black"))
    bind_rigid(obj, rig)
    # Five substantial, irregular masses, rooted inside the skull and projecting beyond it.
    for name, position, size, rotation in [
        ("crown_left", (-.065, .015, 1.735), (.245, .30, .15), (0, -.16, -.12)),
        ("crown_right", (.10, .04, 1.717), (.19, .29, .17), (0, .20, .10)),
        ("swept_fringe", (-.065, -.125, 1.75), (.24, .12, .12), (0, -.25, -.15)),
        ("back", (.015, .125, 1.66), (.29, .16, .23), (.12, 0, .08)),
        ("bun", (.025, .25, 1.705), (.19, .20, .21), (.30, .15, .20)),
    ]:
        block(f"Hair_{name}", position, size, "hair", rig, bevel=.025, rotation=rotation)
    for sign in (-1, 1):
        block(f"Ear_{sign}", (sign * .182, -.005, 1.555), (.047, .065, .085),
              "skin", rig, bevel=.012)
    # A tall, tapered face; keep the hair masses substantial without a spherical head silhouette.
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.name.startswith(("Head", "Hair", "Ear")):
            for vertex in obj.data.vertices:
                vertex.co.x *= .8
                vertex.co.y *= .8
            obj.data.update()


def build_uniform(rig, material, block):
    for sign in (-1, 1):
        block(f"Collar_{sign}", (sign * .084, 0, 1.355), (.045, .185, .105),
              "red", rig, bevel=.008, bone="Neck")
        block(f"Thumb_{sign}", (sign * .716, -.044, .952), (.06, .055, .07),
              "skin", rig, bevel=.012, bone=f"Hand.{'L' if sign > 0 else 'R'}")
    block("Collar_back", (0, .078, 1.355), (.17, .04, .105), "red", rig,
          bevel=.008, bone="Neck")
    # A true V outline, rather than a rectangle named chevron.
    points = [(.035, 1.18), (.082, 1.145), (.129, 1.18),
              (.129, 1.20), (.082, 1.168), (.035, 1.20)]
    mesh = bpy.data.meshes.new("Chevron_outline")
    vertices = [(x, y, z) for y in (-.132, -.126) for x, z in points]
    n = len(points)
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Chest_chevron", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material("yellow"))
    bind_rigid(obj, rig, "Chest")
