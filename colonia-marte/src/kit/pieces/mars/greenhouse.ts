import { BufferGeometry, Float32BufferAttribute, Group, Mesh, PlaneGeometry, Shape, ShapeGeometry } from "three";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseChoice, parseRecord } from "../station/helpers";
import { beam, fusedParts, location, pipe, repeatMesh } from "./transit-details";

export const GREENHOUSE_LODS = ["near", "middle", "far"] as const;
type Detail = typeof GREENHOUSE_LODS[number];

const halfLength = 4.85;
const halfWidth = 2.24;
const eave = 2.57;
const ridge = 3.54;
const roofRise = ridge - eave;
const slope = Math.hypot(halfWidth, roofRise);

function glazing(width: number, height: number, x: number, y: number, z: number, roll = 0) {
  const pane = new Mesh(new PlaneGeometry(width, height), materials.M_glass);
  pane.position.set(x, y, z);
  pane.rotation.x = roll;
  return pane;
}

function buildPlinth(shell: Group, bays: number) {
  const length = 9.70, pitch = length / bays;
  for (const side of [-1, 1]) {
    shell.add(
      boxCenter([9.84, 0.096, 0.105], "darkGray", [0, 0.57, side * 2.31], 0.021),
      boxCenter([9.66, 0.024, 0.022], "cyan", [0, 0.572, side * 2.36], 0.005),
    );
    for (let i = 0; i < bays; i++) {
      const x = -length / 2 + (i + 0.5) * pitch;
      shell.add(boxCenter([pitch - 0.07, 0.35, 0.22], "hull", [x, 0.317, side * 2.25], 0.048));
    }
    for (const z of [-1.5, 1.5]) {
      shell.add(boxCenter([0.19, 0.35, 1.51], "hull", [side * 4.88, 0.317, z], 0.048));
    }
  }
}

function buildEnvelope(shell: Group, detail: Detail) {
  const bays = detail === "far" ? 3 : 5;
  const pitch = 2 * halfLength / bays;
  shell.add(
    boxCenter([9.90, 0.66, 4.58], "darkGray", [0, 0.33, 0], 0.095),
    boxCenter([9.82, 0.10, 4.57], "gray", [0, 0.65, 0], 0.03),
    boxCenter([9.94, 0.118, 0.15], "offWhite", [0, ridge, 0], 0.04),
  );
  buildPlinth(shell, bays);
  for (const side of [-1, 1]) {
    const z = side * halfWidth;
    shell.add(
      boxCenter([9.84, 0.16, 0.18], "hull", [0, eave, z], 0.046),
      boxCenter([9.84, 0.13, 0.16], "darkGray", [0, 1.15, z], 0.027),
    );
    for (let i = 0; i <= bays; i++) {
      const x = -halfLength + i * pitch;
      shell.add(
        beam([x, 0.58, z], [x, eave, z], 0.125, "offWhite"),
        beam([x, eave, z], [x, ridge, 0], 0.124, "offWhite"),
      );
      if (i === bays) continue;
      const center = x + pitch / 2;
      shell.add(
        boxCenter([pitch - 0.045, 0.48, 0.135], "offWhite", [center, 0.88, z], 0.036),
        glazing(pitch - 0.084, eave - 1.14, center, (eave + 1.14) / 2, z - side * 0.045),
        glazing(pitch - 0.084, slope - 0.055, center, (eave + ridge) / 2 - 0.035,
          z / 2, Math.PI / 2 + side * Math.atan2(roofRise, halfWidth)),
      );
      if (detail === "near") {
        shell.add(
          beam([x + 0.075, 0.67, z + side * 0.02], [x + pitch - 0.075, 1.14, z + side * 0.02], 0.048, "gray"),
          boxCenter([0.15, 0.16, 0.05], "hull", [x + 0.08, 1.16, z + side * 0.08], 0.012),
        );
      }
    }
  }
}

function buildEndWalls(shell: Group, detail: Detail) {
  for (const side of [-1, 1]) {
    const x = side * halfLength;
    for (const z of [-1, 1]) {
      shell.add(
        boxCenter([0.17, 1.88, 0.78], "offWhite", [x, 1.55, z * 1.82], 0.04),
        boxCenter([0.14, 0.49, 0.85], "hull", [x, 0.94, z * 1.01], 0.034),
      );
      const pane = glazing(0.84, 1.33, x - side * 0.025, 1.87, z * 1.02);
      pane.rotation.y = Math.PI / 2;
      shell.add(pane);
    }
    shell.add(
      boxCenter([0.20, 0.18, 4.44], "offWhite", [x, eave, 0], 0.036),
      boxCenter([0.23, 1.79, 1.28], "darkGray", [x, 1.55, 0], 0.048),
      boxCenter([0.27, 1.55, 1.04], "hull", [x + side * 0.037, 1.53, 0], 0.055),
      boxCenter([0.24, 0.32, 0.83], "darkGray", [x, eave + 0.25, 0], 0.039),
    );
    const gable = new Shape();
    gable.moveTo(-halfWidth + 0.11, 0);
    gable.lineTo(halfWidth - 0.11, 0);
    gable.lineTo(0, roofRise - 0.07);
    gable.closePath();
    const pane = new Mesh(new ShapeGeometry(gable), materials.M_glass);
    pane.position.set(x - side * 0.03, eave, 0);
    pane.rotation.y = Math.PI / 2;
    shell.add(pane);
    if (detail !== "far") {
      shell.add(boxCenter([0.032, 0.092, 0.22], "cyan", [x + side * 0.176, 2.13, 0.25], 0.014));
    }
  }
  for (const side of [-1, 1]) {
    shell.add(
      boxCenter([0.43, 0.26, 1.37], "gray", [side * 5.00, 0.13, 0], 0.038),
      boxCenter([0.34, 0.24, 1.35], "hull", [side * 4.99, 0.37, 0], 0.042),
      boxCenter([0.21, 0.23, 1.32], "offWhite", [side * 4.96, 0.59, 0], 0.038),
    );
  }
}

function buildPlanters(shell: Group, detail: Detail) {
  for (const side of [-1, 1]) {
    const z = side * 1.24;
    shell.add(
      boxCenter([7.96, 0.18, 1.12], "hull", [0, 1.10, z], 0.045),
      boxCenter([7.82, 0.07, 0.98], "darkGray", [0, 1.22, z], 0.016),
    );
    if (detail === "far") continue;
    for (const x of [-3.55, -1.76, 0, 1.76, 3.55]) {
      shell.add(
        boxCenter([0.11, 0.40, 0.97], "gray", [x, 0.89, z], 0.026),
        boxCenter([0.035, 0.065, 1.09], "offWhite", [x, 1.24, z], 0.012),
      );
    }
    if (detail === "near") {
      shell.add(pipe([[-4.11, 0.78, z], [-4.11, 1.40, z], [3.96, 1.40, z]], 0.028, 6, "gray"));
    }
  }
  if (detail === "near") {
    shell.add(
      boxCenter([0.79, 0.82, 0.58], "hull", [4.14, 1.10, 1.28], 0.049),
      boxCenter([0.50, 0.24, 0.037], "darkGray", [4.14, 1.36, 0.977], 0.012),
      boxCenter([0.18, 0.05, 0.025], "cyan", [4.19, 1.39, 0.954], 0.008),
    );
  }
}

function hydroponicLeaves(detail: Detail) {
  const rosette = new BufferGeometry();
  const positions: number[] = [], indices: number[] = [];
  const leaves = detail === "near" ? 6 : detail === "middle" ? 4 : 3;
  for (let i = 0; i < leaves; i++) {
    const angle = i * 2 * Math.PI / leaves;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const span = i % 2 === 0 ? 0.17 : 0.145;
    const base = positions.length / 3;
    positions.push(
      0, 0, 0,
      dx * span * 0.48 - dz * 0.068, 0.094, dz * span * 0.48 + dx * 0.068,
      dx * span * 0.58, 0.132, dz * span * 0.58,
      dx * span * 0.48 + dz * 0.068, 0.094, dz * span * 0.48 - dx * 0.068,
      dx * span, 0.18, dz * span,
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3,
      base + 1, base + 4, base + 2, base + 2, base + 4, base + 3);
  }
  rosette.setAttribute("position", new Float32BufferAttribute(positions, 3));
  rosette.setIndex(indices);
  rosette.computeVertexNormals();
  const leavesMesh = new Mesh(coloredGeometry(rosette, "leaf", { weld: true }), materials.M_palette);
  const columns = detail === "near" ? 22 : detail === "middle" ? 14 : 8;
  const plants = [];
  for (const side of [-1, 1]) for (let i = 0; i < columns; i++) {
    for (const row of [-1, 1]) {
      const plant = location(-3.68 + i * 7.36 / (columns - 1), 1.255, side * 1.24 + row * 0.234);
      plant.rotation.y = (i * 1.33 + row) % Math.PI;
      plant.scale.setScalar(0.86 + (i * 7 % 9) * 0.037);
      plants.push(plant);
    }
  }
  return repeatMesh(leavesMesh, "Hydroponic leaves", plants);
}

export function registerGreenhouse(registry: PieceRegistry) {
  registry.register<{ detail: Detail }>("MB-11", {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, GREENHOUSE_LODS, "near") }),
    variants: { standard: { detail: "near" } },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ detail }) => {
      const shell = new Group();
      buildEnvelope(shell, detail);
      buildEndWalls(shell, detail);
      buildPlanters(shell, detail);
      return alignBaseCenter(fusedParts("MB-11 Hydroponic greenhouse", shell, detail === "near", [hydroponicLeaves(detail)]));
    },
  });
}
