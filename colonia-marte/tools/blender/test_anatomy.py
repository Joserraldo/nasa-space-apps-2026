"""Run the independent C4 contract on the saved Blender asset."""
import json
import sys

import bmesh
import bpy


bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index("--") + 1], load_ui=False)
body = bpy.data.objects["BaseBody"]
assert body.get("anatomy_revision") == "C4", "Expected the continuous C4 body, not C3"
assert len(bpy.data.objects["BaseRig"].data.bones) == 22
assert not any(obj.name.startswith(("Head_", "Thumb_", "Ear_")) for obj in bpy.context.scene.objects)

mesh = bmesh.new()
mesh.from_mesh(body.data)
seen = set()
pending = [next(iter(mesh.verts))]
while pending:
    vertex = pending.pop()
    if vertex in seen:
        continue
    seen.add(vertex)
    pending.extend(edge.other_vert(vertex) for edge in vertex.link_edges)
assert len(seen) == len(mesh.verts), "The suit, face and hands must be one connected surface"
assert all(edge.is_manifold for edge in mesh.edges)
assert all(len(face.verts) <= 4 for face in mesh.faces)
mesh.free()

for vertex in body.data.vertices:
    if vertex.co.z < .90 and abs(vertex.co.x) < .27:
        influences = [body.vertex_groups[group.group].name for group in vertex.groups]
        assert not any(name.startswith(("Shoulder", "UpperArm", "LowerArm", "Hand"))
                       for name in influences), f"Leg/pelvis vertex {vertex.index} follows an arm"

loops = json.loads(body["joint_loops"])
for side in ("L", "R"):
    for joint in ("elbow", "knee"):
        rings = loops[f"{joint}.{side}"]
        assert len(rings) >= 3
        assert len(set(i for ring in rings for i in ring)) == sum(map(len, rings)), "Support loops must be independent"
