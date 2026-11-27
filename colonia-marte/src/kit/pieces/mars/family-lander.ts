import { Group, Mesh } from "three";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseChoice, parseRecord } from "../station/helpers";
import { axialProfile } from "./transit";
import { beam, blankets, fusedParts, location, pipe, repeatMesh, type TransitDetail } from "./transit-details";

const details = ["near", "middle", "far"] as const;
const resolution = { near: 32, middle: 20, far: 12 };
export const LANDER_ENGINE_Y = 0.70;
export const LANDER_ENGINES = [
  [-0.9, -0.9], [-0.9, 0.9], [0.9, -0.9], [0.9, 0.9],
] as const;

function vertical(profile: [number, number][], segments: number, color: Parameters<typeof axialProfile>[2]) {
  const mesh = axialProfile(profile, segments, color);
  // Instance transforms do not include the prototype's object rotation.
  mesh.geometry = mesh.geometry.clone().rotateZ(Math.PI / 2);
  return mesh;
}

function pressureHull(detail: TransitDetail) {
  const parts = new Group();
  const n = resolution[detail];
  parts.add(
    vertical([[0, 0.76], [0.71, 0.78], [1.94, 1.15], [2.19, 1.34],
      [2.23, 1.49], [2.11, 1.61], [1.72, 1.62]], n, "darkGray"),
    vertical([[0, 1.51], [2.10, 1.51], [2.13, 1.61], [1.69, 2.34], [1.24, 3.07],
      [1.09, 3.24], [0.91, 3.31], [0, 3.31]], n, "hull"),
    vertical([[0, 3.30], [0.67, 3.30], [0.72, 3.34], [0.72, 3.43], [0.62, 3.49],
      [0, 3.49]], n, "gray"),
    vertical([[1.92, 1.17], [2.19, 1.35], [2.23, 1.43], [2.214, 1.48]], n, "gray"),
    boxCenter([0.84, 0.90, 0.18], "darkGray", [0, 2.18, 1.78], 0.09),
    boxCenter([0.66, 0.72, 0.12], "offWhite", [0, 2.18, 1.91], 0.07),
    boxCenter([0.48, 0.16, 0.06], "blue", [0, 2.36, 1.98], 0.026),
    boxCenter([0.43, 0.034, 0.05], "cyan", [0, 2.09, 1.979], 0.012),
    boxCenter([0.17, 0.052, 0.06], "darkGray", [0, 2.02, 1.98], 0.012),
  );
  for (const x of [-0.32, 0.32]) {
    parts.add(boxCenter([0.11, 0.40, 0.09], "gray", [x, 1.55, 2.06], 0.026));
    if (detail !== "far") {
      parts.add(pipe([[x, 1.59, 2.13], [x, 1.25, 2.17], [x, 1.18, 2.10]], 0.023, 6, "hull"));
    }
  }
  const panels = new Group();
  const sectors = detail === "near" ? 12 : detail === "middle" ? 8 : 6;
  panels.add(...blankets([
    { start: 1.65, end: 2.30, radiusA: 2.104, radiusB: 1.72 },
    { start: 2.37, end: 3.03, radiusA: 1.671, radiusB: 1.26 },
  ], sectors, "offWhite", detail === "near"));
  panels.rotation.z = Math.PI / 2;

  const rcs = new Group();
  rcs.add(boxCenter([0.42, 0.23, 0.21], "gray", [0, 0, 0], 0.075));
  for (const x of [-0.115, 0.115]) rcs.add(
    boxCenter([0.104, 0.094, 0.052], "darkGray", [x, 0.0, 0.113], 0.018),
    boxCenter([0.056, 0.047, 0.022], "black", [x, 0.0, 0.147], 0.012),
  );
  const assembly = fusedParts("lander-pressure-hull", parts, detail === "near");
  const rcsMounts = Array.from({ length: 4 }, (_, i) => {
    const angle = (i + 0.5) * Math.PI / 2;
    const mount = location(Math.sin(angle) * 1.48, 2.72, Math.cos(angle) * 1.48);
    mount.rotation.y = angle;
    return mount;
  });
  assembly.add(panels, repeatMesh(fusedParts("rcs", rcs).children[0] as Mesh, "rcs-clusters", rcsMounts));
  return assembly;
}

function landingLeg(detail: TransitDetail, index: number) {
  const housing = new Group();
  housing.add(
    beam([0.04, 0.27, 0], [0.87, -1.00, 0], 0.16, "hull"),
    beam([0.00, -0.08, 0], [0.73, -0.78, 0], 0.12, "darkGray"),
    boxCenter([0.27, 0.38, 0.40], "gray", [0, 0.05, 0], 0.06),
  );
  if (detail !== "far") housing.add(
    beam([0.26, -0.45, 0.035], [0.81, -0.89, 0.035], 0.070, "gray"),
    boxCenter([0.36, 0.27, 0.15], "hull", [0.38, -0.27, 0.115], 0.035),
  );
  const foot = vertical([[0, -1.16], [0.29, -1.16], [0.34, -1.126], [0.31, -1.044],
    [0.22, -1.01], [0, -1.01]], Math.max(8, resolution[detail] / 2), "darkGray");
  foot.position.x = 0.88;
  housing.add(foot);
  const mount = new Group();
  mount.name = `landing-leg-${index + 1}`;
  mount.rotation.y = index * Math.PI / 2 + Math.PI / 4;
  mount.position.set(1.77 * Math.cos(mount.rotation.y), 1.16, -1.77 * Math.sin(mount.rotation.y));
  const hinge = fusedParts("landing-leg-hinge", housing, detail === "near");
  hinge.name = "hinge";
  mount.add(hinge);
  return mount;
}

function buildLander(detail: TransitDetail) {
  const lander = new Group();
  const nozzle = vertical([[0.13, LANDER_ENGINE_Y], [0.24, LANDER_ENGINE_Y], [0.27, 0.74],
    [0.18, 0.91], [0.15, 1.02], [0.09, 1.02], [0.11, 0.77]], Math.max(8, resolution[detail] / 2), "darkGray");
  const throat = vertical([[0, 0.791], [0.14, 0.791], [0.15, 0.813]], 8, "black");
  const engines = LANDER_ENGINES.map(([x, z]) => location(x, 0, z));
  lander.add(pressureHull(detail),
    repeatMesh(nozzle, "retrorocket-bells", engines), repeatMesh(throat, "retrorocket-throats", engines));
  for (let i = 0; i < 4; i++) lander.add(landingLeg(detail, i));
  return alignBaseCenter(lander);
}

export function registerFamilyLander(registry: PieceRegistry) {
  registry.register<{ detail: TransitDetail }>("MV-12", {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, details, "near") }),
    variants: { near: { detail: "near" } },
    metadata: { category: "vehicle", pivot: "base-center" },
    build: ({ detail }) => buildLander(detail),
  });
}
