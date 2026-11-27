import {
  BoxGeometry,
  BufferGeometry,
  Group,
  LatheGeometry,
  LOD,
  Matrix4,
  Mesh,
  Shape,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { bakeVertexAO, type AOCache } from "../../../core/bake-vertex-ao";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { chamferBox, extrudeProfile, panelInset } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { Point3 } from "../../primitives/details";
import { finishGeometry, type HiddenFace } from "../../primitives/normals";
import type { PieceRegistry } from "../../registry";
import {
  alignBaseCenter,
  boostVertexLuminance,
  parseChoice,
  parseRecord,
  type PaletteKey,
} from "../station/helpers";

export const vehicleDetailLevels = ["near", "middle", "far"] as const;
export type VehicleDetail = (typeof vehicleDetailLevels)[number];

const vehicleAOCache: AOCache = new Map();

/** Crisp neutral exterior white matching approved Mars colony & MV-09 hulls (zero cream/ochre cast). */
export function vehicleWhiteMesh(source: BufferGeometry, position: Point3 = [0, 0, 0]): Mesh {
  const colored = coloredGeometry(source, "white", { weld: true });
  const boosted = boostVertexLuminance(colored, [1.03, 1.06, 1.21]);
  const mesh = new Mesh(boosted, materials.M_palette);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

export function vWhiteBox(
  size: [number, number, number],
  center: Point3,
  bevel?: number,
  omit: HiddenFace[] = [],
): Mesh {
  const [w, h, d] = size;
  const b = bevel ?? Math.min(w, h, d) * 0.16;
  const safe = Math.max(0.004, Math.min(b, w * 0.32, h * 0.32, d * 0.32));
  return vehicleWhiteMesh(chamferBox(w, h, d, safe, omit), center);
}

export function vColorBox(
  size: [number, number, number],
  color: PaletteKey,
  center: Point3,
  bevel?: number,
  omit: HiddenFace[] = [],
): Mesh {
  const [w, h, d] = size;
  const b = bevel ?? Math.min(w, h, d) * 0.16;
  const safe = Math.max(0.004, Math.min(b, w * 0.32, h * 0.32, d * 0.32));
  const mesh = new Mesh(coloredGeometry(chamferBox(w, h, d, safe, omit), color, { weld: true }), materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

export function vTintedStrip(
  size: [number, number, number],
  color: PaletteKey,
  tint: [number, number, number],
  center: Point3,
): Mesh {
  const raw = finishGeometry(new BoxGeometry(size[0], size[1], size[2]));
  const colored = boostVertexLuminance(coloredGeometry(raw, color, { weld: true }), tint);
  raw.dispose();
  const mesh = new Mesh(colored, materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

export function vStrip(size: [number, number, number], color: PaletteKey, center: Point3): Mesh {
  const raw = finishGeometry(new BoxGeometry(size[0], size[1], size[2]));
  const mesh = new Mesh(coloredGeometry(raw, color, { weld: true }), materials.M_palette);
  raw.dispose();
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

/** Extrude a 2D side-elevation polygon [z, y][] symmetrically along X with beveled edges. */
export function extrudeSideProfileX(
  ptsZY: readonly [number, number][],
  widthX: number,
  bevel: number,
  color: PaletteKey | "exteriorWhite",
  centerX = 0,
): Mesh {
  const shape = new Shape();
  ptsZY.forEach(([z, y], idx) => {
    // After rotation.y = +PI/2: local +X -> world -Z, so use xShape = -z to map to world +Z!
    if (idx === 0) shape.moveTo(-z, y);
    else shape.lineTo(-z, y);
  });
  shape.closePath();
  const safeBevel = Math.max(0.005, Math.min(bevel, widthX * 0.28));
  const raw = extrudeProfile(shape, widthX, safeBevel);
  raw.rotateY(Math.PI / 2);
  // extrudeProfile centers Z in [-depth/2..+depth/2], which after rotateY(+PI/2) centers X in [-widthX/2..+widthX/2]!
  const geo = color === "exteriorWhite"
    ? boostVertexLuminance(coloredGeometry(raw, "white", { weld: true }), [1.03, 1.06, 1.21])
    : coloredGeometry(raw, color, { weld: true });
  raw.dispose();
  const mesh = new Mesh(geo, materials.M_palette);
  mesh.position.x = centerX;
  return mesh;
}

export function vStrut(a: Point3, b: Point3, thickness: number, color: PaletteKey): Mesh {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const delta = vb.clone().sub(va);
  const len = Math.max(0.02, delta.length());
  const mid: Point3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const mesh = vColorBox([thickness, len, thickness], color, mid, thickness * 0.24, ["top", "bottom"]);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
  return mesh;
}

/** Revolve a [radius, axialX] profile around the local X axis with optional vertex RGB multiplier. */
export function latheAlongX(
  profile: readonly [number, number][],
  segments: number,
  color: PaletteKey,
  pos: Point3 = [0, 0, 0],
  tint?: [number, number, number],
): Mesh {
  const geo = new LatheGeometry(profile.map(([r, ax]) => new Vector2(r, ax)), segments);
  if (profile.some(([r]) => r === 0)) {
    const idx = geo.getIndex()!;
    const stride = profile.length;
    const clean: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      const tri = [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)];
      if (tri.filter(v => profile[v % stride][0] === 0).length < 2) {
        clean.push(...tri);
      }
    }
    geo.setIndex(clean);
  }
  geo.rotateZ(-Math.PI / 2);
  const finished = finishGeometry(geo);
  geo.dispose();
  const baseColored = coloredGeometry(finished, color, { weld: true });
  finished.dispose();
  const finalGeo = tint ? boostVertexLuminance(baseColored, tint) : baseColored;
  const mesh = new Mesh(finalGeo, materials.M_palette);
  mesh.position.set(pos[0], pos[1], pos[2]);
  return mesh;
}

/** Merge a group of M_palette meshes into a single clean indexed, welded, unit-normal BufferGeometry. */
export function mergePaletteGroup(group: Group): BufferGeometry {
  group.updateMatrixWorld(true);
  const rootInv = group.matrixWorld.clone().invert();
  const parts: BufferGeometry[] = [];
  const mat = new Matrix4();
  group.traverse(node => {
    if (!(node instanceof Mesh)) return;
    mat.multiplyMatrices(rootInv, node.matrixWorld);
    const clone = node.geometry.clone();
    clone.applyMatrix4(mat);
    parts.push(clone);
  });
  const merged = mergeGeometries(parts, false)!;
  parts.forEach(p => p.dispose());
  const welded = mergeVertices(merged, 1e-6);
  merged.dispose();
  const norm = welded.getAttribute("normal");
  const v = new Vector3();
  for (let i = 0; i < norm.count; i++) {
    v.fromBufferAttribute(norm, i);
    if (v.lengthSq() < 1e-8) v.set(0, 1, 0);
    else v.normalize();
    norm.setXYZ(i, v.x, v.y, v.z);
  }
  return welded;
}

/**
 * Fuse an opaque M_palette vehicle body + unoccluded emissive accents into a single draw-call Mesh,
 * baking contact AO onto the opaque surfaces against both the body and proxy wheel occluders.
 */
export function fuseVehicleBody(
  name: string,
  opaqueGroup: Group,
  emissiveGroup: Group,
  extraOccluders: Group | null,
  bakeAO: boolean,
  aoRadius = 0.85,
): Mesh {
  let bodyGeo = mergePaletteGroup(opaqueGroup);
  if (bakeAO) {
    const occBase = new BufferGeometry();
    occBase.setAttribute("position", bodyGeo.getAttribute("position"));
    occBase.setIndex(bodyGeo.getIndex());
    let occluderGeo = occBase;
    if (extraOccluders && extraOccluders.children.length > 0) {
      const proxyFull = mergePaletteGroup(extraOccluders);
      const proxySlim = new BufferGeometry();
      proxySlim.setAttribute("position", proxyFull.getAttribute("position"));
      proxySlim.setIndex(proxyFull.getIndex());
      const combined = mergeGeometries([occBase, proxySlim], false)!;
      proxyFull.dispose();
      occluderGeo = combined;
    }
    const baked = bakeVertexAO(
      bodyGeo,
      { samples: 10, radius: aoRadius, strength: 0.77, bias: 0.003 },
      vehicleAOCache,
      occluderGeo,
    ).geometry;
    if (occluderGeo !== occBase) occluderGeo.dispose();
    bodyGeo.dispose();
    bodyGeo = baked;
  }

  let finalGeo = bodyGeo;
  if (emissiveGroup.children.length > 0) {
    const emGeo = mergePaletteGroup(emissiveGroup);
    const mergedAll = mergeGeometries([bodyGeo, emGeo], false)!;
    bodyGeo.dispose();
    emGeo.dispose();
    finalGeo = mergeVertices(mergedAll, 1e-6);
    mergedAll.dispose();
    const norm = finalGeo.getAttribute("normal");
    const v = new Vector3();
    for (let i = 0; i < norm.count; i++) {
      v.fromBufferAttribute(norm, i).normalize();
      norm.setXYZ(i, v.x, v.y, v.z);
    }
  }

  const mesh = new Mesh(finalGeo, materials.M_palette);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export interface RoverWheelSpec {
  cacheKey: string;
  wheelId: string;
  radius: number;
  width: number;
  sideSign: -1 | 1;
  detail: VehicleDetail;
  rimColor?: PaletteKey;
  accentColor: PaletteKey;
}

/**
 * Build an articulated rover wheel centered at local (0,0,0) with 4-fold YZ rotational symmetry
 * around its X axle (`userData.axis = [1, 0, 0]`), guaranteeing zero center drift on 90-deg or arbitrary spin.
 */
export function buildArticulatedWheel(spec: RoverWheelSpec): Group {
  const { cacheKey, wheelId, radius, width, sideSign, detail, rimColor = "hull", accentColor } = spec;
  const geo = cachedGeometry(
    ["marsRoverWheelV4", cacheKey, radius, width, sideSign, detail, rimColor, accentColor],
    () => {
      // Round 16-segment carcass in near LOD (multiple of 4 for exact 90-deg rotational symmetry)
      const segs = detail === "near" ? 16 : detail === "middle" ? 12 : 8;
      // 8 chevron steps (multiple of 4) = 16 angled V-tread lugs in near; 8 straight bars in middle; smooth in far
      const treadSteps = detail === "near" ? 8 : detail === "middle" ? 8 : 0;
      const hw = width / 2;
      const lugRaise = treadSteps > 0 ? radius * 0.026 : 0;
      const rCrown = radius - lugRaise;
      const rBulge = rCrown * 0.94;
      const rBead = radius * 0.63;
      const rWell = radius * 0.54;
      const rHub = radius * 0.25;

      // Dark charcoal tire rubber (#303432) so treads never look like silver/white zebra paddles!
      const rubberTint: [number, number, number] = [0.41, 0.41, 0.42];
      const treadTint: [number, number, number] = [0.31, 0.31, 0.32];

      const opaque = new Group();
      const emissive = new Group();

      // 1. Round off-road tire carcass with realistic sidewall bulge (symmetric in X: [-0.94*hw .. +0.94*hw])
      const tireProfile: [number, number][] = [
        [rBead, -hw * 0.80],
        [rBulge, -hw * 0.94],
        [rCrown, -hw * 0.80],
        [rCrown, hw * 0.80],
        [rBulge, hw * 0.94],
        [rBead, hw * 0.80],
      ];
      opaque.add(latheAlongX(tireProfile, segs, "darkGray", [0, 0, 0], rubberTint));

      // 2. Deep recessed dark brake disc + alloy rim barrel/bead flange + central planetary hub cap
      const outX = sideSign * hw;
      const cavityProfile: [number, number][] = sideSign > 0
        ? [[0, outX * 0.42], [rWell * 1.02, outX * 0.42]]
        : [[rWell * 1.02, outX * 0.42], [0, outX * 0.42]];
      opaque.add(latheAlongX(cavityProfile, 8, "black"));

      const beadFlange: [number, number][] = sideSign > 0
        ? [
          [rWell, outX * 0.42],
          [rWell, outX * 0.88],
          [rBead * 1.01, outX * 0.88],
          [rBead * 1.01, outX * 0.78],
        ]
        : [
          [rBead * 1.01, outX * 0.78],
          [rBead * 1.01, outX * 0.88],
          [rWell, outX * 0.88],
          [rWell, outX * 0.42],
        ];
      opaque.add(latheAlongX(beadFlange, segs, rimColor));

      const hubCap: [number, number][] = sideSign > 0
        ? [
          [rHub * 1.08, outX * 0.42],
          [rHub * 0.92, outX * 0.88],
          [0, outX * 0.94],
        ]
        : [
          [0, outX * 0.94],
          [rHub * 0.92, outX * 0.88],
          [rHub * 1.08, outX * 0.42],
        ];
      opaque.add(latheAlongX(hubCap, 8, rimColor));

      // Inner axle brake drum cap (tucked inside [-0.94*hw .. +0.94*hw] to preserve X symmetry at X=0)
      const inX = -sideSign * hw;
      const innerDrum: [number, number][] = sideSign > 0
        ? [[0, inX * 0.82], [rBead, inX * 0.80]]
        : [[rBead, inX * 0.80], [0, inX * 0.82]];
      opaque.add(latheAlongX(innerDrum, 8, "black"));

      // 3. 8 radial structural rim spokes (4 crossed diameter bars at 0/45/90/135 deg -> exact 90-deg symmetry!)
      if (detail !== "far") {
        const spokeSpan = rWell * 1.96;
        const spokeThick = radius * 0.085;
        const spokeDepth = width * 0.14;
        for (let s = 0; s < 4; s++) {
          const ang = (s * Math.PI) / 4;
          const spoke = vStrip([spokeDepth, spokeSpan, spokeThick], rimColor, [sideSign * hw * 0.64, 0, 0]);
          spoke.rotation.x = ang;
          opaque.add(spoke);
        }
      }

      // 4. Molded V-chevron rubber tread ribs rooted cleanly inside the tire crown (zero floating corners!)
      if (treadSteps > 0) {
        const ribH = radius * 0.058;
        const ribLen = (2 * Math.PI * rCrown) / (treadSteps * 3.1);
        const rMid = rCrown - radius * 0.003;
        if (detail === "near") {
          const halfLugW = width * 0.31;
          for (let i = 0; i < treadSteps; i++) {
            const theta = ((i + 0.5) / treadSteps) * Math.PI * 2;
            const holder = new Group();
            holder.rotation.x = -theta;
            for (const halfSign of [-1, 1] as const) {
              const lug = vTintedStrip(
                [halfLugW, ribH, ribLen],
                "darkGray",
                treadTint,
                [halfSign * width * 0.175, rMid, 0],
              );
              lug.rotation.y = halfSign * 0.26;
              holder.add(lug);
            }
            opaque.add(holder);
          }
        } else {
          for (let i = 0; i < treadSteps; i++) {
            const theta = ((i + 0.5) / treadSteps) * Math.PI * 2;
            const lug = vTintedStrip(
              [width * 0.72, ribH, ribLen],
              "darkGray",
              treadTint,
              [0, Math.cos(theta) * rMid, Math.sin(theta) * rMid],
            );
            lug.rotation.x = -theta;
            opaque.add(lug);
          }
        }
      }

      // 5. Thin recessed telemetry/accent ring nestled around planetary hub
      const ringTarget = accentColor === "cyan" || accentColor === "warning" ? emissive : opaque;
      const rRingOuter = rHub * 1.24;
      const rRingInner = rHub * 1.02;
      const ringX1 = sideSign * hw * 0.66;
      const ringX2 = sideSign * hw * 0.80;
      const ringProfile: [number, number][] = sideSign > 0
        ? [[rRingOuter, ringX1], [rRingOuter, ringX2], [rRingInner, ringX2]]
        : [[rRingInner, ringX2], [rRingOuter, ringX2], [rRingOuter, ringX1]];
      ringTarget.add(latheAlongX(ringProfile, 8, accentColor));

      const bodyGeo = mergePaletteGroup(opaque);
      if (emissive.children.length === 0) return bodyGeo;
      const emGeo = mergePaletteGroup(emissive);
      const both = mergeGeometries([bodyGeo, emGeo], false)!;
      bodyGeo.dispose();
      emGeo.dispose();
      const welded = mergeVertices(both, 1e-6);
      both.dispose();
      const norm = welded.getAttribute("normal");
      const v = new Vector3();
      for (let i = 0; i < norm.count; i++) {
        v.fromBufferAttribute(norm, i).normalize();
        norm.setXYZ(i, v.x, v.y, v.z);
      }
      return welded;
    },
  );

  const root = new Group();
  root.name = `wheel_axle_${wheelId}`;
  root.userData = { wheel: true, wheelId, axis: [1, 0, 0] };
  const mesh = new Mesh(geo, materials.M_palette);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return root;
}

/** Recessed louver grille assembly facing +Z (or rotated by caller). */
export function addRecessedLouvers(
  target: Group,
  width: number,
  height: number,
  slats: number,
  pos: Point3,
  rotY = 0,
): void {
  const g = new Group();
  g.add(vColorBox([width, height, 0.048], "darkGray", [0, 0, 0], 0.01, ["back"]));
  g.add(vStrip([width - 0.07, height - 0.07, 0.032], "black", [0, 0, 0.012]));
  const innerH = height - 0.11;
  for (let i = 0; i < slats; i++) {
    const sy = -innerH / 2 + ((i + 0.5) / slats) * innerH;
    const blade = vStrip(
      [width - 0.11, Math.min(0.038, innerH / (slats * 1.85)), 0.034],
      "hull",
      [0, sy, 0.024],
    );
    blade.rotation.x = 0.24;
    g.add(blade);
  }
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  target.add(g);
}

interface RoverTruckParams {
  detail: VehicleDetail;
}

function parseRoverTruck(input: unknown): RoverTruckParams {
  const rec = parseRecord(input, ["detail"]);
  return { detail: parseChoice(rec.detail, vehicleDetailLevels, "near") };
}

function buildRoverTruck(detail: VehicleDetail): Group {
  const root = new Group();
  root.name = `MV-01_${detail}`;

  const wheelRadius = 0.56;
  const wheelWidth = 0.46;
  const trackX = 1.18;
  // Front cab axle + rear close-coupled tandem bogie matching v3-t079.90 6x6 truck stance
  const axleZ = [1.94, -0.58, -1.98] as const;
  const wheelIds = [
    ["fl", -1, axleZ[0]],
    ["fr", 1, axleZ[0]],
    ["ml", -1, axleZ[1]],
    ["mr", 1, axleZ[1]],
    ["rl", -1, axleZ[2]],
    ["rr", 1, axleZ[2]],
  ] as const;

  const bodyGeo = cachedGeometry(["mv01BodyGeoV4", detail], () => {
    const opaque = new Group();
    const emissive = new Group();
    const wheelProxies = new Group();

  // 1. Heavy central chassis spine, skid plates & rocker-bogie suspension arms
  opaque.add(vColorBox([1.36, 0.34, 5.76], "darkGray", [0, 0.72, 0.04], 0.05));
  opaque.add(vColorBox([1.12, 0.18, 5.42], "black", [0, 0.52, 0.04], 0.03));

  for (const side of [-1, 1] as const) {
    // Front swing-arm & coil-over shock strut
    opaque.add(vStrut([side * 0.66, 0.74, 1.38], [side * 0.98, wheelRadius, axleZ[0]], 0.13, "darkGray"));
    if (detail !== "far") {
      opaque.add(vStrut([side * 0.76, 1.08, 1.84], [side * 0.98, wheelRadius + 0.06, axleZ[0]], 0.075, "gray"));
    }
    // Rear tandem rocker-bogie linkage bridging middle & rear axles
    const bogieMidZ = (axleZ[1] + axleZ[2]) / 2;
    opaque.add(vColorBox([0.16, 0.22, 0.34], "hull", [side * 0.84, 0.84, bogieMidZ], 0.035));
    opaque.add(vStrut([side * 0.88, 0.84, bogieMidZ], [side * 0.98, wheelRadius, axleZ[1]], 0.12, "darkGray"));
    opaque.add(vStrut([side * 0.88, 0.84, bogieMidZ], [side * 0.98, wheelRadius, axleZ[2]], 0.12, "darkGray"));

    // Flared beveled wheel-arch fenders (front single + rear tandem arch)
    opaque.add(vColorBox([0.62, 0.14, 1.38], "hull", [side * 1.12, 1.24, axleZ[0]], 0.035));
    opaque.add(vWhiteBox([0.58, 0.10, 1.30], [side * 1.13, 1.33, axleZ[0]], 0.025, ["bottom"]));

    opaque.add(vColorBox([0.62, 0.14, 2.74], "hull", [side * 1.12, 1.24, bogieMidZ], 0.035));
    opaque.add(vWhiteBox([0.58, 0.10, 2.66], [side * 1.13, 1.33, bogieMidZ], 0.025, ["bottom"]));
    if (detail !== "far") {
      const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
      // Side utility battery boxes between front and tandem bogie
      opaque.add(vColorBox([0.48, 0.42, 0.86], "darkGray", [side * 0.96, 0.88, 0.68], 0.035, omitIn));
      opaque.add(vColorBox([0.08, 0.28, 0.72], "hull", [side * 1.21, 0.88, 0.68], 0.018, omitIn));
    }
  }

  // 2. Forward Faceted Pressurized Crew Cab (Z = +0.58 .. +3.24)
  // True faceted side-elevation profile (nose -> sloped hood -> recessed windshield -> brow visor -> roof)
  const cabCoreProfile: readonly [number, number][] = [
    [0.58, 0.84],
    [3.04, 0.84],
    [3.14, 1.12],
    [2.94, 1.46],
    [2.44, 1.62],
    [2.02, 2.18],
    [2.14, 2.28],
    [1.82, 2.40],
    [0.58, 2.40],
  ];
  opaque.add(extrudeSideProfileX(cabCoreProfile, 2.18, 0.055, "darkGray", 0));

  // Beveled front armored bumper, lower skid plate & chin fascia (white + hull + darkGray, zero yellow/ochre!)
  opaque.add(vColorBox([2.58, 0.38, 0.44], "hull", [0, 0.82, 3.04], 0.06));
  opaque.add(vColorBox([2.04, 0.20, 0.38], "black", [0, 0.58, 2.96], 0.035, ["top"]));
  const fasciaSlope = vWhiteBox([2.36, 0.14, 0.38], [0, 1.28, 3.04], 0.03, ["bottom"]);
  fasciaSlope.rotation.x = 0.72;
  opaque.add(fasciaSlope);

  // Twin raised beveled hood armor plates with crisp central dark seam
  for (const side of [-1, 1] as const) {
    const hoodPlate = vWhiteBox([0.98, 0.10, 0.54], [side * 0.52, 1.56, 2.70], 0.025, ["bottom"]);
    hoodPlate.rotation.x = 0.30;
    opaque.add(hoodPlate);
  }

  // Panoramic 3-pane wrap-around cockpit windshield (teal/blue visor glass recessed inside black gaskets)
  const winTilt = Math.atan2(2.44 - 2.02, 2.18 - 1.62); // ~36.9 deg back from vertical
  const centerScreen = new Group();
  centerScreen.add(vColorBox([1.54, 0.64, 0.09], "black", [0, 0, 0], 0.02, ["back"]));
  centerScreen.add(vColorBox([1.40, 0.50, 0.06], "teal", [0, 0.01, 0.026], 0.014, ["back"]));
  if (detail === "near") {
    centerScreen.add(vStrip([0.045, 0.54, 0.07], "darkGray", [0, 0, 0.025]));
  }
  centerScreen.position.set(0, 1.91, 2.25);
  centerScreen.rotation.x = -winTilt;
  opaque.add(centerScreen);

  for (const side of [-1, 1] as const) {
    const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
    // Angled wrap-around cheek windshield pane
    const cheekWin = new Group();
    cheekWin.add(vColorBox([0.48, 0.58, 0.09], "black", [0, 0, 0], 0.018, ["back"]));
    cheekWin.add(vColorBox([0.36, 0.44, 0.06], "teal", [0, 0.01, 0.025], 0.012, ["back"]));
    cheekWin.position.set(side * 0.94, 1.90, 2.13);
    cheekWin.rotation.order = "YXZ";
    cheekWin.rotation.y = side * 0.52;
    cheekWin.rotation.x = -winTilt * 0.92;
    opaque.add(cheekWin);

    // Sculpted two-tone side cheek armor & crew access door with recessed dark seams
    const cheekArmor: readonly [number, number][] = [
      [1.62, 0.96],
      [2.96, 0.96],
      [2.90, 1.44],
      [2.40, 1.60],
      [1.62, 1.60],
    ];
    opaque.add(extrudeSideProfileX(cheekArmor, 0.14, 0.028, "hull", side * 1.15));
    opaque.add(vWhiteBox([0.12, 1.24, 0.94], [side * 1.16, 1.66, 1.10], 0.028, omitIn));

    // Side cockpit window above forward cheek
    opaque.add(vColorBox([0.09, 0.44, 0.54], "black", [side * 1.13, 1.94, 1.82], 0.018, omitIn));
    opaque.add(vColorBox([0.06, 0.32, 0.42], "teal", [side * 1.16, 1.94, 1.82], 0.01, omitIn));

    if (detail !== "far") {
      const doorFrame = new Mesh(
        coloredGeometry(panelInset(0.70, 0.92, 0.035, 0.035), "hull", { weld: true }),
        materials.M_palette,
      );
      doorFrame.rotation.y = side * (Math.PI / 2);
      doorFrame.position.set(side * 1.22, 1.64, 1.10);
      opaque.add(doorFrame);
      opaque.add(vStrip([0.045, 0.42, 0.045], "gray", [side * 1.25, 1.64, 1.50]));
      opaque.add(vColorBox([0.18, 0.06, 0.38], "darkGray", [side * 1.22, 0.78, 1.10], 0.014));
    }
  }

  // Forward-jutting armored sun-visor brow + roof crown + cyan clearance lights + handrails
  const brow = vWhiteBox([2.18, 0.13, 0.46], [0, 2.31, 2.04], 0.034, ["bottom"]);
  brow.rotation.x = 0.18;
  opaque.add(brow);
  opaque.add(vWhiteBox([2.12, 0.14, 1.22], [0, 2.42, 1.24], 0.038, ["bottom"]));
  opaque.add(vColorBox([1.50, 0.10, 0.96], "hull", [0, 2.51, 1.22], 0.028, ["bottom"]));

  // Front grille, tow shackles & emissive cyan headlights + roof clearance markers
  if (detail !== "far") {
    addRecessedLouvers(opaque, 1.08, 0.22, detail === "near" ? 3 : 2, [0, 0.84, 3.25]);
    for (const side of [-1, 1] as const) {
      opaque.add(vColorBox([0.12, 0.14, 0.18], "darkGray", [side * 0.78, 0.64, 3.24], 0.025, ["back"]));
    }
  }
  for (const side of [-1, 1] as const) {
    opaque.add(vColorBox([0.48, 0.20, 0.10], "black", [side * 0.90, 0.86, 3.23], 0.02, ["back"]));
    emissive.add(vStrip([0.38, 0.10, 0.05], "cyan", [side * 0.90, 0.86, 3.27]));
  }
  for (const mx of [-0.60, 0, 0.60]) {
    opaque.add(vStrip([0.18, 0.075, 0.11], "darkGray", [mx, 2.38, 2.22]));
    emissive.add(vStrip([0.13, 0.045, 0.05], "cyan", [mx, 2.39, 2.27]));
  }
  if (detail === "near") {
    // Twin cab roof handrails + GPS dome + whip antenna
    for (const side of [-1, 1] as const) {
      opaque.add(vStrip([0.045, 0.045, 1.04], "gray", [side * 0.90, 2.55, 1.22]));
      for (const rz of [0.74, 1.70]) {
        opaque.add(vStrip([0.055, 0.12, 0.055], "darkGray", [side * 0.90, 2.48, rz]));
      }
    }
    opaque.add(vColorBox([0.32, 0.10, 0.32], "offWhite", [-0.42, 2.58, 1.44], 0.03, ["bottom"]));
    opaque.add(vStrip([0.065, 0.56, 0.065], "darkGray", [0.54, 2.82, 0.92]));
    emissive.add(vStrip([0.07, 0.07, 0.07], "cyan", [0.54, 3.12, 0.92]));
  }

  // 3. Articulated Life-Support Saddle Behind Cab (Z = -0.34 .. +0.58)
  opaque.add(vColorBox([1.84, 1.06, 0.74], "black", [0, 1.48, 0.16], 0.045, ["bottom"]));
  if (detail !== "far") {
    const tankSegs = detail === "near" ? 8 : 6;
    for (const tx of [-0.68, -0.24, 0.24, 0.68]) {
      const bottle = latheAlongX(
        [[0, -0.52], [0.16, -0.44], [0.18, -0.32], [0.18, 0.32], [0.16, 0.44], [0, 0.52]],
        tankSegs,
        "offWhite",
      );
      bottle.rotation.z = Math.PI / 2;
      bottle.position.set(tx, 1.72, 0.16);
      opaque.add(bottle);
      opaque.add(vStrip([0.40, 0.07, 0.40], "darkGray", [tx, 1.72, 0.16]));
    }
  }

  // 4. Rear Pressurized Cargo & Power Module (Z = -3.14 .. -0.24)
  // Dark structural core so raised beveled white/hull panels show crisp recessed seams
  opaque.add(vColorBox([2.44, 1.38, 2.78], "darkGray", [0, 1.68, -1.66], 0.08, ["bottom"]));

  // Segmented raised beveled side & roof armor plates (two-tone white + hull, zero ochre!)
  const baySegments: readonly [number, number, "white" | "hull"][] = [
    [-0.74, 0.84, "white"],
    [-1.66, 0.88, "hull"],
    [-2.58, 0.84, "white"],
  ];
  for (const [zCenter, zLen, tone] of baySegments) {
    // Roof armor slab
    opaque.add(
      tone === "white"
        ? vWhiteBox([2.24, 0.12, zLen], [0, 2.39, zCenter], 0.032, ["bottom"])
        : vColorBox([2.24, 0.12, zLen], "hull", [0, 2.39, zCenter], 0.032, ["bottom"]),
    );
    // Left & right upper/lower flank armor plates with horizontal joint channel
    for (const side of [-1, 1] as const) {
      const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
      opaque.add(
        tone === "white"
          ? vWhiteBox([0.10, 0.68, zLen], [side * 1.24, 1.94, zCenter], 0.028, omitIn)
          : vColorBox([0.10, 0.68, zLen], "hull", [side * 1.24, 1.94, zCenter], 0.028, omitIn),
      );
      opaque.add(vColorBox([0.10, 0.44, zLen], "hull", [side * 1.24, 1.30, zCenter], 0.024, omitIn));
    }
  }

  // Side recessed radiator grilles + cargo tie-down roof rails
  if (detail !== "far") {
    for (const side of [-1, 1] as const) {
      addRecessedLouvers(
        opaque,
        0.66,
        0.34,
        detail === "near" ? 3 : 2,
        [side * 1.29, 1.94, -1.66],
        side * (Math.PI / 2),
      );
      // Upper roof cargo guardrails
      opaque.add(vStrip([0.065, 0.08, 2.56], "gray", [side * 1.06, 2.52, -1.66]));
      for (const rz of [-0.52, -1.66, -2.80]) {
        opaque.add(vStrip([0.085, 0.14, 0.085], "darkGray", [side * 1.06, 2.44, rz]));
      }
    }
  }

  // Rear cargo bay twin doors, latch bar, bumper, cyan work bar & red tail lights
  for (const side of [-1, 1] as const) {
    opaque.add(vWhiteBox([0.98, 1.08, 0.10], [side * 0.54, 1.72, -3.06], 0.028, ["front"]));
    if (detail === "near") {
      opaque.add(vStrip([0.065, 0.88, 0.07], "gray", [side * 0.14, 1.72, -3.12]));
    }
  }
  opaque.add(vColorBox([2.52, 0.34, 0.34], "hull", [0, 0.84, -3.06], 0.055, ["front"]));
  emissive.add(vStrip([0.96, 0.06, 0.05], "cyan", [0, 2.34, -3.10]));
  for (const side of [-1, 1] as const) {
    opaque.add(vColorBox([0.38, 0.16, 0.09], "black", [side * 0.92, 0.86, -3.22], 0.018, ["front"]));
    emissive.add(vStrip([0.28, 0.08, 0.045], "doorClosed", [side * 0.92, 0.86, -3.25]));
  }

  // Proxy wheel cylinders for realistic wheel-well & rocker-arm AO baking
  if (detail === "near") {
    for (const [, sideSign, wz] of wheelIds) {
      wheelProxies.add(
        latheAlongX(
          [[0, -wheelWidth / 2], [wheelRadius, -wheelWidth / 2], [wheelRadius, wheelWidth / 2], [0, wheelWidth / 2]],
          8,
          "black",
          [sideSign * trackX, wheelRadius, wz],
        ),
      );
    }
  }

    return fuseVehicleBody("mv01-chassis-body", opaque, emissive, wheelProxies, detail === "near", 0.95).geometry;
  });

  const bodyMesh = new Mesh(bodyGeo, materials.M_palette);
  bodyMesh.name = "mv01-chassis-body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Attach 6 independent articulated wheel children centered on their local X axles
  for (const [wid, sideSign, wz] of wheelIds) {
    const wheel = buildArticulatedWheel({
      cacheKey: "mv01",
      wheelId: wid,
      radius: wheelRadius,
      width: wheelWidth,
      sideSign,
      detail,
      rimColor: "hull",
      accentColor: "cyan",
    });
    wheel.position.set(sideSign * trackX, wheelRadius, wz);
    root.add(wheel);
  }

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function buildVehicleLOD(
  registry: PieceRegistry,
  id: string,
  baseParams: Record<string, unknown> = {},
  distances: readonly [number, number, number] = [0, 26, 62],
): LOD {
  const lod = new LOD();
  lod.name = `${id}_LOD`;
  vehicleDetailLevels.forEach((detail, idx) => {
    const levelObj = registry.build(id, { ...baseParams, detail });
    if (idx > 0) levelObj.visible = false;
    lod.addLevel(levelObj, distances[idx], 0.05);
  });
  return lod;
}

export function registerMarsRoverTruck(registry: PieceRegistry): void {
  registry.register<RoverTruckParams>("MV-01", {
    parse: parseRoverTruck,
    variants: {
      near: { detail: "near" },
    },
    metadata: { category: "vehicle", pivot: "base-center" },
    build: ({ detail }) => buildRoverTruck(detail),
  });
}
