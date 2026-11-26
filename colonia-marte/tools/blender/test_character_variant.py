"""Run under headless Blender with --python-exit-code 1."""
import sys
import unittest
from copy import deepcopy
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_base import generate
from build_variant import TESS, apply_variant
from validate import validate_character


def skeleton(rig):
    return {
        bone.name: (
            bone.parent.name if bone.parent else None,
            tuple(tuple(row) for row in bone.matrix_local),
            bone.length,
        )
        for bone in rig.data.bones
    }


class CharacterVariantTest(unittest.TestCase):
    def test_tess_replaces_visual_regions_without_editing_the_base_body_or_rig(self):
        base = Path(__file__).resolve().parents[2] / "public/models/characters/base-a-v3.blend"
        if base.exists():
            bpy.ops.wm.open_mainfile(filepath=str(base), load_ui=False)
        else:
            generate()
        rig = bpy.data.objects["BaseRig"]
        body = bpy.data.objects["BaseBody"]
        before_rig = skeleton(rig)
        before_vertices = [tuple(vertex.co) for vertex in body.data.vertices]

        apply_variant(TESS)

        self.assertEqual(skeleton(rig), before_rig)
        self.assertEqual([tuple(vertex.co) for vertex in body.data.vertices], before_vertices)
        self.assertEqual([slot.name for slot in body.material_slots],
                         ["palette_black", "palette_warning", "skin_warm_umber"])
        self.assertEqual(bpy.data.objects["Head_faceted"].material_slots[1].name, "palette_black")
        self.assertNotIn("Hair_bun", bpy.context.scene.objects)
        self.assertIn("Hair_side_lock", bpy.context.scene.objects)
        wrench = bpy.data.objects["Gear_open_wrench"]
        self.assertEqual([group.name for group in wrench.vertex_groups], ["UpperLeg.L"])
        self.assertEqual(validate_character()["bones"], 22)

    def test_recipe_changes_do_not_require_a_new_character_builder(self):
        generate()
        recipe = deepcopy(TESS)
        recipe.update(skin="skin", accent="teal", hair_color="black", accessories=[])
        del recipe["hair"]["side_lock"]

        apply_variant(recipe)

        self.assertEqual(bpy.data.objects["BaseBody"].material_slots[1].name, "palette_teal")
        self.assertEqual(bpy.data.objects["Head_faceted"].material_slots[0].name, "palette_skin")
        self.assertEqual(bpy.data.objects["Hair_crown"].material_slots[0].name, "palette_black")
        self.assertNotIn("Hair_side_lock", bpy.context.scene.objects)
        self.assertFalse(any(obj.name.startswith("Gear_") for obj in bpy.context.scene.objects))
        self.assertEqual(validate_character()["bones"], 22)


if __name__ == "__main__":
    program = unittest.main(argv=[__file__], verbosity=2, exit=False)
    if not program.result.wasSuccessful():
        raise RuntimeError("Character variant tests failed")
