"""Connected quad torso, branching legs and shoulder ports. Blender coordinates: Z up, -Y forward."""
import json
import math
import bmesh
import bpy
from mathutils import Vector


class QuadBody:
    def __init__(self):
        self.vertices, self.faces, self.weights, self.loops = [], [], [], {}
        self.materials = {}

    def vertex(self, point, weights):
        self.vertices.append(tuple(point))
        self.weights.append(weights)
        return len(self.vertices) - 1

    def ring(self, center, width, depth, weights, count=8, axis=None):
        center = Vector(center)
        axis = Vector(axis or (0, 0, 1)).normalized()
        u = Vector((1, 0, 0)) if abs(axis.x) < 0.8 else Vector((0, 1, 0))
        u = (u - axis * u.dot(axis)).normalized()
        v = axis.cross(u).normalized()
        return [self.vertex(center + u * math.cos(i * 2 * math.pi / count) * width +
                            v * math.sin(i * 2 * math.pi / count) * depth, weights) for i in range(count)]

    def bridge(self, a, b, material=0):
        assert len(a) == len(b)
        for i in range(len(a)):
            j = (i + 1) % len(a)
            self.materials[len(self.faces)] = material
            self.faces.append((a[i], a[j], b[j], b[i]))

    def cap(self, ring, material=0):
        # An even polygon is tiled by quads without adding a pole or triangles.
        for i in range(1, len(ring) - 2, 2):
            self.materials[len(self.faces)] = material
            self.faces.append((ring[0], ring[i], ring[i + 1], ring[i + 2]))

    def remember(self, name, rings):
        self.loops[name] = rings

    def object(self):
        mesh = bpy.data.meshes.new("BaseBody_quads")
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        for face in mesh.polygons:
            face.material_index = self.materials.get(face.index, 0)
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new("BaseBody", mesh)
        bpy.context.collection.objects.link(obj)
        obj["joint_loops"] = json.dumps(self.loops)
        return obj


def blend(a, b, t):
    t = max(0, min(1, t))
    return {a: 1 - t, b: t} if a != b else {a: 1}


def revised_height(z):
    # Compress the 0.68 m leg section by 18 mm, holding the soles and torso length fixed.
    return z - .018 * min(1, max(0, (z - .05) / .68))


def build_body():
    body = QuadBody()
    heights = [.73, .76, .79, .82, .86, .91, .97, 1.04, 1.11, 1.23, 1.27, 1.31, 1.33]
    widths = [.20, .205, .20, .172, .164, .18, .21, .25, .28, .30, .30, .27, .18]
    torso = []
    for z, width in zip(heights, widths):
        weights = blend("Hips", "Spine", (z - .77) / .2) if z < .97 else blend("Spine", "Chest", (z - .97) / .18)
        torso.append(body.ring((0, 0, z), width, .12, weights, 12))
    for row in range(len(torso) - 1):
        for i in range(12):
            # Two by two face ports on both shoulders, each with an eight-vertex perimeter.
            if row in (9, 10) and i in (11, 0, 5, 6):
                continue
            j = (i + 1) % 12
            body.materials[len(body.faces)] = 1 if i in (0, 5, 6, 11) else 0
            body.faces.append((torso[row][i], torso[row][j], torso[row + 1][j], torso[row + 1][i]))
    previous = torso[-1]
    neck = []
    for z, radius in [(1.35, .085), (1.37, .075), (1.39, .065)]:
        current = body.ring((0, 0, z), radius, radius, {"Neck": 1}, 12)
        body.bridge(previous, current)
        previous = current
        neck.append(current)
    body.cap(previous)
    body.remember("neck", neck[-2:])
    body.remember("waist", torso[3:5])
    crotch = body.vertex((0, 0, .67), {"Hips": 1})
    for sign, suffix in [(1, "L"), (-1, "R")]:
        # The two leg ports share the front-to-back crotch seam and torso perimeter.
        perimeter = [torso[0][i % 12] for i in (range(9, 16) if sign == 1 else range(3, 10))]
        perimeter.append(crotch)
        start = Vector((sign * .115, 0, .73))
        # Match each port vertex to its ring angle, preserving boundary order and connectivity.
        angles = [math.atan2(body.vertices[i][1], body.vertices[i][0] - start.x) for i in perimeter]
        previous = perimeter
        rings = []
        parameters = sorted(set([i / 30 for i in range(1, 31)] + [.015, .035, .46, .49, .52, .87, .90, .93]))
        for t in parameters:
            z = .73 - t * .68
            # Shaped thighs, narrower knees, calf volume and a broad boot toe.
            width = .108 - t * .05 + .014 * math.sin(t * math.pi * 3) ** 2
            depth = .115 - t * .045 + .015 * math.sin(t * math.pi * 2) ** 2
            if t > .90:
                depth += (t - .90) * .55
            center_y = -.04 * max(0, (t - .88) / .12)
            weights = blend(f"UpperLeg.{suffix}", f"LowerLeg.{suffix}", (t - .43) / .14)
            if t > .82:
                weights = blend(f"LowerLeg.{suffix}", f"Foot.{suffix}", (t - .82) / .14)
            current = [body.vertex((start.x + math.cos(a) * width, center_y + math.sin(a) * depth, z), weights)
                       for a in angles]
            body.bridge(previous, current)
            rings.append((t, current))
            previous = current
        body.cap(previous)
        for name, target in [("hip", .035), ("knee", .49), ("ankle", .90)]:
            selected = sorted(rings, key=lambda r: abs(r[0] - target))[:3]
            body.remember(f"{name}.{suffix}", [r[1] for r in sorted(selected)])
        # Shoulder port perimeter, in surface order, pointing toward its outward arm.
        a, b, c = ((11, 0, 1) if sign == 1 else (5, 6, 7))
        port = [torso[9][a], torso[9][b], torso[9][c], torso[10][c],
                torso[11][c], torso[11][b], torso[11][a], torso[10][a]]
        start = Vector((sign * .285, 0, 1.27))
        end = Vector((sign * .78, 0, .94))
        axis = (end - start).normalized()
        u = Vector((0, 1, 0))
        v = axis.cross(u).normalized()
        angles = []
        for index in port:
            delta = Vector(body.vertices[index]) - start
            angles.append(math.atan2(delta.dot(v), delta.dot(u)))
        previous = port
        rings = []
        parameters = sorted(set([i / 30 for i in range(1, 31)] + [.015, .035, .46, .49, .52, .87, .90, .93]))
        for t in parameters:
            center = start.lerp(end, t)
            radius = .088 - t * .044
            palm = max(0, min(1, (t - .87) / .06))
            radius += palm * .018
            if t > .97:
                radius -= (t - .97) * .35
            weights = blend(f"UpperArm.{suffix}", f"LowerArm.{suffix}", (t - .43) / .14)
            if t > .82:
                weights = blend(f"LowerArm.{suffix}", f"Hand.{suffix}", (t - .82) / .14)
            current = [body.vertex(center + (u * math.cos(a) * (1 - palm * .30) +
                       v * math.sin(a) * (1 + palm * .20)) * radius, weights) for a in angles]
            token = 2 if t > .87 else 1 if t < .20 or t > .76 else 0
            body.bridge(previous, current, token)
            rings.append((t, current))
            previous = current
        body.cap(previous, 2)
        for name, target in [("shoulder", .035), ("elbow", .49), ("wrist", .90)]:
            selected = sorted(rings, key=lambda r: abs(r[0] - target))[:3]
            body.remember(f"{name}.{suffix}", [r[1] for r in sorted(selected)])
    body.vertices = [(x, y, revised_height(z)) for x, y, z in body.vertices]
    return body, body.object()
