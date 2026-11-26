"""Read the existing prototype without saving or modifying the source file."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import bpy

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--report", required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
source = Path(args.source)
before = hashlib.sha256(source.read_bytes()).hexdigest()
if source.suffix == ".glb":
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
else:
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
objects = []
for obj in bpy.data.objects:
    info = {"name": obj.name, "type": obj.type}
    if obj.type == "MESH":
        weights = [[g.weight for g in v.groups if g.weight > 1e-7] for v in obj.data.vertices]
        info.update(vertices=len(obj.data.vertices), polygons=len(obj.data.polygons),
                    quads=sum(len(p.vertices) == 4 for p in obj.data.polygons),
                    triangles=sum(max(0, len(p.vertices) - 2) for p in obj.data.polygons),
                    modifiers=[m.type for m in obj.modifiers], groups=len(obj.vertex_groups),
                    materials=[m.name for m in obj.data.materials if m],
                    max_influences=max((len(w) for w in weights), default=0),
                    max_weight_sum_error=max((abs(sum(w) - 1) for w in weights), default=0))
    if obj.type == "ARMATURE":
        info["bones"] = [bone.name for bone in obj.data.bones]
    objects.append(info)
after = hashlib.sha256(source.read_bytes()).hexdigest()
assert before == after, "Source file changed"
report = {"source": str(source), "sha256_before": before, "sha256_after": after,
          "blender": bpy.app.version_string, "objects": objects}
Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
print("SOURCE_INSPECTION", json.dumps(report))
