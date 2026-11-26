import { Group } from "three";
import { polygonRing } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { screenTypes, type ScreenType } from "../../../materials/screens";
import {
  alignBaseCenter, boostVertexLuminance, boxAt, boxCenter, extrudedMesh,
  parseChoice, parseRecord, screenMesh, type PaletteKey,
} from "./helpers";

interface KioskParams { screen: ScreenType; accent: "cyan" | "warning" }
function parseKiosk(input: unknown): KioskParams {
  const rec = parseRecord(input, ["screen", "accent"]);
  return {
    screen: parseChoice(rec.screen, screenTypes, "colony-map"),
    accent: parseChoice(rec.accent, ["cyan", "warning"] as const, "cyan"),
  };
}

const cofferTones = ["cyan", "warm"] as const;
interface CofferParams { tone: typeof cofferTones[number] }
function parseCoffer(input: unknown): CofferParams {
  const rec = parseRecord(input, ["tone"]);
  return { tone: parseChoice(rec.tone, cofferTones, "cyan") };
}

export function registerBridgePieces(registry: PieceRegistry): void {
  registry.register<KioskParams>("AT-02", {
    parse: parseKiosk,
    variants: {
      navigation: { screen: "colony-map", accent: "cyan" },
      telemetry: { screen: "communications", accent: "cyan" },
      alert: { screen: "solar-alert", accent: "warning" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ screen, accent }) => {
      const group = new Group();
      const led: PaletteKey = accent;
      // Angled flight-deck / atrium helm pedestal with sculpted white cheeks & tilted screen (v2-t008.20 / INVENTARIO AT-02).
      group.add(boxAt([0.92, 0.09, 0.64], "black", [0, 0, 0], 0.016, ["bottom"]));
      group.add(boxAt([0.74, 0.038, 0.042], led, [0, 0.024, 0.31], 0.005));
      group.add(boxAt([0.74, 0.038, 0.042], led, [0, 0.024, -0.31], 0.005));

      group.add(boxAt([0.72, 0.86, 0.44], "black", [0, 0.09, -0.02], 0.02, ["bottom"]));
      for (const x of [-0.41, 0.41]) {
        group.add(boxAt([0.12, 0.94, 0.56], "white", [x, 0.09, 0.02], 0.022, ["bottom"]));
        group.add(boxAt([0.04, 0.62, 0.035], led, [x, 0.24, 0.295], 0.006));
      }

      // Forward white armored hood + recessed cyan status bar.
      group.add(boxAt([0.94, 0.24, 0.42], "white", [0, 0.84, 0.08], 0.022));
      group.add(boxAt([0.56, 0.075, 0.04], led, [0, 0.91, 0.285], 0.006));

      // Tilted operator helm screen & dual flight-control throttle blocks on -Z side.
      group.add(boxAt([0.88, 0.07, 0.34], "darkGray", [0, 0.82, -0.18], 0.016));
      for (const tx of [-0.28, 0.28]) {
        group.add(boxAt([0.1, 0.08, 0.12], "black", [tx, 0.88, -0.22], 0.01));
      }

      const display = new Group();
      display.add(boxCenter([0.78, 0.46, 0.045], "black", [0, 0, 0], 0.014));
      display.add(boxCenter([0.73, 0.41, 0.05], led, [0, 0, 0.004], 0.008));
      const ui = screenMesh(0.68, 0.36, screen);
      ui.position.set(0, 0, 0.031);
      display.add(ui);
      display.position.set(0, 1.04, -0.04);
      display.rotation.set(-0.78, Math.PI, 0);
      group.add(display);

      return alignBaseCenter(group);
    },
  });

  registry.register<CofferParams>("ST-R03", {
    parse: parseCoffer,
    variants: {
      cyan: { tone: "cyan" },
      warm: { tone: "warm" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, 0.6, 4], module: 2 },
    },
    build: ({ tone }) => {
      const group = new Group();
      const accent: PaletteKey = tone === "cyan" ? "cyan" : "warning";
      // Stepped octagonal coffered bridge ceiling with neutral luminous core & accent trim (v2-t003.00 / INVENTARIO ST-R03).
      group.add(boxAt([4, 0.18, 4], "gray", [2, 0.42, 2], 0.024, ["top"]));
      group.add(boxAt([3.68, 0.1, 3.68], "white", [2, 0.32, 2], 0.02, ["top"]));

      const outerOct = extrudedMesh(polygonRing(1.78, 1.36, 8), 0.18, 0.018, "black", [2, 0.22, 2]);
      outerOct.rotation.x = -Math.PI / 2;
      const midOct = extrudedMesh(polygonRing(1.4, 0.98, 8), 0.18, 0.018, "white", [2, 0.12, 2]);
      midOct.rotation.x = -Math.PI / 2;
      const trimOct = extrudedMesh(polygonRing(1.02, 0.9, 8), 0.055, 0.008, accent, [2, 0.028, 2]);
      trimOct.rotation.x = -Math.PI / 2;
      const innerLight = extrudedMesh(polygonRing(0.88, 0.36, 8), 0.055, 0.008, "white", [2, 0.04, 2]);
      innerLight.geometry = boostVertexLuminance(
        innerLight.geometry,
        tone === "cyan" ? [2.16, 2.18, 2.44] : [2.32, 2.14, 1.92],
      );
      innerLight.rotation.x = -Math.PI / 2;

      group.add(outerOct, midOct, trimOct, innerLight);
      return group;
    },
  });
}
