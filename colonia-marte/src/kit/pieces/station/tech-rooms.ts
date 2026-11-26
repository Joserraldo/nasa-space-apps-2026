import { Group, Mesh } from "three";
import {
  extrudeProfile, geodesicHalf, panelInset, pipeRun, polygonRing, polygonShape, truncatedIcosa,
} from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boxAt, createRng, extrudedMesh, parseChoice, parseRecord, parseSeed,
  screenMesh, weldedColoredGeometry, type PaletteKey,
} from "./helpers";

const rackStates = ["nominal", "busy", "alert"] as const;
interface ServerRackParams { status: typeof rackStates[number]; seed: number }

function parseServerRack(input: unknown): ServerRackParams {
  const rec = parseRecord(input, ["status", "seed"]);
  return {
    status: parseChoice(rec.status, rackStates, "nominal"),
    seed: parseSeed(rec.seed, 1),
  };
}

const floorTileModes = ["vented", "solid"] as const;
interface TechFloorParams { mode: typeof floorTileModes[number] }

function parseTechFloor(input: unknown): TechFloorParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, floorTileModes, "vented") };
}

const holoTopics = ["colony", "orbital", "common"] as const;
interface HoloTableParams { topic: typeof holoTopics[number] }

function parseHoloTable(input: unknown): HoloTableParams {
  const rec = parseRecord(input, ["topic"]);
  return { topic: parseChoice(rec.topic, holoTopics, "colony") };
}

const doorStates = ["sealed", "unlocked"] as const;
interface AirlockDoorParams { state: typeof doorStates[number] }

function parseAirlockDoor(input: unknown): AirlockDoorParams {
  const rec = parseRecord(input, ["state"]);
  return { state: parseChoice(rec.state, doorStates, "sealed") };
}

const panelStates = ["nominal", "cycling", "alert"] as const;
interface PressurePanelParams { status: typeof panelStates[number] }

function parsePressurePanel(input: unknown): PressurePanelParams {
  const rec = parseRecord(input, ["status"]);
  return { status: parseChoice(rec.status, panelStates, "nominal") };
}

const ductShapes = ["straight", "elbow"] as const;
interface CoolingDuctParams { shape: typeof ductShapes[number] }

function parseCoolingDuct(input: unknown): CoolingDuctParams {
  const rec = parseRecord(input, ["shape"]);
  return { shape: parseChoice(rec.shape, ductShapes, "straight") };
}

export function registerTechAndAirlockPieces(registry: PieceRegistry): void {
  registry.register<CoolingDuctParams>("NW-01-C", {
    parse: parseCoolingDuct,
    variants: {
      straight: { shape: "straight" },
      elbow: { shape: "elbow" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ shape }) => {
      const group = new Group();
      group.add(boxAt([1.96, 0.34, 0.46], "gray", [0, 0.04, 0], 0.028));
      for (const x of [-0.88, 0, 0.88]) {
        group.add(boxAt([0.1, 0.4, 0.52], "darkGray", [x, 0.01, 0], 0.016));
      }
      group.add(boxAt([1.56, 0.035, 0.04], "cyan", [0, 0, 0], 0.006));
      if (shape === "elbow") {
        group.add(boxAt([0.46, 0.62, 0.46], "gray", [0.72, -0.54, 0], 0.026));
        group.add(boxAt([0.52, 0.1, 0.52], "darkGray", [0.72, -0.56, 0], 0.016));
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<ServerRackParams>("NW-01-A", {
    parse: parseServerRack,
    variants: {
      nominal: { status: "nominal", seed: 1 },
      busy: { status: "busy", seed: 4 },
      alert: { status: "alert", seed: 7 },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ status, seed }) => {
      const group = new Group();
      const rng = createRng(seed);
      // Heavy 0.88 x 2.12 x 0.88 server cabinet with black recessed bay frame & cyan edge/kick LEDs.
      group.add(boxAt([0.88, 0.1, 0.88], "black", [0, 0, 0], 0.018, ["bottom"]));
      group.add(boxAt([0.72, 0.038, 0.045], "cyan", [0, 0.03, 0.43], 0.005));
      group.add(boxAt([0.80, 1.92, 0.82], "black", [0, 0.1, -0.01], 0.02, ["bottom"]));
      for (const x of [-0.42, 0.42]) {
        group.add(boxAt([0.1, 1.96, 0.86], "white", [x, 0.08, 0], 0.018, ["bottom"]));
        group.add(boxAt([0.032, 1.72, 0.032], "cyan", [x * 0.88, 0.20, 0.43], 0.005));
      }
      group.add(boxAt([0.92, 0.14, 0.88], "white", [0, 2.0, 0], 0.022));
      for (let row = 0; row < 6; row++) {
        const y = 0.2 + row * 0.29;
        group.add(boxAt([0.68, 0.22, 0.06], "darkGray", [0, y, 0.39], 0.012));
        const ledColor: PaletteKey = status === "alert" && row % 2 === 0
          ? "doorClosed"
          : status === "busy" && rng() > 0.45 ? "warning" : "cyan";
        const secondary: PaletteKey = rng() > 0.3 ? "doorOpen" : "cyan";
        group.add(boxAt([0.36, 0.028, 0.025], ledColor, [-0.1, y + 0.09, 0.425], 0.006));
        group.add(boxAt([0.12, 0.028, 0.025], secondary, [0.22, y + 0.09, 0.425], 0.006));
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<TechFloorParams>("NW-01-B", {
    parse: parseTechFloor,
    variants: {
      vented: { mode: "vented" },
      solid: { mode: "solid" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      // 0.6m modular raised server-room tile with perforated airflow inset.
      group.add(boxAt([0.6, 0.04, 0.6], "black", [0, 0, 0], 0.008, ["bottom"]));
      if (mode === "vented") {
        const frame = new Mesh(
          coloredGeometry(panelInset(0.58, 0.58, 0.035, 0.07), "gray"),
          materials.M_palette,
        );
        frame.rotation.x = -Math.PI / 2;
        frame.position.set(0, 0.0575, 0);
        group.add(frame);
        group.add(boxAt([0.38, 0.018, 0.38], "cyan", [0, 0.035, 0], 0.005, ["bottom"]));
        for (const z of [-0.15, -0.05, 0.05, 0.15]) {
          group.add(boxAt([0.42, 0.028, 0.045], "darkGray", [0, 0.047, z], 0.006));
        }
      } else {
        group.add(boxAt([0.58, 0.035, 0.58], "offWhite", [0, 0.04, 0], 0.01, ["bottom"]));
        for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
          group.add(boxAt([0.06, 0.02, 0.06], "darkGray", [x, 0.06, z], 0.005));
        }
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<HoloTableParams>("NW-01-D", {
    parse: parseHoloTable,
    variants: {
      colony: { topic: "colony" },
      orbital: { topic: "orbital" },
      common: { topic: "common" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ topic }) => {
      const group = new Group();
      const isCommon = topic === "common";
      const sides = isCommon ? 10 : 8;
      const topRadius = isCommon ? 1.18 : 1.02;
      const plinthRadius = isCommon ? 0.88 : 0.78;
      const plinth = extrudedMesh(polygonShape(plinthRadius, sides), 0.1, 0.015, "gray", [0, 0.05, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const baseGlow = extrudedMesh(polygonRing(plinthRadius + 0.03, plinthRadius - 0.05, sides), 0.04, 0.006, "cyan", [0, 0.022, 0]);
      baseGlow.rotation.x = -Math.PI / 2;
      const column = extrudedMesh(polygonShape(isCommon ? 0.54 : 0.48, sides), 0.58, 0.02, isCommon ? "gray" : "black", [0, 0.39, 0]);
      column.rotation.x = -Math.PI / 2;
      const rim = extrudedMesh(polygonShape(topRadius, sides), 0.14, 0.022, "white", [0, 0.75, 0]);
      rim.rotation.x = -Math.PI / 2;
      const edgeGlow = extrudedMesh(polygonRing(topRadius + 0.025, topRadius - 0.06, sides), 0.042, 0.006, "cyan", [0, 0.73, 0]);
      edgeGlow.rotation.x = -Math.PI / 2;
      const emitter = extrudedMesh(polygonRing(0.68, 0.48, sides), 0.05, 0.008, "cyan", [0, 0.835, 0]);
      emitter.rotation.x = -Math.PI / 2;
      const core = extrudedMesh(polygonShape(0.46, sides), 0.04, 0.008, "darkGray", [0, 0.83, 0]);
      core.rotation.x = -Math.PI / 2;
      group.add(plinth, baseGlow, column, rim, edgeGlow, emitter, core);

      if (isCommon) {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const pad = boxAt([0.36, 0.022, 0.22], "gray", [Math.sin(angle) * 0.88, 0.82, Math.cos(angle) * 0.88], 0.006);
          pad.rotation.y = angle;
          group.add(pad);
        }
      }

      // Additive M_hologram projection floating above the central emitter well.
      if (topic === "colony") {
        const dome = new Mesh(geodesicHalf(0.36, 1), materials.M_hologram);
        dome.position.set(0, 0.92, 0);
        const pod = new Mesh(truncatedIcosa(0.14), materials.M_hologram);
        pod.position.set(0.32, 1.04, 0.14);
        group.add(dome, pod);
      } else {
        const planet = new Mesh(truncatedIcosa(isCommon ? 0.27 : 0.24), materials.M_hologram);
        planet.position.set(0, 1.16, 0);
        const orbit = new Mesh(
          extrudeRingHologram(isCommon ? 0.5 : 0.46, isCommon ? 0.43 : 0.4, 12),
          materials.M_hologram,
        );
        orbit.rotation.set(1.18, 0.3, 0);
        orbit.position.set(0, 1.16, 0);
        group.add(planet, orbit);
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<AirlockDoorParams>("NW-05-A", {
    parse: parseAirlockDoor,
    variants: {
      sealed: { state: "sealed" },
      unlocked: { state: "unlocked" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ state }) => {
      const group = new Group();
      const indicator: PaletteKey = state === "sealed" ? "doorClosed" : "doorOpen";
      // Heavy airlock bulkhead casing with dark frame + circular hatch ring + warning/status bars.
      group.add(boxAt([1.84, 0.14, 0.4], "black", [0, 0, 0], 0.02, ["bottom"]));
      group.add(boxAt([1.8, 2.32, 0.3], "white", [0, 0.14, 0], 0.032, ["bottom"]));
      group.add(boxAt([1.58, 2.12, 0.34], "black", [0, 0.14, 0], 0.026, ["bottom"]));
      group.add(boxAt([1.46, 2.00, 0.355], "darkGray", [0, 0.18, 0], 0.022, ["bottom"]));
      group.add(boxAt([1.82, 0.08, 0.36], "warning", [0, 2.42, 0], 0.012));

      const ring = extrudedMesh(polygonRing(0.74, 0.54, 12), 0.4, 0.02, "gray", [0, 1.24, 0]);
      const leaf = extrudedMesh(polygonShape(0.56, 12), 0.24, 0.018, "white", [0, 1.24, 0]);
      const wheelRim = extrudedMesh(polygonRing(0.22, 0.16, 10), 0.05, 0.008, "warning", [0, 1.24, 0.2]);
      group.add(ring, leaf, wheelRim);
      for (const rotZ of [0, Math.PI / 2]) {
        const spoke = boxAt([0.34, 0.04, 0.04], "black", [0, 1.22, 0.19], 0.007);
        spoke.rotation.z = rotZ;
        group.add(spoke);
      }
      group.add(boxAt([0.52, 0.08, 0.06], "black", [0, 2.18, 0.18], 0.01));
      group.add(boxAt([0.4, 0.04, 0.03], indicator, [0, 2.2, 0.2], 0.006));
      return alignBaseCenter(group);
    },
  });

  registry.register<PressurePanelParams>("NW-05-B", {
    parse: parsePressurePanel,
    variants: {
      nominal: { status: "nominal" },
      cycling: { status: "cycling" },
      alert: { status: "alert" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ status }) => {
      const group = new Group();
      const badge: PaletteKey = status === "nominal"
        ? "doorOpen"
        : status === "cycling" ? "warning" : "doorClosed";
      const screenType = status === "alert" ? "solar-alert" : "terminal";
      group.add(boxAt([0.64, 0.08, 0.34], "black", [0, 0, 0], 0.014, ["bottom"]));
      group.add(boxAt([0.56, 1.34, 0.24], "white", [0, 0.08, 0], 0.024, ["bottom"]));
      group.add(boxAt([0.50, 0.84, 0.06], "black", [0, 0.52, 0.12], 0.012));

      const screen = screenMesh(0.4, 0.26, screenType);
      screen.position.set(0, 1.14, 0.155);
      group.add(screen);

      group.add(boxAt([0.16, 0.07, 0.03], badge, [-0.12, 0.86, 0.155], 0.006));
      group.add(boxAt([0.18, 0.07, 0.03], "cyan", [0.11, 0.86, 0.155], 0.006));
      group.add(boxAt([0.42, 0.042, 0.03], "cyan", [0, 0.03, 0.16], 0.006));

      const conduit = new Mesh(
        weldedColoredGeometry(pipeRun([[0.28, 0.18, 0], [0.34, 0.65, 0], [0.28, 1.24, 0]], 0.032, 8), "gray"),
        materials.M_palette,
      );
      group.add(conduit);
      return alignBaseCenter(group);
    },
  });
}

function extrudeRingHologram(outer: number, inner: number, sides: number) {
  return extrudeProfile(polygonRing(outer, inner, sides), 0.03, 0.006);
}
