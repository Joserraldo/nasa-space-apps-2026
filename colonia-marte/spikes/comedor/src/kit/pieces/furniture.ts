import * as THREE from "three";
import { register } from "../registry";
import { block, led } from "../primitives/mesh";
import { extrudeProfile, polygonShape } from "../primitives/geometry";
import { emissive, mat } from "../../materials/palette";
import { screenTexture, type ScreenIcon } from "./screens";

/** DN-01 canteen table (1.6 x 0.9 m). Pivot: base center. */
register("DN-01", () => {
  const g = new THREE.Group();
  g.add(block(0.7, 0.05, 0.5, "black", [0, 0, 0], 0.02));
  g.add(block(0.24, 0.64, 0.24, "darkGray", [0, 0.05, 0], 0.04));
  g.add(block(1.3, 0.05, 0.6, "gray", [0, 0.66, 0], 0.02));
  g.add(block(1.6, 0.07, 0.9, "white", [0, 0.71, 0], 0.03));
  g.add(led(1.2, 0.015, 0.02, [0, 0.69, 0.42]));
  g.add(led(1.2, 0.015, 0.02, [0, 0.69, -0.42]));
  return g;
});

/** DN-02 chair with white shell and blue cushions. Pivot: base center, facing +Z. */
register("DN-02", () => {
  const g = new THREE.Group();
  const foot = new THREE.Mesh(extrudeProfile("chairFoot", polygonShape(0.24, 8), 0.04, 0.01), mat("black"));
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.03;
  g.add(foot);
  g.add(block(0.08, 0.36, 0.08, "darkGray", [0, 0.05, 0], 0.015));
  g.add(block(0.52, 0.1, 0.5, "white", [0, 0.4, 0], 0.035));
  g.add(block(0.44, 0.05, 0.42, "blue", [0, 0.5, 0.02], 0.02));
  const back = new THREE.Group();
  back.add(block(0.52, 0.72, 0.08, "white", [0, 0, 0], 0.035));
  back.add(block(0.42, 0.56, 0.04, "blue", [0, 0.1, 0.05], 0.02));
  back.position.set(0, 0.48, -0.23);
  back.rotation.x = -0.1;
  g.add(back);
  return g;
});

/** DN-04 food dispenser with a screen. Params: icon. Pivot: base center, facing +Z. */
register("DN-04", (p) => {
  const g = new THREE.Group();
  const icon = ((p.icon as ScreenIcon) ?? "menu");
  g.add(block(1.0, 0.16, 0.66, "gray", [0, 0, 0], 0.03));
  g.add(led(0.62, 0.03, 0.02, [0, 0.09, 0.34]));
  g.add(block(0.2, 1.62, 0.62, "white", [-0.42, 0.14, 0], 0.05));
  g.add(block(0.2, 1.62, 0.62, "white", [0.42, 0.14, 0], 0.05));
  g.add(block(0.66, 0.5, 0.5, "black", [0, 0.16, -0.04], 0.02));
  g.add(block(0.18, 0.14, 0.14, "gray", [0, 0.52, 0.06], 0.03));
  g.add(led(0.3, 0.02, 0.02, [0, 0.62, 0.12], "white", 2.4));
  g.add(block(0.86, 0.1, 0.6, "offWhite", [0, 0.66, 0], 0.03));
  g.add(block(0.8, 0.56, 0.1, "black", [0, 0.82, 0.2], 0.04));
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture(icon),
    emissiveMap: screenTexture(icon),
    emissive: "#ffffff",
    emissiveIntensity: 1.25,
    roughness: 0.35,
  });
  screenMat.name = `M_screen_${icon}`;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), screenMat);
  screen.position.set(0, 1.1, 0.256);
  g.add(screen);
  g.add(block(1.0, 0.3, 0.66, "white", [0, 1.4, 0], 0.07));
  g.add(block(0.34, 0.05, 0.04, "darkGray", [0, 1.56, 0.33], 0.01));
  g.add(led(0.26, 0.03, 0.02, [0, 1.65, 0.3]));
  // Dark inner cheeks frame the screen and the dispensing bay, as in the reference.
  g.add(block(0.05, 1.0, 0.5, "darkGray", [-0.33, 0.16, 0.04], 0.01));
  g.add(block(0.05, 1.0, 0.5, "darkGray", [0.33, 0.16, 0.04], 0.01));
  g.scale.setScalar(1.12);
  return g;
});

/** DN-06 table lantern with a warm glowing core. */
register("DN-06", () => {
  const g = new THREE.Group();
  g.add(block(0.14, 0.03, 0.14, "black", [0, 0, 0], 0.01));
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.1), emissive("warmWhite", 2.6));
  core.position.y = 0.11;
  g.add(core);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    g.add(block(0.025, 0.18, 0.025, "black", [x * 0.06, 0.02, z * 0.06], 0.005));
  }
  g.add(block(0.15, 0.03, 0.15, "black", [0, 0.2, 0], 0.01));
  return g;
});

/** DN-09 waste bin with dark body and slot. */
register("DN-09", () => {
  const g = new THREE.Group();
  g.add(block(0.42, 0.85, 0.42, "darkGray", [0, 0, 0], 0.04));
  g.add(block(0.44, 0.06, 0.44, "black", [0, 0.85, 0], 0.02));
  g.add(block(0.26, 0.05, 0.02, "black", [0, 0.68, 0.21], 0.005));
  return g;
});

/** PR-02 planter with LED band. Params: length. Pivot: base center. */
register("PR-02", (p) => {
  const g = new THREE.Group();
  const L = (p.length as number) ?? 1.2;
  g.add(block(L, 0.5, 0.5, "white", [0, 0, 0], 0.05));
  g.add(block(L - 0.1, 0.04, 0.4, "soil", [0, 0.48, 0], 0.01));
  g.add(led(L - 0.2, 0.03, 0.02, [0, 0.12, 0.26]));
  return g;
});

/** PR-01 low-poly plant (seeded, deterministic). Params: seed, leaves. */
register("PR-01", (p) => {
  const g = new THREE.Group();
  let s = ((p.seed as number) ?? 1) * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const n = (p.leaves as number) ?? 9;
  const leaf = new THREE.OctahedronGeometry(0.5, 0);
  leaf.scale(0.16, 0.42, 0.04);
  leaf.translate(0, 0.2, 0);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(leaf, mat(i % 3 === 0 ? "plantLight" : "plantDark"));
    m.rotation.set(0.5 + rnd() * 0.6, (i / n) * Math.PI * 2 + rnd() * 0.4, 0, "YXZ");
    const k = 0.75 + rnd() * 0.5;
    m.scale.setScalar(k);
    g.add(m);
  }
  return g;
});
