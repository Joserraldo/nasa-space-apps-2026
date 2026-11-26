import {
  BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3,
} from "three";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import { pipeRun, polygonRing, polygonShape, truncatedIcosa } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boostVertexLuminance, boxAt, boxCenter, extrudedMesh,
  parseChoice, parseRecord, weldedColoredGeometry, type PaletteKey,
} from "../station/helpers";
import {
  cyanEquipPod, exteriorWhiteGeometry, stickerPlacard, twinPostRedValve,
  ventGrilleGroup, whiteBoxAt, whiteExtruded,
} from "./mars-helpers";

interface PolyFace { normal: Vector3; center: Vector3; ring: Vector3[] }

function extractTruncatedIcosaFaces(radius: number): PolyFace[] {
  const base = truncatedIcosa(radius);
  const pos = base.getAttribute("position");
  const idx = base.index!;
  const groups = new Map<string, { normal: Vector3; verts: Map<string, Vector3> }>();
  const a = new Vector3(), b = new Vector3(), c = new Vector3();

  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i));
    b.fromBufferAttribute(pos, idx.getX(i + 1));
    c.fromBufferAttribute(pos, idx.getX(i + 2));
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    const key = n.toArray().map(v => Math.round(v * 200) / 200).join(",");
    let entry = groups.get(key);
    if (!entry) {
      entry = { normal: n.clone(), verts: new Map() };
      groups.set(key, entry);
    }
    for (const v of [a, b, c]) {
      entry.verts.set(v.toArray().map(n0 => n0.toFixed(4)).join(","), v.clone());
    }
  }

  const faces: PolyFace[] = [];
  for (const { normal, verts } of groups.values()) {
    const pts = [...verts.values()];
    if (pts.length < 5) continue;
    const center = pts.reduce((acc, p) => acc.add(p), new Vector3()).multiplyScalar(1 / pts.length);
    const ref = Math.abs(normal.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    const u = ref.clone().cross(normal).normalize();
    const w = normal.clone().cross(u).normalize();
    pts.sort((p1, p2) => {
      const d1 = p1.clone().sub(center);
      const d2 = p2.clone().sub(center);
      return Math.atan2(d1.dot(w), d1.dot(u)) - Math.atan2(d2.dot(w), d2.dot(u));
    });
    faces.push({ normal, center, ring: pts });
  }
  return faces;
}

function pushQuad(positions: number[], normals: number[], p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3): void {
  for (const [va, vb, vc] of [[p0, p1, p2], [p0, p2, p3]] as const) {
    const n = vb.clone().sub(va).cross(vc.clone().sub(va)).normalize();
    if (n.lengthSq() < 0.5) continue;
    for (const v of [va, vb, vc]) {
      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
    }
  }
}

function buildCapsuleGlassShell(radius: number): Mesh[] {
  const frameGeom = cachedGeometry(["mb01GlassFrame", radius], () => {
    const faces = extractTruncatedIcosaFaces(radius);
    const pos: number[] = [];
    const norm: number[] = [];
    for (const face of faces) {
      if (face.center.y < -radius * 0.36) continue;
      const { ring, center, normal } = face;
      const k = ring.length;
      const r1 = ring.map(p => p.clone().lerp(center, 0.14).addScaledVector(normal, 0.036));
      const r2 = ring.map(p => p.clone().lerp(center, 0.22).addScaledVector(normal, -0.018));
      for (let i = 0; i < k; i++) {
        const next = (i + 1) % k;
        pushQuad(pos, norm, ring[i], ring[next], r1[next], r1[i]);
        pushQuad(pos, norm, r1[i], r1[next], r2[next], r2[i]);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(norm, 3));
    return exteriorWhiteGeometry(finishGeometry(g), true);
  });

  const glassGeom = cachedGeometry(["mb01GlassPanes", radius], () => {
    const faces = extractTruncatedIcosaFaces(radius);
    const pos: number[] = [];
    const norm: number[] = [];
    for (const face of faces) {
      if (face.center.y < -radius * 0.36) continue;
      const { ring, center, normal } = face;
      const k = ring.length;
      const rPane = ring.map(p => p.clone().lerp(center, 0.20).addScaledVector(normal, -0.008));
      for (let i = 1; i < k - 1; i++) {
        for (const v of [rPane[0], rPane[i], rPane[i + 1]]) {
          pos.push(v.x, v.y, v.z);
          norm.push(normal.x, normal.y, normal.z);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(norm, 3));
    return finishGeometry(g);
  });

  return [
    new Mesh(frameGeom, materials.M_palette),
    new Mesh(glassGeom, materials.M_glass),
  ];
}

const podModes = ["standard", "warm"] as const;
const podUnits = ["01", "02", "03", "04"] as const;
interface CapsuleParams { mode: typeof podModes[number]; unit: typeof podUnits[number] }
function parseCapsule(input: unknown): CapsuleParams {
  const rec = parseRecord(input, ["mode", "unit"]);
  const mode = parseChoice(rec.mode, podModes, "standard");
  const unit = parseChoice(rec.unit, podUnits, mode === "standard" ? "01" : "02");
  return { mode, unit };
}

const hubVariants = ["colony", "industrial"] as const;
interface HubParams { style: typeof hubVariants[number] }
function parseHub(input: unknown): HubParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, hubVariants, "colony") };
}

const tunnelVariants = ["standard", "lit"] as const;
interface TunnelParams { style: typeof tunnelVariants[number] }
function parseTunnel(input: unknown): TunnelParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, tunnelVariants, "standard") };
}

export function registerMarsHabitats(registry: PieceRegistry): void {
  registry.register<CapsuleParams>("MB-01", {
    parse: parseCapsule,
    variants: {
      standard: { mode: "standard", unit: "01" },
      warm: { mode: "warm", unit: "02" },
    },
    metadata: { category: "capsule", pivot: "base-center" },
    build: ({ mode, unit }) => {
      const group = new Group();
      const base = extrudedMesh(polygonShape(2.48, 8), 0.36, 0.035, "darkGray", [0, 0.18, 0]);
      base.rotation.x = -Math.PI / 2;
      const collar = whiteExtruded(polygonRing(2.58, 2.04, 8), 0.26, 0.025, [0, 0.44, 0]);
      collar.rotation.x = -Math.PI / 2;
      const lowerSkirt = extrudedMesh(polygonRing(2.12, 1.78, 10), 0.78, 0.03, "darkGray", [0, 0.78, 0]);
      lowerSkirt.rotation.x = -Math.PI / 2;
      // Interior white/blue deck visible through the M_glass hexagonal dome panes
      const innerDeck = whiteExtruded(polygonShape(1.92, 10), 0.16, 0.02, [0, 1.08, 0]);
      innerDeck.rotation.x = -Math.PI / 2;
      const innerWell = extrudedMesh(
        polygonRing(1.36, 0.72, 8), 0.24, 0.02, mode === "standard" ? "blue" : "teal", [0, 1.24, 0],
      );
      innerWell.rotation.x = -Math.PI / 2;
      const innerCore = whiteExtruded(polygonShape(0.58, 8), 0.72, 0.025, [0, 1.52, 0]);
      innerCore.rotation.x = -Math.PI / 2;
      group.add(base, collar, lowerSkirt, innerDeck, innerWell, innerCore);

      const shellGroup = new Group();
      for (const part of buildCapsuleGlassShell(2.65)) shellGroup.add(part);
      shellGroup.position.y = 1.78;
      group.add(shellGroup);

      // Rear docking collar (-Z) + crisp aerospace unit placard
      group.add(whiteBoxAt([1.74, 1.68, 0.56], [0, 0.32, -2.35], 0.04, ["bottom"]));
      group.add(boxAt([1.48, 1.46, 0.24], "darkGray", [0, 0.42, -2.62], 0.03));

      const decal = stickerPlacard(0.72, 0.43, `hab-${unit}`, "black");
      decal.position.set(0.86, 0.72, 1.98);
      decal.rotation.y = 0.42;
      group.add(decal);
      return alignBaseCenter(group);
    },
  });

  registry.register<HubParams>("MB-02", {
    parse: parseHub,
    variants: {
      colony: { style: "colony" },
      industrial: { style: "industrial" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const accent: PaletteKey = "cyan";
      const plinth = extrudedMesh(polygonShape(3.78, 8), 0.38, 0.035, "black", [0, 0.19, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const bodyLow = whiteExtruded(polygonShape(3.52, 8), 1.68, 0.05, [0, 1.20, 0]);
      bodyLow.rotation.x = -Math.PI / 2;
      const bodyHigh = whiteExtruded(polygonShape(3.18, 8), 0.94, 0.05, [0, 2.40, 0]);
      bodyHigh.rotation.x = -Math.PI / 2;
      const roofRim = extrudedMesh(polygonRing(3.08, 2.44, 8), 0.28, 0.03, "gray", [0, 2.94, 0]);
      roofRim.rotation.x = -Math.PI / 2;
      const roofCap = extrudedMesh(polygonShape(2.48, 8), 0.22, 0.025, "darkGray", [0, 2.96, 0]);
      roofCap.rotation.x = -Math.PI / 2;
      group.add(plinth, bodyLow, bodyHigh, roofRim, roofCap);

      for (let side = 0; side < 8; side++) {
        const angle = (side / 8) * Math.PI * 2;
        const spoke = new Group();
        spoke.add(whiteBoxAt([1.86, 1.94, 0.42], [0, 0.22, 3.24], 0.035, ["bottom"]));
        spoke.add(boxAt([1.48, 1.56, 0.28], "darkGray", [0, 0.34, 3.42], 0.025));
        spoke.add(boxAt([0.92, 0.055, 0.055], accent, [0, 2.02, 3.38], 0.01));

        // Recessed intake grille + 4 curved upper manifold pipes matching v3-t054.60
        spoke.add(boxCenter([1.14, 0.32, 0.12], "black", [0, 2.18, 3.12], 0.015));
        for (const rx of [-0.42, -0.14, 0.14, 0.42]) {
          const rib = new Mesh(
            weldedColoredGeometry(
              pipeRun([[rx, 2.14, 3.18], [rx, 2.54, 3.05], [rx, 2.74, 2.72]], 0.044, 6),
              "gray",
            ),
            materials.M_palette,
          );
          spoke.add(rib);
        }

        if (side % 2 === 0) {
          const grille = ventGrilleGroup(0.72, 0.38, 3);
          grille.position.set(1.22, 1.42, 3.04);
          grille.rotation.y = 0.39;
          spoke.add(grille);
        } else {
          const pod = cyanEquipPod(0.54, 0.42, 0.22);
          pod.position.set(-1.18, 1.24, 3.06);
          pod.rotation.y = -0.39;
          spoke.add(pod);
        }

        if (side === 7 || side === 3 || (style === "industrial" && side === 0)) {
          const valve = twinPostRedValve();
          valve.position.set(1.42, 0, 3.56);
          valve.rotation.y = 0.39;
          spoke.add(valve);
        }

        if (side === 0 || side === 4) {
          const crest = stickerPlacard(0.74, 0.44, side === 0 ? "hub-crest" : "hazard-airlock", "black");
          crest.position.set(0, 1.38, 3.57);
          spoke.add(crest);
        }
        spoke.rotation.y = angle;
        group.add(spoke);
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<TunnelParams>("MB-03", {
    parse: parseTunnel,
    variants: {
      standard: { style: "standard" },
      lit: { style: "lit" },
    },
    metadata: { category: "capsule", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      // Crisp white armored connector tunnel + gray roof conduit + darkGray collar rings (v3-t054.60).
      group.add(whiteBoxAt([1.92, 1.72, 4.2], [0, 0.36, 0], 0.08));
      group.add(boxAt([1.42, 0.20, 4.12], "gray", [0, 2.04, 0], 0.03));
      for (const z of [-1.46, 0, 1.46]) {
        group.add(boxAt([2.18, 1.98, 0.42], "gray", [0, 0.24, z], 0.055));
        group.add(boxAt([2.24, 0.32, 0.36], "darkGray", [0, 0, z], 0.04, ["bottom"]));
        for (const x of [-0.90, 0.90]) {
          group.add(boxAt([0.24, 0.38, 0.32], "black", [x, 0, z], 0.03, ["bottom"]));
        }
      }

      // Continuous cyan window strips along both sides of connector tunnels + equipment pods & decals
      for (const sideSign of [-1, 1] as const) {
        const x = sideSign * 0.98;
        for (const z of [-0.75, 0.75]) {
          group.add(boxAt([0.08, 0.68, 0.96], "darkGray", [x, 0.88, z], 0.015));
          if (style === "lit") {
            for (const y of [0.96, 1.38]) {
              for (const sz of [-0.22, 0.22]) {
                group.add(boxAt([0.075, 0.14, 0.38], "cyan", [x * 1.03, y, z + sz], 0.008));
              }
            }
          } else {
            // Radial tunnels also carry a crisp horizontal cyan window strip along their flanks
            group.add(boxAt([0.075, 0.16, 0.84], "cyan", [x * 1.03, 1.24, z], 0.01));
            group.add(boxAt([0.065, 0.14, 0.80], "black", [x * 1.02, 0.98, z], 0.008));
          }
        }

        const equip = cyanEquipPod(0.42, 0.46, 0.18);
        equip.position.set(sideSign * 1.14, 1.18, 0);
        equip.rotation.y = sideSign * (Math.PI / 2);
        group.add(equip);

        const grille = ventGrilleGroup(0.46, 0.28, 2);
        grille.position.set(sideSign * 1.10, 0.58, 0);
        grille.rotation.y = sideSign * (Math.PI / 2);
        group.add(grille);

        const sticker = stickerPlacard(0.38, 0.23, style === "lit" ? "hazard-airlock" : "bay-utility", "black");
        sticker.position.set(sideSign * 1.11, 1.66, 0);
        sticker.rotation.y = sideSign * (Math.PI / 2);
        group.add(sticker);
      }

      // Rooftop vertical telemetry / vent mast (visible on rear tunnels in v3-t054.60)
      if (style === "lit") {
        const mastBase = boxAt([0.34, 0.22, 0.34], "darkGray", [0.46, 2.22, -0.45], 0.02);
        const mastPole = extrudedMesh(polygonShape(0.06, 6), 1.15, 0.01, "gray", [0.46, 2.98, -0.45]);
        mastPole.rotation.x = -Math.PI / 2;
        const mastTip = boxAt([0.12, 0.10, 0.12], "cyan", [0.46, 3.55, -0.45], 0.015);
        group.add(mastBase, mastPole, mastTip);
      }
      return alignBaseCenter(group);
    },
  });
}
