import { Group, Mesh, PlaneGeometry, Shape, type BufferGeometry } from "three";
import { chamferBox, extrudeProfile, polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { HiddenFace } from "../../primitives/normals";
import { decalScreenGeometry, type DecalType } from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boostVertexLuminance, boxAt, boxCenter, extrudedMesh, type PaletteKey } from "../station/helpers";

const decalPlanes = new Map<string, BufferGeometry>();

/**
 * Neutralize the warm cream cast of indoor "white" (#D4D2C2) so exterior Mars colony hulls
 * read crisp architectural white (matching v3-t054.60 / v3-t079.90 / v3-t104.90) without
 * exceeding linear 1.0 bloom threshold.
 */
export function exteriorWhiteGeometry(source: BufferGeometry, weld = false): BufferGeometry {
  return cachedGeometry(["extWhite", source.uuid, weld], () => {
    const colored = coloredGeometry(source, "white", weld ? { weld: true } : undefined);
    return boostVertexLuminance(colored, [1.03, 1.06, 1.21]);
  });
}

export function whiteBoxAt(
  size: [number, number, number],
  at: [number, number, number],
  chamfer = 0.02,
  omit: HiddenFace[] = [],
): Mesh {
  const [w, h, d] = size;
  const safeChamfer = Math.max(0.005, Math.min(chamfer, w * 0.3, h * 0.3, d * 0.3));
  const mesh = new Mesh(exteriorWhiteGeometry(chamferBox(w, h, d, safeChamfer, omit)), materials.M_palette);
  mesh.position.set(at[0], at[1] + h / 2, at[2]);
  return mesh;
}

export function whiteBoxCenter(
  size: [number, number, number],
  center: [number, number, number],
  chamfer = 0.02,
  omit: HiddenFace[] = [],
): Mesh {
  const [w, h, d] = size;
  const safeChamfer = Math.max(0.005, Math.min(chamfer, w * 0.3, h * 0.3, d * 0.3));
  const mesh = new Mesh(exteriorWhiteGeometry(chamferBox(w, h, d, safeChamfer, omit)), materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

export function whiteExtruded(
  shape: Shape,
  depth: number,
  bevel: number,
  center: [number, number, number],
): Mesh {
  const safeBevel = Math.max(0.005, Math.min(bevel, depth * 0.35));
  const mesh = new Mesh(exteriorWhiteGeometry(extrudeProfile(shape, depth, safeBevel)), materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

/** Crisp crimson-red valve geometry (lifts dark uniform red #792B2C into industrial valve red). */
export function valveRedBoxCenter(
  size: [number, number, number],
  center: [number, number, number],
  chamfer = 0.02,
): Mesh {
  const [w, h, d] = size;
  const safeChamfer = Math.max(0.005, Math.min(chamfer, w * 0.3, h * 0.3, d * 0.3));
  const geom = cachedGeometry(["valveRedV2", w, h, d, safeChamfer], () =>
    boostVertexLuminance(coloredGeometry(chamferBox(w, h, d, safeChamfer), "red"), [1.88, 0.88, 0.78]),
  );
  const mesh = new Mesh(geom, materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

/** Physical beveled placard with matte aerospace sticker mapped on shared M_screen (+Z normal). */
export function stickerPlacard(
  width: number,
  height: number,
  decal: DecalType,
  frameColor: PaletteKey = "darkGray",
): Group {
  const group = new Group();
  group.add(boxCenter([width + 0.04, height + 0.04, 0.018], frameColor, [0, 0, 0], 0.006));

  const key = `decal:${width}:${height}:${decal}`;
  let geo = decalPlanes.get(key);
  if (!geo) {
    const plane = new PlaneGeometry(width, height);
    geo = decalScreenGeometry(plane, decal);
    plane.dispose();
    decalPlanes.set(key, geo);
  }
  const quad = new Mesh(geo, materials.M_screen);
  quad.position.z = 0.012;
  group.add(quad);
  return group;
}

/** Recessed dark louver grille assembly facing +Z. */
export function ventGrilleGroup(width: number, height: number, slats = 3): Group {
  const group = new Group();
  group.add(boxCenter([width, height, 0.05], "darkGray", [0, 0, 0], 0.01));
  group.add(boxCenter([width - 0.08, height - 0.08, 0.035], "black", [0, 0, 0.016], 0.008));
  const innerH = height - 0.12;
  for (let i = 0; i < slats; i++) {
    const y = -innerH / 2 + ((i + 0.5) / slats) * innerH;
    const blade = boxCenter([width - 0.12, Math.min(0.045, innerH / (slats * 1.8)), 0.04], "gray", [0, y, 0.028], 0.006);
    blade.rotation.x = 0.28;
    group.add(blade);
  }
  return group;
}

/** External equipment pod with recessed dark slot and glowing cyan status bar (+Z facing). */
export function cyanEquipPod(width = 0.56, height = 0.42, depth = 0.22): Group {
  const group = new Group();
  group.add(boxCenter([width, height, depth], "gray", [0, 0, 0], 0.025));
  group.add(boxCenter([width - 0.1, height * 0.46, 0.04], "black", [0, 0.04, depth / 2 - 0.005], 0.008));
  group.add(boxCenter([width - 0.16, 0.055, 0.035], "cyan", [0, 0.04, depth / 2 + 0.008], 0.008));
  group.add(boxCenter([width - 0.14, 0.07, 0.035], "darkGray", [0, -height * 0.26, depth / 2], 0.008));
  return group;
}

/** Twin black capped stanchions bridging a red industrial shutoff valve (v3-t054.60 hub detail). */
export function twinPostRedValve(): Group {
  const group = new Group();
  for (const x of [-0.58, 0.58]) {
    const foot = extrudedMesh(polygonShape(0.28, 8), 0.34, 0.025, "black", [x, 0.17, 0]);
    foot.rotation.x = -Math.PI / 2;
    const post = extrudedMesh(polygonShape(0.20, 8), 1.16, 0.02, "darkGray", [x, 0.86, 0]);
    post.rotation.x = -Math.PI / 2;
    const cap = extrudedMesh(polygonShape(0.27, 8), 0.14, 0.02, "gray", [x, 1.48, 0]);
    cap.rotation.x = -Math.PI / 2;
    group.add(foot, post, cap);
  }
  group.add(valveRedBoxCenter([1.02, 0.24, 0.24], [0, 1.06, 0], 0.025));
  group.add(boxCenter([0.34, 0.34, 0.34], "black", [0, 1.06, 0], 0.025));
  group.add(valveRedBoxCenter([0.20, 0.14, 0.22], [0, 1.30, 0], 0.02));
  return group;
}
