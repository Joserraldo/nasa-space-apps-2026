import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { AnimationMixer, Bone, Box3, BoxGeometry, Group, LoopOnce, Mesh, MeshStandardMaterial, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { applyCharacterPalette } from "../../src/kit/pieces/crew/load-character";
import { materials } from "../../src/materials/shared";
import { triangleCount } from "../../tools/geometry-inspection";
import { atlas, paletteUV, ATLAS_SIZE } from "../../src/materials/atlas";

type CharacterAsset = "base-a" | "tess" | "nia" | "vera" | "teo" | "eva";
function loadCharacterArtifact(asset: CharacterAsset) {
  const bytes = readFileSync(new URL(`../../public/models/characters/${asset}.glb`, import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { bytes, model: new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, "") };
}

it.each([
  ["skin_warm_umber", "skin_warm_umber", [120, 80, 60]],
  ["palette_warning", "uniformWarning", [255, 176, 32]],
])("maps character %s to its expected nonemissive atlas swatch", (exported, token, rgb) => {
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: exported }));
  const root = new Group().add(mesh);
  applyCharacterPalette(root);
  const [u, v] = paletteUV(token);
  const uv = mesh.geometry.getAttribute("uv");
  expect([uv.getX(0), uv.getY(0)]).toEqual([u, v]);
  const offset = (Math.floor((1 - v) * ATLAS_SIZE) * ATLAS_SIZE + Math.floor(u * ATLAS_SIZE)) * 4;
  expect([...atlas.pixels.slice(offset, offset + 4)]).toEqual([...rgb, 255]);
  expect([...atlas.emission.slice(offset, offset + 4)]).toEqual([0, 0, 0, 255]);
  expect(atlas.tiles.find(tile => tile.id === "warning")?.emissive).toBe(true);
});

it.each(["base-a"])("loads the optimized %s GLB with 22 bones and working atlas skinning", async asset => {
  const bytes = readFileSync(new URL(`../../public/models/characters/${asset}.glb`, import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, "");
  let bones = 0, meshes = 0;
  const tokens = new Set<string>();
  gltf.scene.traverse(node => {
    if (node instanceof Bone) bones++;
    if (node instanceof SkinnedMesh) {
      meshes++;
      expect(node.geometry.hasAttribute("skinIndex")).toBe(true);
      expect(node.geometry.hasAttribute("skinWeight")).toBe(true);
      expect(node.skeleton.bones).toHaveLength(22);
      if (!Array.isArray(node.material)) tokens.add(node.material.name);
    }
  });
  expect(bones).toBe(22); expect(meshes).toBeGreaterThan(0);
  expect(triangleCount(gltf.scene)).toBeGreaterThanOrEqual(3000);
  expect(triangleCount(gltf.scene)).toBeLessThanOrEqual(6000);
  expect(bytes.byteLength).toBeLessThan(150000);
  expect(tokens).toContain("palette_crewCharcoal");
  applyCharacterPalette(gltf.scene);
  gltf.scene.traverse(node => {
    if (!(node instanceof SkinnedMesh)) return;
    expect(node.material).toBe(materials.M_palette);
    expect(node.geometry.getAttribute("color").count).toBe(node.geometry.getAttribute("position").count);
    expect(Array.from(node.geometry.getAttribute("color").array).every(value => value === 1)).toBe(true);
  });
});

// Named crew (Q3): unmodified Quaternius meshes (Women CC-BY, Men CC0), recolored with tokens measured
// on the v1 reference frames, whole-part swaps only, weapons removed, non-combat clips kept.
it.each([
  ["tess", "tessAmber", 6000, 7600],
  ["nia", "niaAccent", 6000, 7600],
  ["vera", "veraAccent", 6000, 7600],
  ["teo", "teoAccent", 7000, 8600],
] as const)("builds %s from the Quaternius rig with its role accent and no weapons", async (asset, accent, minTris, maxTris) => {
  const { scene, animations } = await loadCharacterArtifact(asset).model;
  const tokens = new Set<string>();
  let bones = 0;
  scene.traverse(node => {
    if (node instanceof Bone) bones++;
    if (node instanceof SkinnedMesh && !Array.isArray(node.material)) tokens.add(node.material.name);
  });
  expect(bones).toBe(79);
  expect(tokens).toContain(`palette_${accent}`);
  expect(tokens).toContain("palette_crewCharcoal");
  for (const token of tokens) expect(atlas.tiles.some(tile => `palette_${tile.id}` === token), token).toBe(true);
  expect(triangleCount(scene)).toBeGreaterThanOrEqual(minTris);
  expect(triangleCount(scene)).toBeLessThanOrEqual(maxTris);
  expect(scene.getObjectByName("Pistol")).toBeUndefined();
  const intervals: Record<string, number> = {
    HitRecieve: 17, Idle: 50, Idle_Neutral: 50, Interact: 38, Roll: 40, Run: 24, Walk: 40, Wave: 50,
  };
  expect(animations.map(clip => clip.name).sort()).toEqual(Object.keys(intervals).sort());
  for (const clip of animations) {
    if (asset === "teo") {
      // The Men pack (Spacesuit rig) ships its own clip lengths.
      expect(clip.duration, clip.name).toBeGreaterThan(0.4);
      expect(clip.duration, clip.name).toBeLessThan(3);
    } else {
      // Women pack lengths; the glTF exporter may sample one extra frame at the clip end.
      expect(Math.abs(clip.duration - intervals[clip.name]! / 24), clip.name).toBeLessThanOrEqual(1 / 24 + 1e-4);
    }
  }
});

it.each(["tess", "nia", "vera", "teo"] as const)("deforms %s through every clip without nonfinite or runaway vertices", async asset => {
  const { scene, animations } = await loadCharacterArtifact(asset).model;
  const meshes: SkinnedMesh[] = [];
  scene.traverse(node => { if (node instanceof SkinnedMesh) meshes.push(node); });
  expect(meshes.length).toBeGreaterThan(0);
  const mixer = new AnimationMixer(scene);
  const bounds = new Box3();
  const vertex = new Vector3();
  for (const clip of animations) {
    const action = mixer.clipAction(clip).reset().setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    const frames = Math.round(clip.duration * 24);
    const head = scene.getObjectByName("Head");
    expect(head).toBeDefined();
    const firstHead = new Vector3();
    let motion = 0;
    for (let frame = 0; frame <= frames; frame++) {
      mixer.setTime(frame / 24);
      scene.updateMatrixWorld(true);
      if (frame === 0) head!.getWorldPosition(firstHead);
      motion = Math.max(motion, head!.getWorldPosition(vertex).distanceTo(firstHead));
      bounds.makeEmpty();
      for (const mesh of meshes) {
        const count = mesh.geometry.getAttribute("position").count;
        for (let i = 0; i < count; i++) {
          mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld);
          if (!Number.isFinite(vertex.lengthSq()) || vertex.lengthSq() > 16) {
            throw new Error(`${clip.name} frame ${frame}: invalid position at ${mesh.name}/${i}`);
          }
          bounds.expandByPoint(vertex);
        }
      }
      if (bounds.getSize(vertex).length() < 0.75 || vertex.length() > 2.8) {
        throw new Error(`${clip.name} frame ${frame}: collapsed or exploded skin`);
      }
    }
    expect(motion, clip.name).toBeGreaterThan(0.003);
    action.stop();
  }
});

it("builds the CH-06 EVA astronaut (CC0, region-colored, unmodified mesh) with helmet visor and life-support pack", async () => {
  const { scene, animations } = await loadCharacterArtifact("eva").model;
  const tokens = new Set<string>();
  let bones = 0;
  scene.traverse(node => {
    if (node instanceof Bone) bones++;
    if (node instanceof SkinnedMesh && !Array.isArray(node.material)) tokens.add(node.material.name);
  });
  expect(bones).toBe(66);
  for (const token of ["white", "gray", "darkGray", "black"]) expect(tokens).toContain(`palette_${token}`);
  for (const token of tokens) expect(atlas.tiles.some(tile => `palette_${tile.id}` === token), token).toBe(true);
  expect(triangleCount(scene)).toBeGreaterThanOrEqual(3500);
  expect(triangleCount(scene)).toBeLessThanOrEqual(4500);
  expect(animations).toHaveLength(0); // the source ships no clips; T6.3 animates it
});
