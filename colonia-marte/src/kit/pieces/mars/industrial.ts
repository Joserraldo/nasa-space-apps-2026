import { Group } from "three";
import { polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord,
} from "../station/helpers";
import {
  cyanEquipPod, stickerPlacard, valveRedBoxCenter, ventGrilleGroup, whiteBoxAt,
} from "./mars-helpers";
import { registerFuelTank } from "./fuel-tank";

const bayStyles = ["utility", "hangar"] as const;
interface UtilityBayParams { style: typeof bayStyles[number] }
function parseUtilityBay(input: unknown): UtilityBayParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, bayStyles, "utility") };
}

const cargoStyles = ["standard", "hazard"] as const;
interface CargoParams { style: typeof cargoStyles[number] }
function parseCargo(input: unknown): CargoParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, cargoStyles, "standard") };
}

const cubeStates = ["alert", "standby"] as const;
interface SupplyCubeParams { state: typeof cubeStates[number] }
function parseSupplyCube(input: unknown): SupplyCubeParams {
  const rec = parseRecord(input, ["state"]);
  return { state: parseChoice(rec.state, cubeStates, "alert") };
}

function circularRoofHatch(x: number, y: number, z: number): Group {
  const hatch = new Group();
  const bezel = extrudedMesh(polygonRing(0.66, 0.48, 16), 0.12, 0.018, "gray", [0, 0.06, 0]);
  bezel.rotation.x = -Math.PI / 2;
  const seal = extrudedMesh(polygonShape(0.49, 16), 0.14, 0.022, "black", [0, 0.08, 0]);
  seal.rotation.x = -Math.PI / 2;
  const domeLow = extrudedMesh(polygonShape(0.44, 16), 0.14, 0.032, "darkGray", [0, 0.16, 0]);
  domeLow.rotation.x = -Math.PI / 2;
  const domeTop = extrudedMesh(polygonShape(0.30, 16), 0.10, 0.028, "gray", [0, 0.23, 0]);
  domeTop.rotation.x = -Math.PI / 2;
  hatch.add(bezel, seal, domeLow, domeTop);
  hatch.position.set(x, y, z);
  return hatch;
}

export function registerMarsIndustrial(registry: PieceRegistry): void {
  registerFuelTank(registry);
  registry.register<UtilityBayParams>("MB-10", {
    parse: parseUtilityBay,
    variants: {
      utility: { style: "utility" },
      hangar: { style: "hangar" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      // Rectangular industrial bay module with 3x3 circular roof hatches matching v3-t054.60.
      const w = 7.2, h = 2.28, d = 5.4;
      group.add(boxAt([w + 0.24, 0.30, d + 0.24], "black", [0, 0, 0], 0.04, ["bottom"]));
      group.add(whiteBoxAt([w, h, d], [0, 0.26, 0], 0.14, ["bottom"]));
      group.add(boxAt([w - 0.56, 0.12, d - 0.56], "gray", [0, 2.50, 0], 0.03));

      // Heavy dark-gray corner & end structural straps with circular boss rivets
      for (const endSign of [-1, 1] as const) {
        const ex = endSign * (w / 2 - 0.42);
        group.add(boxAt([0.52, h + 0.08, d + 0.12], "darkGray", [ex, 0.24, 0], 0.05, ["bottom"]));
        for (const bz of [-1.8, 0, 1.8]) {
          const boss = extrudedMesh(polygonShape(0.18, 10), 0.08, 0.015, "gray", [endSign * (w / 2 + 0.03), 2.15, bz]);
          boss.rotation.y = Math.PI / 2;
          group.add(boss);
        }
      }

      // 3x3 array of dark circular domed roof hatches / fan housings (v3-t054.60 signature silhouette)
      for (const hx of [-2.05, 0, 2.05]) {
        for (const hz of [-1.52, 0, 1.52]) {
          group.add(circularRoofHatch(hx, 2.56, hz));
        }
      }

      // Outer end armored utility gate (-X) and inner tunnel docking collar (+X)
      group.add(boxAt([0.28, 1.78, 2.68], "darkGray", [-w / 2 - 0.08, 0.28, 0], 0.04, ["bottom"]));
      for (let slat = 0; slat < 4; slat++) {
        group.add(boxAt([0.12, 0.32, 2.32], "gray", [-w / 2 - 0.18, 0.42 + slat * 0.38, 0], 0.015));
      }
      group.add(boxAt([0.08, 0.07, 1.8], style === "hangar" ? "warning" : "cyan", [-w / 2 - 0.23, 1.98, 0], 0.01));

      group.add(whiteBoxAt([0.48, 1.84, 1.96], [w / 2 + 0.14, 0.28, 0], 0.04, ["bottom"]));
      group.add(boxAt([0.22, 1.56, 1.54], "darkGray", [w / 2 + 0.36, 0.38, 0], 0.025));

      // Front & rear ventilation grilles, cyan equipment pods, red valve & realistic stickers
      for (const zSign of [-1, 1] as const) {
        const zFace = zSign * (d / 2 + 0.03);
        const g1 = ventGrilleGroup(0.92, 0.48, 3);
        g1.position.set(-1.35, 1.38, zFace);
        if (zSign < 0) g1.rotation.y = Math.PI;
        group.add(g1);

        const pod = cyanEquipPod(0.64, 0.48, 0.22);
        pod.position.set(1.55, 1.32, zSign * (d / 2 + 0.09));
        if (zSign < 0) pod.rotation.y = Math.PI;
        group.add(pod);

        const decal = stickerPlacard(0.84, 0.50, zSign > 0 ? "bay-utility" : "hazard-airlock", "black");
        decal.position.set(0.15, 1.44, zFace + zSign * 0.01);
        if (zSign < 0) decal.rotation.y = Math.PI;
        group.add(decal);
      }
      group.add(valveRedBoxCenter([0.46, 0.18, 0.22], [2.45, 0.78, d / 2 + 0.12], 0.025));
      return alignBaseCenter(group);
    },
  });

  registry.register<CargoParams>("MI-09", {
    parse: parseCargo,
    variants: {
      standard: { style: "standard" },
      hazard: { style: "hazard" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      group.add(boxAt([2.36, 0.16, 1.42], "black", [0, 0, 0], 0.025, ["bottom"]));
      group.add(whiteBoxAt([2.28, 1.18, 1.34], [0, 0.14, 0], 0.06, ["bottom"]));
      for (const rx of [-0.88, -0.30, 0.30, 0.88]) {
        group.add(boxAt([0.16, 1.22, 1.40], "darkGray", [rx, 0.13, 0], 0.025, ["bottom"]));
      }
      for (const sx of [-1.10, 1.10]) {
        for (const sz of [-0.64, 0.64]) {
          group.add(boxAt([0.22, 0.26, 0.22], "black", [sx, 1.12, sz], 0.025));
        }
      }
      group.add(boxCenter([1.84, 0.08, 1.38], style === "hazard" ? "warning" : "cyan", [0, 1.08, 0], 0.012));

      for (const zSign of [-1, 1] as const) {
        const decal = stickerPlacard(0.52, 0.31, style === "hazard" ? "hazard-airlock" : "bay-utility", "black");
        decal.position.set(0, 0.68, zSign * 0.70);
        if (zSign < 0) decal.rotation.y = Math.PI;
        group.add(decal);
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<SupplyCubeParams>("MI-11", {
    parse: parseSupplyCube,
    variants: {
      alert: { state: "alert" },
      standby: { state: "standby" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ state }) => {
      const group = new Group();
      // Compact armored supply cube with glowing red front bar & cyan side indicator (v3-t104.90).
      group.add(boxAt([0.92, 0.10, 0.92], "black", [0, 0, 0], 0.02, ["bottom"]));
      group.add(boxAt([0.88, 0.78, 0.88], "darkGray", [0, 0.09, 0], 0.05, ["bottom"]));
      group.add(boxAt([0.74, 0.06, 0.74], "gray", [0, 0.86, 0], 0.015));
      group.add(boxCenter([0.34, 0.055, 0.04], state === "alert" ? "doorClosed" : "warning", [0, 0.73, 0.445], 0.008));
      group.add(boxCenter([0.04, 0.28, 0.08], "cyan", [-0.445, 0.48, 0], 0.008));

      const label = stickerPlacard(0.34, 0.20, "hazard-airlock", "black");
      label.position.set(0, 0.44, 0.45);
      group.add(label);
      return alignBaseCenter(group);
    },
  });
}
