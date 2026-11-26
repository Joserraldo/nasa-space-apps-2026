"""A-pose armature with 22 standard bones. No production animations before the T6.1 gate."""
import bpy
from mesh_builder import revised_height


def create_rig():
    data = bpy.data.armatures.new("BaseRig")
    rig = bpy.data.objects.new("BaseRig", data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    def bone(name, head, tail, parent=None):
        value = data.edit_bones.new(name)
        if name == "Root":
            value.head, value.tail = head, tail
        else:
            value.head = (*head[:2], revised_height(head[2]))
            value.tail = (*tail[:2], revised_height(tail[2]))
        if parent:
            value.parent = data.edit_bones[parent]
    bone("Root", (0, 0, 0), (0, 0, .15))
    bone("Hips", (0, 0, .70), (0, 0, .89), "Root")
    bone("Spine", (0, 0, .89), (0, 0, 1.05), "Hips")
    bone("Chest", (0, 0, 1.05), (0, 0, 1.28), "Spine")
    bone("Neck", (0, 0, 1.28), (0, 0, 1.39), "Chest")
    bone("Head", (0, 0, 1.39), (0, 0, 1.76), "Neck")
    for sign, side in [(1, "L"), (-1, "R")]:
        bone(f"Shoulder.{side}", (0, 0, 1.27), (sign * .285, 0, 1.27), "Chest")
        bone(f"UpperArm.{side}", (sign * .285, 0, 1.27), (sign * .528, 0, 1.108), f"Shoulder.{side}")
        bone(f"LowerArm.{side}", (sign * .528, 0, 1.108), (sign * .726, 0, .976), f"UpperArm.{side}")
        bone(f"Hand.{side}", (sign * .726, 0, .976), (sign * .78, 0, .94), f"LowerArm.{side}")
        bone(f"UpperLeg.{side}", (sign * .115, 0, .73), (sign * .115, 0, .397), "Hips")
        bone(f"LowerLeg.{side}", (sign * .115, 0, .397), (sign * .115, 0, .118), f"UpperLeg.{side}")
        bone(f"Foot.{side}", (sign * .115, 0, .118), (sign * .115, -.10, .06), f"LowerLeg.{side}")
        bone(f"Toe.{side}", (sign * .115, -.10, .06), (sign * .115, -.15, .06), f"Foot.{side}")
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    return rig


def bind_body(obj, builder, rig):
    # Start with Blender heat weights, then review every vertex using deterministic region weights.
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    obj.vertex_groups.clear()
    groups = {bone.name: obj.vertex_groups.new(name=bone.name) for bone in rig.data.bones}
    for index, weights in enumerate(builder.weights):
        total = sum(weights.values())
        for name, weight in weights.items():
            if weight > 1e-8:
                groups[name].add([index], weight / total, "REPLACE")
    if not any(mod.type == "ARMATURE" for mod in obj.modifiers):
        obj.modifiers.new("Armature", "ARMATURE").object = rig


def bind_rigid(obj, rig, bone="Head"):
    obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))), 1, "REPLACE")
    obj.parent = rig
    obj.modifiers.new("Armature", "ARMATURE").object = rig
