import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { Mesh, type Object3D } from "three";

/** Replace exported palette zones with the shared atlas, preserving skin attributes and armature. */
export async function loadBaseCharacter(character: "base-a" | "tess" = "base-a") {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`/models/characters/${character}.glb`);
  applyCharacterPalette(gltf.scene);
  return gltf.scene;
}

export const crewMembers = ["tess", "nia", "vera", "teo"] as const;
/** CH-06: EVA astronaut for exterior shots, built with the same Q3 pipeline. */
export type CrewMember = (typeof crewMembers)[number] | "eva";

/** Named crew (Quaternius base, Q3 recolor): scene with atlas colors plus its animation clips. */
export async function loadCrewMember(member: CrewMember) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`/models/characters/${member}.glb`);
  applyCharacterPalette(gltf.scene);
  gltf.scene.name = member;
  return { scene: gltf.scene, animations: gltf.animations };
}

export function applyCharacterPalette(root: Object3D) {
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const exported = Array.isArray(node.material) ? node.material[0] : node.material;
    const token = exported.name.replace(/^palette_/, "");
    node.geometry = coloredGeometry(node.geometry, token === "warning" ? "uniformWarning" : token);
    node.material = materials.M_palette;
    node.castShadow = true; node.receiveShadow = true;
  });
}
