import * as THREE from "three";
import { register } from "../registry";
import { block, led } from "../primitives/mesh";
import { chamferRect, extrudeProfile, polygonRing, polygonShape } from "../primitives/geometry";
import { emissive, mat } from "../../materials/palette";

const M = 2; // grid module (m)
const H = 3; // clear room height (m)

/** ST-F01 floor tile, one 2x2 module. Pivot: cell corner. Dark joints show between tiles. */
register("ST-F01", (p) => {
  const g = new THREE.Group();
  g.add(block(M, 0.06, M, "gray", [M / 2, -0.06, M / 2], 0.005));
  g.add(block(M - 0.024, 0.06, M - 0.024, "white", [M / 2, -0.05, M / 2], 0.008));
  if (p.accent) {
    const t = 0.08;
    const inset = 0.3;
    const L = M - inset * 2;
    g.add(block(L, 0.012, t, "darkGray", [M / 2, 0.0, inset], 0.004));
    g.add(block(L, 0.012, t, "darkGray", [M / 2, 0.0, M - inset], 0.004));
    g.add(block(t, 0.012, L, "darkGray", [inset, 0.0, M / 2], 0.004));
    g.add(block(t, 0.012, L, "darkGray", [M - inset, 0.0, M / 2], 0.004));
  }
  return g;
});

function wallBase(g: THREE.Group, variant: string): void {
  g.add(block(M, H, 0.2, "offWhite", [M / 2, 0, -0.1], 0.01));
  g.add(block(M, 0.18, 0.07, "black", [M / 2, 0, 0.035], 0.02));
  g.add(block(M, 0.4, 0.1, "darkGray", [M / 2, H - 0.4, 0.05], 0.03));
  g.add(block(M, 0.05, 0.12, "black", [M / 2, H - 0.45, 0.06], 0.01));
  if (variant === "panel" || variant === "led" || variant === "vent") {
    g.add(block(1.62, 1.9, 0.06, "white", [M / 2, 0.42, 0.03], 0.05));
  }
  if (variant === "panel" || variant === "led") {
    g.add(block(1.2, 0.08, 0.02, "gray", [M / 2, 2.05, 0.065], 0.01));
  }
  if (variant === "vent") {
    for (let i = 0; i < 6; i++) g.add(block(0.9, 0.05, 0.05, "darkGray", [M / 2, 1.0 + i * 0.12, 0.07], 0.01));
  }
}

/** ST-W01 wall module (2 m wide). Pivot: bottom-left on the wall line; interior faces +Z. */
register("ST-W01", (p) => {
  const g = new THREE.Group();
  wallBase(g, (p.variant as string) ?? "panel");
  return g;
});

/** ST-W02 wall module with LED strips. */
register("ST-W02", (p) => {
  const g = new THREE.Group();
  wallBase(g, (p.variant as string) ?? "led");
  g.add(led(0.05, 1.5, 0.03, [0.16, 1.35, 0.075]));
  g.add(led(0.05, 1.5, 0.03, [M - 0.16, 1.35, 0.075]));
  g.add(led(M - 0.2, 0.03, 0.03, [M / 2, 0.2, 0.075]));
  return g;
});

/** ST-C01 octagonal column with a vertical LED slit. Pivot: base center. */
register("ST-C01", () => {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(extrudeProfile("col", polygonShape(0.3, 8), H, 0.02), mat("white"));
  shaft.rotation.x = -Math.PI / 2;
  shaft.position.y = H / 2;
  const foot = new THREE.Mesh(extrudeProfile("colFoot", polygonShape(0.36, 8), 0.3, 0.02), mat("black"));
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.17;
  g.add(shaft, foot);
  g.add(led(0.05, 1.8, 0.04, [0, 1.4, 0.3]));
  return g;
});

/**
 * ST-D01 framed niche (chamfered portal). Params: modules (width in modules).
 * Pivot: bottom-left on the wall line; protrudes +Z.
 */
register("ST-D01", (p) => {
  const g = new THREE.Group();
  const w = M * ((p.modules as number) ?? 3);
  const h = 2.9;
  const depth = 0.4;
  const frame = chamferRect(w, h, 0.45);
  frame.holes.push(new THREE.Path(chamferRect(w - 0.5, h - 0.75, 0.3).getPoints().reverse()));
  const fm = new THREE.Mesh(extrudeProfile(`niche${w}`, frame, depth, 0.04), mat("white"));
  fm.position.set(w / 2, h / 2, depth / 2);
  g.add(fm);
  g.add(block(w - 0.5, h - 0.75, 0.1, "black", [w / 2, 0.12, -0.05], 0.01));
  g.add(block(w - 0.9, 0.5, 0.12, "offWhite", [w / 2, h - 0.62, depth * 0.55], 0.06));
  g.add(block(0.3, 0.3, 0.05, "gray", [w * 0.18, h - 0.52, depth * 0.55 + 0.08], 0.02));
  g.add(led(w - 0.9, 0.03, 0.03, [w / 2, h - 0.08, depth + 0.02], "white", 2.2));
  return g;
});

/** ST-R01 ceiling module with recessed linear LED. Pivot: cell corner at floor level. */
register("ST-R01", (p) => {
  const g = new THREE.Group();
  // Dark structural grid with a lighter recessed panel: reads as the reference's ceiling coffers.
  g.add(block(M, 0.1, M, "black", [M / 2, H + 0.02, M / 2], 0.01));
  g.add(block(M - 0.22, 0.06, M - 0.22, "offWhite", [M / 2, H - 0.02, M / 2], 0.03));
  g.add(block(M - 0.1, 0.08, 0.22, "darkGray", [M / 2, H - 0.1, 0.11], 0.02));
  if (p.light !== false) g.add(led(M - 0.5, 0.02, 0.07, [M / 2, H - 0.11, 0.11], "white", 2.4));
  return g;
});

/** ST-R02 decagonal ring lamp hanging from the ceiling. Pivot: center under the ceiling. */
register("ST-R02", (p) => {
  const g = new THREE.Group();
  const r = (p.radius as number) ?? 1.5;
  const ring = new THREE.Mesh(extrudeProfile(`ring${r}`, polygonRing(r, r * 0.66, 10), 0.28, 0.03), mat("white"));
  ring.rotation.x = -Math.PI / 2;
  const glow = new THREE.Mesh(extrudeProfile(`ringGlow${r}`, polygonRing(r * 0.95, r * 0.72, 10), 0.03, 0), emissive("white", 3.6));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.16;
  const collar = new THREE.Mesh(extrudeProfile(`ringIn${r}`, polygonRing(r * 0.7, r * 0.6, 10), 0.18, 0.02), mat("gray"));
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = 0.05;
  g.add(ring, glow, collar);
  g.position.y = H - 0.28;
  return g;
});

/** ST-R04 round downlight. */
register("ST-R04", () => {
  const g = new THREE.Group();
  const can = new THREE.Mesh(extrudeProfile("dl", polygonShape(0.16, 8), 0.06, 0.01), mat("gray"));
  can.rotation.x = -Math.PI / 2;
  can.position.y = H - 0.03;
  const lens = new THREE.Mesh(extrudeProfile("dlLens", polygonShape(0.12, 8), 0.01, 0), emissive("white", 3));
  lens.rotation.x = -Math.PI / 2;
  lens.position.y = H - 0.065;
  g.add(can, lens);
  return g;
});
