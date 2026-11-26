"""Fail-closed production checks from specification 8.2; run inside Blender 5.3."""
import json
import math
import bmesh
import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree

CORE_BONES = {"Root", "Hips", "Spine", "Chest", "Neck", "Head"}
BONES = CORE_BONES | {f"{name}.{side}" for side in ("L", "R") for name in
                     ("Shoulder", "UpperArm", "LowerArm", "Hand", "UpperLeg", "LowerLeg", "Foot", "Toe")}
JOINTS = {"neck": 2, "waist": 2} | {f"{name}.{side}": 3 for side in ("L", "R") for name in
                                   ("shoulder", "elbow", "wrist", "hip", "knee", "ankle")}


def validate_character(objects=None):
    objects = list(objects or bpy.context.scene.objects)
    errors, meshes = [], [obj for obj in objects if obj.type == "MESH"]
    rigs = [obj for obj in objects if obj.type == "ARMATURE"]
    if len(rigs) != 1:
        errors.append("Expected exactly one armature")
    rig = rigs[0] if rigs else None
    if rig and set(rig.data.bones.keys()) != BONES:
        errors.append("Expected the 22 standard production bone names")
    total = 0
    anatomy_c4 = any(obj.get("anatomy_revision") == "C4" for obj in meshes if obj.name == "BaseBody")
    for obj in [*meshes, *rigs]:
        if obj.location.length > 1e-6 or obj.rotation_euler.to_matrix().to_quaternion().angle > 1e-5 or any(
                abs(v - 1) > 1e-6 for v in obj.scale):
            errors.append(f"Unapplied transform: {obj.name}")
    for obj in meshes:
        mesh = obj.data
        total += sum(len(face.vertices) - 2 for face in mesh.polygons)
        bm = bmesh.new()
        bm.from_mesh(mesh)
        if any(not edge.is_manifold for edge in bm.edges):
            errors.append(f"Non-manifold edge: {obj.name}")
        if any(face.calc_area() < 1e-8 for face in bm.faces):
            errors.append(f"Degenerate face: {obj.name}")
        bm.free()
        for vertex in mesh.vertices:
            weights = [g for g in vertex.groups if g.weight > 1e-7]
            if not weights or len(weights) > 4 or abs(sum(g.weight for g in weights) - 1) > 1e-5:
                errors.append(f"Invalid normalized influences: {obj.name}/{vertex.index}")
                break
            if any(obj.vertex_groups[g.group].name not in BONES for g in weights):
                errors.append(f"Unknown skin group: {obj.name}")
                break
        if not any(mod.type == "ARMATURE" and mod.object == rig for mod in obj.modifiers):
            errors.append(f"Missing armature modifier: {obj.name}")
        if obj.name.startswith(("Head", "Hair", "EyeBand", "Ear")) and any(
                len(v.groups) != 1 or obj.vertex_groups[v.groups[0].group].name != "Head" for v in mesh.vertices):
            errors.append(f"Head attachment must be rigid: {obj.name}")
        if obj.name == "BaseBody":
            if anatomy_c4:
                adjacency = {v.index: [] for v in mesh.vertices}
                for a, b in (edge.vertices for edge in mesh.edges):
                    adjacency[a].append(b)
                    adjacency[b].append(a)
                pending, seen = [0], set()
                while pending:
                    index = pending.pop()
                    if index not in seen:
                        seen.add(index)
                        pending.extend(adjacency[index])
                if len(seen) != len(mesh.vertices):
                    errors.append("C4 body must be a single connected mesh")
            if any(len(face.vertices) != 4 for face in mesh.polygons):
                errors.append("Deforming body must contain only quads")
            if anatomy_c4:
                positions = KDTree(len(mesh.vertices))
                for vertex in mesh.vertices:
                    positions.insert(vertex.co, vertex.index)
                positions.balance()
                mirrored = all(positions.find(Vector((-v.co.x, v.co.y, v.co.z)))[2] < 1e-6
                               for v in mesh.vertices)
            else:
                positions = {tuple(round(c, 5) for c in v.co) for v in mesh.vertices}
                mirrored = all((-x, y, z) in positions for x, y, z in positions)
            if not mirrored:
                errors.append("Base body must be mirrored across X")
            loops = json.loads(obj.get("joint_loops", "{}"))
            edges = {tuple(sorted(edge.vertices)) for edge in mesh.edges}
            required = ({key: count for key, count in JOINTS.items() if key.startswith(("elbow.", "knee."))}
                        if anatomy_c4 else JOINTS)
            for joint, minimum in required.items():
                rings = loops.get(joint, [])
                overlap = anatomy_c4 and len({i for ring in rings for i in ring}) != sum(map(len, rings))
                if len(rings) < minimum or len({tuple(ring) for ring in rings}) != len(rings) or overlap:
                    errors.append(f"Insufficient distinct joint loops: {joint}")
                mapping = {"shoulder": "UpperArm", "elbow": "LowerArm", "wrist": "Hand",
                           "hip": "UpperLeg", "knee": "LowerLeg", "ankle": "Foot"}
                name, _, side = joint.partition(".")
                anchor = rig.data.bones[f"{mapping[name]}.{side}"].head_local if side else (
                    rig.data.bones["Neck"].tail_local if name == "neck" else rig.data.bones["Spine"].head_local)
                for ring in rings:
                    if len(set(ring)) != len(ring) or len(ring) < 8 or any(i >= len(mesh.vertices) for i in ring):
                        errors.append(f"Invalid joint loop indices: {joint}")
                        continue
                    if any(tuple(sorted((ring[i], ring[(i + 1) % len(ring)]))) not in edges for i in range(len(ring))):
                        errors.append(f"Joint ring is not a closed mesh edge cycle: {joint}")
                    center = sum((mesh.vertices[i].co for i in ring), Vector()) / len(ring)
                    if (center - anchor).length > .14:
                        errors.append(f"Joint ring is misplaced: {joint}")
    if not any(obj.name == "BaseBody" for obj in meshes):
        errors.append("Missing deforming BaseBody")
    lower, upper = (3000, 6000) if anatomy_c4 else (2500, 5000)
    if not lower <= total <= upper:
        errors.append(f"Triangle budget: {total}, expected {lower}..{upper}")
    report = {"triangles": total, "meshes": len(meshes), "bones": len(rig.data.bones) if rig else 0,
              "errors": errors, "checks": ["manifold", "transforms", "weights", "joint_edge_cycles",
                                            "joint_locations", "bone_names", "body_quads", "mirror_X"]}
    if errors:
        raise ValueError(json.dumps(report))
    return report


def validate_deformation(rig):
    """Temporary elbow/knee probe; restore rest pose. This does not author production animation clips."""
    body = bpy.data.objects["BaseBody"]
    results = []
    for name in ("LowerArm.L", "LowerLeg.L"):
        bone = rig.pose.bones[name]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler.x = .65
        bpy.context.view_layer.update()
        evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        moved = sum((a.co - b.co).length > .001 for a, b in zip(body.data.vertices, mesh.vertices))
        ratios = [p.area / original.area for p, original in zip(mesh.polygons, body.data.polygons)
                  if original.area > 1e-8]
        finite = all(math.isfinite(c) for vertex in mesh.vertices for c in vertex.co)
        evaluated.to_mesh_clear()
        bone.rotation_euler.x = 0
        bpy.context.view_layer.update()
        if not finite or moved < 20 or min(ratios) < .03 or max(ratios) > 30:
            raise ValueError(f"Deformation probe failed: {name}, moved={moved}, area={min(ratios), max(ratios)}")
        results.append({"bone": name, "radians": .65, "moved_vertices": moved,
                        "min_area_ratio": min(ratios), "max_area_ratio": max(ratios)})
    return results


if __name__ == "__main__":
    import argparse
    import sys
    from pathlib import Path
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    parser.add_argument("--report")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()), load_ui=False)
    result = validate_character()
    result["deformation_probes"] = validate_deformation(next(
        obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"))
    if args.report:
        Path(args.report).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print("CHARACTER_VALIDATION", json.dumps(result))
