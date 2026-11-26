import {
  BufferGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Mesh, Vector3,
} from "three";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import { polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord,
} from "../station/helpers";
import {
  cyanEquipPod, stickerPlacard, valveRedBoxCenter,
  ventGrilleGroup, whiteBoxAt, whiteBoxCenter, whiteExtruded,
} from "./mars-helpers";

const domeModes = ["standard", "colony"] as const;
interface GeodesicDomeParams { mode: typeof domeModes[number] }
function parseDome(input: unknown): GeodesicDomeParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, domeModes, "standard") };
}

const towerVariants = ["teal", "command"] as const;
interface TealTowerParams { style: typeof towerVariants[number] }
function parseTower(input: unknown): TealTowerParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, towerVariants, "teal") };
}

function cleanGeodesicDome(radius: number, detail: number): BufferGeometry {
  return cachedGeometry(["cleanGeodesicDome", radius, detail], () => {
    const ico = new IcosahedronGeometry(radius, detail);
    const pos = ico.getAttribute("position");
    const positions: number[] = [];
    const normals: number[] = [];
    const eps = 1e-4;
    for (let i = 0; i < pos.count; i += 3) {
      const tri = [0, 1, 2].map(j => new Vector3().fromBufferAttribute(pos, i + j));
      const poly: Vector3[] = [];
      for (let j = 0; j < 3; j++) {
        const a = tri[j];
        const b = tri[(j + 1) % 3];
        if (a.y >= -eps) poly.push(new Vector3(a.x, Math.max(0, a.y), a.z));
        if ((a.y < -eps && b.y > eps) || (a.y > eps && b.y < -eps)) {
          const hit = a.clone().lerp(b, -a.y / (b.y - a.y));
          hit.y = 0;
          poly.push(hit);
        }
      }
      for (let j = 1; j < poly.length - 1; j++) {
        const [va, vb, vc] = [poly[0], poly[j], poly[j + 1]];
        const cross = vb.clone().sub(va).cross(vc.clone().sub(va));
        if (cross.length() * 0.5 < 1e-3) continue;
        const n = cross.normalize();
        for (const v of [va, vb, vc]) {
          positions.push(v.x, v.y, v.z);
          normals.push(n.x, n.y, n.z);
        }
      }
    }
    ico.dispose();
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    return finishGeometry(g);
  });
}

function extractDomeEdgesAndNodes(radius: number, detail: number) {
  const geo = cleanGeodesicDome(radius, detail);
  const pos = geo.getAttribute("position");
  const idx = geo.index!;
  const edges = new Map<string, [Vector3, Vector3]>();
  const nodes = new Map<string, Vector3>();
  const v = [new Vector3(), new Vector3(), new Vector3()];

  for (let i = 0; i < idx.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      v[k].fromBufferAttribute(pos, idx.getX(i + k));
      if (v[k].y > 0.35 && v[k].y < radius * 0.92) {
        const nk = v[k].toArray().map(n => n.toFixed(3)).join(",");
        nodes.set(nk, v[k].clone());
      }
    }
    for (let k = 0; k < 3; k++) {
      const a = v[k];
      const b = v[(k + 1) % 3];
      if (a.y < 0.08 && b.y < 0.08) continue;
      const ka = a.toArray().map(n => n.toFixed(3)).join(",");
      const kb = b.toArray().map(n => n.toFixed(3)).join(",");
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      if (!edges.has(key)) edges.set(key, [a.clone(), b.clone()]);
    }
  }
  return { edges: [...edges.values()], nodes: [...nodes.values()] };
}

export function registerMarsBuildings(registry: PieceRegistry): void {
  registry.register<GeodesicDomeParams>("MB-04", {
    parse: parseDome,
    variants: {
      standard: { mode: "standard" },
      colony: { mode: "colony" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      const radius = 6.8;
      // Glazed geodesic dome (M_glass shell) + interior atrium deck & greenery ring + crisp white/dark struts
      const plinth = extrudedMesh(polygonShape(radius + 0.55, 16), 0.38, 0.04, "black", [0, 0.19, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const curb = whiteExtruded(polygonRing(radius + 0.32, radius - 0.35, 16), 0.34, 0.03, [0, 0.44, 0]);
      curb.rotation.x = -Math.PI / 2;
      const atriumFloor = whiteExtruded(polygonShape(radius - 0.38, 16), 0.18, 0.02, [0, 0.44, 0]);
      atriumFloor.rotation.x = -Math.PI / 2;
      const innerTrack = extrudedMesh(polygonRing(4.8, 3.2, 12), 0.18, 0.02, "blue", [0, 0.58, 0]);
      innerTrack.rotation.x = -Math.PI / 2;
      const bioRing = extrudedMesh(polygonRing(3.0, 1.7, 12), 0.42, 0.03, "leaf", [0, 0.72, 0]);
      bioRing.rotation.x = -Math.PI / 2;
      const centralCore = whiteExtruded(polygonShape(1.45, 10), 2.2, 0.04, [0, 1.55, 0]);
      centralCore.rotation.x = -Math.PI / 2;
      group.add(plinth, curb, atriumFloor, innerTrack, bioRing, centralCore);

      const shell = new Mesh(cleanGeodesicDome(radius, 2), materials.M_glass);
      shell.position.y = 0.36;
      group.add(shell);

      const { edges, nodes } = extractDomeEdgesAndNodes(radius + 0.03, 2);
      const up = new Vector3(0, 1, 0);
      for (const [a, b] of edges) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const len = a.distanceTo(b);
        if (len < 0.25) continue;
        const strut = whiteBoxCenter([0.075, len, 0.075], [mid.x, mid.y + 0.36, mid.z], 0.015);
        strut.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
        group.add(strut);
      }
      for (const node of nodes) {
        const normal = node.clone().normalize();
        const pip = boxCenter(
          [0.10, 0.10, 0.10],
          mode === "colony" ? "cyan" : "darkGray",
          [node.x + normal.x * 0.03, node.y + 0.36 + normal.y * 0.03, node.z + normal.z * 0.03],
          0.018,
        );
        group.add(pip);
      }

      const crownRim = extrudedMesh(polygonShape(2.18, 12), 0.26, 0.03, "gray", [0, radius + 0.26, 0]);
      crownRim.rotation.x = -Math.PI / 2;
      const crownCap = whiteExtruded(polygonShape(1.78, 12), 0.18, 0.025, [0, radius + 0.40, 0]);
      crownCap.rotation.x = -Math.PI / 2;
      group.add(crownRim, crownCap);

      // Airlock vestibule + technical decals & equipment pod
      group.add(whiteBoxAt([2.44, 2.22, 1.42], [0, 0.22, radius - 0.2], 0.05, ["bottom"]));
      group.add(boxAt([1.86, 1.82, 0.50], "darkGray", [0, 0.34, radius + 0.46], 0.035));
      group.add(boxAt([1.22, 0.07, 0.07], "cyan", [0, 2.02, radius + 0.69], 0.012));

      const decalLeft = stickerPlacard(0.62, 0.38, "hub-crest", "black");
      decalLeft.position.set(1.25, 1.38, radius + 0.16);
      decalLeft.rotation.y = Math.PI / 2;
      const decalFront = stickerPlacard(0.56, 0.34, "hazard-airlock", "black");
      decalFront.position.set(0, 1.56, radius + 0.72);
      const sideGrille = ventGrilleGroup(0.68, 0.36, 3);
      sideGrille.position.set(-1.25, 1.38, radius + 0.16);
      sideGrille.rotation.y = -Math.PI / 2;
      group.add(decalLeft, decalFront, sideGrille);
      return alignBaseCenter(group);
    },
  });

  registry.register<TealTowerParams>("MB-07", {
    parse: parseTower,
    variants: {
      teal: { style: "teal" },
      command: { style: "command" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      // Crisp white & cool-gray tower + deep dark teal/cyan striped curtain facade (v3-t104.90 / v3-t029.40).
      const subPad = extrudedMesh(polygonShape(4.4, 8), 0.46, 0.04, "black", [0, 0.23, 0]);
      subPad.rotation.x = -Math.PI / 2;
      const deck = extrudedMesh(polygonShape(4.65, 8), 0.28, 0.035, "darkGray", [0, 0.60, 0]);
      deck.rotation.x = -Math.PI / 2;
      group.add(subPad, deck);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const truss = new Group();
        truss.add(boxAt([0.28, 0.48, 0.85], "gray", [0, 0, 3.85], 0.03, ["bottom"]));
        for (const sign of [-1, 1]) {
          const diag = boxCenter([0.14, 0.68, 0.14], "darkGray", [sign * 0.55, 0.28, 4.18], 0.02);
          diag.rotation.z = sign * 0.58;
          truss.add(diag);
        }
        truss.add(boxAt([1.4, 0.12, 0.18], "gray", [0, 0.06, 4.22], 0.02));
        truss.rotation.y = angle;
        group.add(truss);
      }

      // Crisp white sculpted outer shell + gray side cheeks
      group.add(whiteBoxAt([4.48, 13.7, 3.55], [0, 0.74, -0.35], 0.18, ["bottom"]));
      for (const sideSign of [-1, 1]) {
        group.add(boxAt([0.36, 13.2, 2.85], "gray", [sideSign * 2.22, 0.88, -0.25], 0.06, ["bottom"]));
      }

      // Deep dark ocean-cyan ("blue" #094C6D + "black") curtain core behind M_glass -> dark teal/cyan, zero green!
      group.add(boxAt([3.42, 12.85, 1.32], "blue", [0, 0.90, 1.32], 0.10, ["bottom"]));
      for (const bx of [-0.95, 0, 0.95]) {
        group.add(boxAt([0.46, 12.2, 0.18], "black", [bx, 1.15, 1.94], 0.02));
      }
      group.add(
        boxCenter([3.48, 12.6, 0.14], "teal", [0, 7.25, 2.06], 0.025, [], materials.M_glass),
      );

      // Recessed lower left portal bay + angled diagonal white/cyan stripes (matching v3-t104.90 right tower)
      group.add(whiteBoxAt([1.42, 6.2, 0.42], [-0.96, 0.86, 1.96], 0.05, ["bottom"]));
      group.add(boxAt([1.06, 5.65, 0.24], "blue", [-0.96, 1.04, 2.12], 0.03, ["bottom"]));
      group.add(boxAt([0.84, 0.08, 0.08], "cyan", [-0.96, 6.45, 2.22], 0.01));

      for (let floor = 0; floor < 6; floor++) {
        const y = 2.0 + floor * 1.92;
        const stripe = whiteBoxCenter([3.36, 0.15, 0.20], [0, y, 2.08], 0.022);
        stripe.rotation.z = 0.34;
        const cyanHairline = boxCenter([3.18, 0.045, 0.22], "cyan", [0, y + 0.11, 2.09], 0.008);
        cyanHairline.rotation.z = 0.34;
        group.add(stripe, cyanHairline);

        for (const sideSign of [-1, 1]) {
          group.add(whiteBoxAt([0.48, 1.16, 1.78], [sideSign * 2.34, y - 0.45, -0.22], 0.04));
          group.add(boxAt([0.22, 0.72, 0.68], "blue", [sideSign * 2.54, y - 0.23, 0.18], 0.025));
          if (style === "command" || floor % 2 === 0) {
            group.add(boxAt([0.08, 0.06, 0.52], "cyan", [sideSign * 2.64, y + 0.36, 0.18], 0.008));
          }
        }
      }

      // Sculpted white/gray crown hood + twin comms spires with small red/cyan tips (v3-t104.90)
      group.add(whiteBoxAt([4.62, 1.38, 4.05], [0, 14.12, -0.10], 0.18));
      group.add(boxAt([3.32, 0.58, 2.85], "gray", [0, 15.38, -0.18], 0.10));
      group.add(boxAt([2.25, 0.26, 1.45], "blue", [0, 14.65, 1.52], 0.04));
      for (const sx of [-1.45, 1.45]) {
        const spire = extrudedMesh(polygonShape(0.075, 6), 2.55, 0.012, "gray", [sx, 17.0, -0.18]);
        spire.rotation.x = -Math.PI / 2;
        group.add(spire);
        group.add(valveRedBoxCenter([0.15, 0.18, 0.15], [sx, 18.28, -0.18], 0.02));
      }

      const towerDecal = stickerPlacard(1.04, 0.62, "tower-comm", "black");
      towerDecal.position.set(1.02, 1.62, 2.15);
      const basePod = cyanEquipPod(0.62, 0.48, 0.24);
      basePod.position.set(1.02, 0.96, 2.14);
      group.add(towerDecal, basePod);
      return alignBaseCenter(group);
    },
  });
}
