import { Group, Mesh } from "three";
import { chamferBox, chamferRect, geodesicHalf, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { screenTypes, type ScreenType } from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boxAt, boxCenter, createRng, extrudedMesh, parseChoice, parseRecord,
  screenMesh, skyViewportMesh, type PaletteKey,
} from "./helpers";

const windowModes = ["transparent", "space", "mars"] as const;
interface PanoramicWindowParams { mode: typeof windowModes[number] }
function parsePanoramicWindow(input: unknown): PanoramicWindowParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, windowModes, "transparent") };
}

const consoleModes = ["comms", "command"] as const;
interface CurvedConsoleParams { mode: typeof consoleModes[number] }
function parseCurvedConsole(input: unknown): CurvedConsoleParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, consoleModes, "comms") };
}

const pilotChairAccents = ["cyan", "warning"] as const;
interface PilotChairParams { accent: typeof pilotChairAccents[number] }
function parsePilotChair(input: unknown): PilotChairParams {
  const rec = parseRecord(input, ["accent"]);
  return { accent: parseChoice(rec.accent, pilotChairAccents, "cyan") };
}

interface GiantScreenParams { screen: ScreenType }
function parseGiantScreen(input: unknown): GiantScreenParams {
  const rec = parseRecord(input, ["screen"]);
  return { screen: parseChoice(rec.screen, screenTypes, "communications") };
}

export function registerCommsRoomPieces(registry: PieceRegistry): void {
  registry.register<PanoramicWindowParams>("ST-W04", {
    parse: parsePanoramicWindow,
    variants: {
      transparent: { mode: "transparent" },
      space: { mode: "space" },
      mars: { mode: "mars" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [4, 3, 0.3], module: 2 },
    },
    build: ({ mode }) => {
      const group = new Group();
      // 4x3x0.3m panoramic chamfered viewport wall (v1-t016.10 / v2-t039.70).
      group.add(boxAt([4, 0.18, 0.3], "black", [2, 0, 0], 0.016, ["bottom"]));
      group.add(boxAt([4, 0.32, 0.3], "darkGray", [2, 2.68, 0], 0.02, ["top"]));
      group.add(boxAt([4, 0.56, 0.22], "white", [2, 0.18, 0], 0.02));
      group.add(boxAt([3.4, 0.045, 0.045], "cyan", [2, 0.04, 0.12], 0.006));
      for (const x of [0.22, 3.78]) {
        group.add(boxAt([0.44, 1.96, 0.22], "white", [x, 0.74, 0], 0.02));
      }

      // Wide black chamfered outer frame + glowing cyan inner bezel + central cyan-lit mullion rib.
      const outerFrame = chamferRect(3.56, 1.98, 0.34);
      outerFrame.holes.push(chamferRect(3.2, 1.64, 0.24));
      group.add(extrudedMesh(outerFrame, 0.24, 0.016, "black", [2, 1.71, 0]));

      const cyanBezel = chamferRect(3.26, 1.7, 0.26);
      cyanBezel.holes.push(chamferRect(3.14, 1.58, 0.22));
      group.add(extrudedMesh(cyanBezel, 0.08, 0.008, "cyan", [2, 1.71, 0.085]));

      // Center structural mullion post with vertical cyan light bar (v2-t039.70).
      group.add(boxAt([0.16, 1.68, 0.2], "black", [2, 0.87, 0.02], 0.014));
      group.add(boxAt([0.05, 1.44, 0.032], "cyan", [2, 0.99, 0.122], 0.006));

      if (mode === "transparent") {
        // Translucent M_glass viewport pane allowing exterior MI-05 dish visibility in NW-13.
        const glass = new Mesh(chamferBox(3.16, 1.6, 0.026, 0.006), materials.M_glass);
        glass.position.set(2, 1.71, 0.01);
        group.add(glass);
      } else {
        const sky = skyViewportMesh(3.2, 1.64);
        sky.position.set(2, 1.71, -0.08);
        group.add(sky);

        // Deterministic low-poly starfield clusters across both bow panes (avoiding center mullion x=2).
        const rng = createRng(mode === "mars" ? 19 : 37);
        for (let i = 0; i < 9; i++) {
          const paneSign = i % 2 === 0 ? -1 : 1;
          const sx = 2 + paneSign * (0.26 + rng() * 1.18);
          const sy = 1.04 + rng() * 1.34;
          if (mode === "mars" && Math.hypot(sx - 2.82, sy - 1.74) < 0.68) continue;
          const starSize = 0.02 + (i % 3) * 0.007;
          const starCol: PaletteKey = i % 3 === 0 ? "cyan" : "ice";
          group.add(boxCenter([starSize, starSize, 0.012], starCol, [sx, sy, -0.062], 0.005));
        }

        if (mode === "mars") {
          // 3D faceted geodesic Mars hemisphere with real directional shading + north polar ice cap.
          const mars = new Mesh(coloredGeometry(geodesicHalf(0.56, 1), "oxide"), materials.M_palette);
          mars.rotation.set(Math.PI / 2, 0, 0);
          mars.scale.set(1, 0.12, 1);
          mars.position.set(2.82, 1.74, -0.05);

          const polar = extrudedMesh(polygonShape(0.2, 8), 0.028, 0.006, "ice", [2.74, 2.16, -0.02]);
          polar.scale.set(1.22, 0.42, 1);
          group.add(mars, polar);
        }
      }
      return group;
    },
  });

  registry.register<CurvedConsoleParams>("CR-01", {
    parse: parseCurvedConsole,
    variants: {
      comms: { mode: "comms" },
      command: { mode: "command" },
    },
    metadata: { category: "largeFurniture", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      const screens: [ScreenType, ScreenType, ScreenType] = mode === "comms"
        ? ["communications", "communications", "colony-map"]
        : ["colony-map", "energy", "terminal"];

      const segments: [number, number, number, number][] = [
        [0, 0, 0, 1.24],
        [-0.98, -0.22, -0.42, 0.96],
        [0.98, -0.22, 0.42, 0.96],
      ];

      segments.forEach(([sx, sz, rotY, width], idx) => {
        const bay = new Group();
        // Black recessed plinth + glowing cyan floor-graze strip.
        bay.add(boxAt([width - 0.06, 0.1, 0.72], "black", [0, 0, 0], 0.016, ["bottom"]));
        bay.add(boxAt([width - 0.14, 0.042, 0.045], "cyan", [0, 0.026, 0.35], 0.006));
        bay.add(boxAt([width - 0.14, 0.042, 0.045], "cyan", [0, 0.026, -0.35], 0.006));

        // Sculpted white front armor bulkhead + recessed black slot + bright cyan bar (v1-t016.10 / v2-t039.70).
        bay.add(boxAt([width, 0.96, 0.44], "white", [0, 0.1, 0.16], 0.026, ["bottom"]));
        bay.add(boxAt([width - 0.22, 0.22, 0.06], "black", [0, 0.22, 0.365], 0.012));
        bay.add(boxAt([width - 0.3, 0.1, 0.04], "cyan", [0, 0.28, 0.39], 0.008));
        bay.add(boxAt([width + 0.02, 0.12, 0.3], "white", [0, 0.98, 0.22], 0.022));

        // Operator desk shelf & tilted glowing touch-display on the -Z side.
        bay.add(boxAt([width - 0.04, 0.66, 0.36], "darkGray", [0, 0.1, -0.18], 0.02, ["bottom"]));
        bay.add(boxAt([width, 0.08, 0.52], "black", [0, 0.74, -0.16], 0.018));
        bay.add(boxAt([width - 0.12, 0.036, 0.04], "cyan", [0, 0.76, -0.41], 0.005));

        const panel = new Group();
        const sw = width * 0.72;
        panel.add(boxCenter([sw + 0.08, 0.38, 0.04], "black", [0, 0, 0], 0.012));
        panel.add(boxCenter([sw + 0.04, 0.34, 0.046], "cyan", [0, 0, 0.004], 0.008));
        const ui = screenMesh(sw, 0.3, screens[idx]);
        ui.position.set(0, 0, 0.029);
        panel.add(ui);
        panel.position.set(0, 0.9, -0.08);
        panel.rotation.set(-0.92, Math.PI, 0);
        bay.add(panel);

        bay.position.set(sx, 0, sz);
        bay.rotation.y = rotY;
        group.add(bay);
      });

      return alignBaseCenter(group);
    },
  });

  registry.register<PilotChairParams>("CR-02", {
    parse: parsePilotChair,
    variants: {
      cyan: { accent: "cyan" },
      warning: { accent: "warning" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ accent }) => {
      const group = new Group();
      const led: PaletteKey = accent === "cyan" ? "cyan" : "warning";

      // Heavy chamfered octagonal swivel base + hydraulic pedestal + cyan ring (v2-t039.70).
      const foot = extrudedMesh(polygonShape(0.36, 8), 0.07, 0.014, "white", [0, 0.035, 0]);
      foot.rotation.x = -Math.PI / 2;
      const baseRing = extrudedMesh(polygonRing(0.33, 0.27, 8), 0.04, 0.006, led, [0, 0.075, 0]);
      baseRing.rotation.x = -Math.PI / 2;
      const post = extrudedMesh(polygonShape(0.14, 8), 0.3, 0.014, "black", [0, 0.22, 0]);
      post.rotation.x = -Math.PI / 2;
      group.add(foot, baseRing, post);

      // Armored white bucket-seat shell & black segmented cushion.
      group.add(boxAt([0.66, 0.11, 0.62], "white", [0, 0.34, 0.02], 0.024));
      group.add(boxAt([0.52, 0.08, 0.54], "black", [0, 0.43, 0.04], 0.018));
      group.add(boxAt([0.44, 0.032, 0.04], led, [0, 0.37, 0.325], 0.005));

      // Chunky pilot armrests with blue touchpads and glowing front nose LEDs.
      for (const x of [-0.36, 0.36]) {
        group.add(boxAt([0.14, 0.24, 0.5], "white", [x, 0.42, 0.05], 0.022));
        group.add(boxAt([0.15, 0.12, 0.32], "black", [x, 0.46, 0.04], 0.012));
        group.add(boxAt([0.09, 0.028, 0.22], "blue", [x, 0.655, 0.11], 0.006));
        group.add(boxAt([0.08, 0.055, 0.045], led, [x, 0.54, 0.295], 0.006));
      }

      // Contoured high-back armored shell + ribbed black cushions + twin rear vertical LEDs.
      const back = new Group();
      back.add(boxAt([0.64, 0.88, 0.12], "white", [0, 0, 0], 0.028));
      back.add(boxAt([0.48, 0.62, 0.075], "black", [0, 0.08, 0.042], 0.016));
      back.add(boxAt([0.38, 0.2, 0.08], "darkGray", [0, 0.68, 0.045], 0.018));
      back.add(boxAt([0.48, 0.66, 0.03], "black", [0, 0.1, -0.055], 0.008));
      for (const x of [-0.21, 0.21]) {
        back.add(boxAt([0.055, 0.56, 0.032], led, [x, 0.15, -0.068], 0.006));
      }
      back.position.set(0, 0.43, -0.24);
      back.rotation.x = -0.15;
      group.add(back);

      return alignBaseCenter(group);
    },
  });

  registry.register<GiantScreenParams>("BR-04", {
    parse: parseGiantScreen,
    variants: {
      communications: { screen: "communications" },
      colonyMap: { screen: "colony-map" },
      solarAlert: { screen: "solar-alert" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ screen }) => {
      const group = new Group();
      // Giant chamfered black-and-cyan mural display (2.76 x 1.58m) with mounting brackets (v2-t053.50 / INVENTARIO BR-04).
      for (const x of [-0.96, 0.96]) {
        group.add(boxAt([0.22, 0.12, 0.16], "darkGray", [x, 0, 0], 0.014, ["bottom"]));
      }
      const outer = chamferRect(2.76, 1.54, 0.24);
      group.add(extrudedMesh(outer, 0.1, 0.016, "black", [0, 0.85, 0]));

      const cyanRim = chamferRect(2.6, 1.38, 0.2);
      cyanRim.holes.push(chamferRect(2.48, 1.26, 0.16));
      group.add(extrudedMesh(cyanRim, 0.055, 0.008, "cyan", [0, 0.85, 0.045]));

      group.add(boxCenter([1.12, 0.09, 0.13], "white", [0, 1.62, 0.01], 0.014));
      group.add(boxCenter([0.74, 0.04, 0.04], "cyan", [0, 1.62, 0.072], 0.006));

      const ui = screenMesh(2.44, 1.22, screen);
      ui.position.set(0, 0.85, 0.058);
      group.add(ui);

      return alignBaseCenter(group);
    },
  });
}
