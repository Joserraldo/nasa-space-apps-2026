import { Group } from "three";
import { polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { screenTypes, type ScreenType } from "../../../materials/screens";
import {
  alignBaseCenter, boxAt, extrudedMesh, parseChoice, parseRecord, screenMesh, type PaletteKey,
} from "./helpers";

interface DeskParams { screen: ScreenType }

function parseDesk(input: unknown): DeskParams {
  const rec = parseRecord(input, ["screen"]);
  return { screen: parseChoice(rec.screen, screenTypes, "energy") };
}

const chairAccents = ["cyan", "blue"] as const;
interface OfficeChairParams { accent: typeof chairAccents[number] }

function parseOfficeChair(input: unknown): OfficeChairParams {
  const rec = parseRecord(input, ["accent"]);
  return { accent: parseChoice(rec.accent, chairAccents, "cyan") };
}

const credenzaStyles = ["standard", "compact"] as const;
interface CredenzaParams { style: typeof credenzaStyles[number] }

function parseCredenza(input: unknown): CredenzaParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, credenzaStyles, "standard") };
}

export function registerControlFurniture(registry: PieceRegistry): void {
  registry.register<DeskParams>("CR-03", {
    parse: parseDesk,
    variants: {
      energy: { screen: "energy" },
      communications: { screen: "communications" },
      colonyMap: { screen: "colony-map" },
      terminal: { screen: "terminal" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ screen }) => {
      const group = new Group();
      // Sculpted sci-fi workstation desk with dark frames, under-desk floor-graze cyan LED, and cyan-rimmed monitor.
      for (const x of [-0.68, 0.68]) {
        group.add(boxAt([0.16, 0.72, 0.68], "white", [x, 0, 0], 0.024, ["bottom"]));
        group.add(boxAt([0.18, 0.64, 0.56], "black", [x, 0.05, 0], 0.014, ["bottom"]));
        group.add(boxAt([0.19, 0.06, 0.74], "black", [x, 0, 0], 0.012, ["bottom"]));
        group.add(boxAt([0.05, 0.54, 0.045], "cyan", [x, 0.11, 0.35], 0.006));
      }
      group.add(boxAt([1.24, 0.58, 0.08], "black", [0, 0.10, -0.26], 0.016));
      group.add(boxAt([1.22, 0.045, 0.05], "cyan", [0, 0.03, -0.22], 0.006));
      group.add(boxAt([1.62, 0.08, 0.82], "white", [0, 0.72, 0], 0.024));
      group.add(boxAt([1.54, 0.038, 0.045], "cyan", [0, 0.725, 0.41], 0.006));
      group.add(boxAt([0.58, 0.024, 0.22], "black", [0, 0.8, 0.16], 0.005, ["bottom"]));

      // Monitor stand + dark-framed cyan-rimmed wide sci-fi screen bezel
      group.add(boxAt([0.22, 0.2, 0.14], "black", [0, 0.8, -0.18], 0.016, ["bottom"]));
      const monitor = new Group();
      monitor.add(boxAt([0.98, 0.58, 0.04], "black", [0, -0.03, -0.02], 0.018));
      monitor.add(boxAt([0.93, 0.53, 0.052], "cyan", [0, -0.005, -0.005], 0.014));
      monitor.add(boxAt([0.89, 0.49, 0.062], "black", [0, 0.015, 0.002], 0.012));
      const ui = screenMesh(0.84, 0.44, screen);
      ui.position.set(0, 0.26, 0.036);
      monitor.add(ui);
      monitor.position.set(0, 0.94, -0.16);
      monitor.rotation.x = -0.14;
      group.add(monitor);
      return alignBaseCenter(group);
    },
  });

  registry.register<OfficeChairParams>("CF-02", {
    parse: parseOfficeChair,
    variants: {
      cyan: { accent: "cyan" },
      blue: { accent: "blue" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ accent }) => {
      const group = new Group();
      const stripColor: PaletteKey = accent === "cyan" ? "cyan" : "blue";
      const hub = extrudedMesh(polygonShape(0.1, 8), 0.34, 0.012, "darkGray", [0, 0.21, 0]);
      hub.rotation.x = -Math.PI / 2;
      group.add(hub);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leg = boxAt([0.065, 0.05, 0.3], "black", [Math.sin(angle) * 0.15, 0, Math.cos(angle) * 0.15], 0.01, ["bottom"]);
        leg.rotation.y = angle;
        group.add(leg);
      }
      group.add(boxAt([0.54, 0.08, 0.52], "white", [0, 0.38, 0.02], 0.022));
      group.add(boxAt([0.46, 0.055, 0.44], "black", [0, 0.45, 0.03], 0.014));
      for (const x of [-0.28, 0.28]) {
        group.add(boxAt([0.07, 0.2, 0.34], "white", [x, 0.44, 0.02], 0.016));
        group.add(boxAt([0.03, 0.03, 0.26], "cyan", [x, 0.63, 0.02], 0.005));
      }
      const back = new Group();
      back.add(boxAt([0.52, 0.76, 0.085], "white", [0, 0, 0], 0.024));
      back.add(boxAt([0.40, 0.60, 0.055], "black", [0, 0.07, 0.03], 0.012));
      back.add(boxAt([0.42, 0.58, 0.026], "black", [0, 0.09, -0.042], 0.008));
      back.add(boxAt([0.32, 0.16, 0.05], "black", [0, 0.62, 0.02], 0.014));
      for (const x of [-0.17, 0.17]) {
        back.add(boxAt([0.054, 0.48, 0.028], stripColor, [x, 0.13, -0.056], 0.005));
      }
      back.position.set(0, 0.44, -0.22);
      back.rotation.x = -0.12;
      group.add(back);
      return alignBaseCenter(group);
    },
  });

  registry.register<CredenzaParams>("CF-03", {
    parse: parseCredenza,
    variants: {
      standard: { style: "standard" },
      compact: { style: "compact" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const width = style === "standard" ? 1.84 : 1.24;
      group.add(boxAt([width - 0.06, 0.09, 0.50], "black", [0, 0, 0], 0.015, ["bottom"]));
      group.add(boxAt([width - 0.14, 0.042, 0.045], "cyan", [0, 0.025, 0.25], 0.006));
      group.add(boxAt([width, 0.74, 0.56], "white", [0, 0.09, 0], 0.026, ["bottom"]));
      group.add(boxAt([width - 0.10, 0.64, 0.04], "black", [0, 0.14, 0.268], 0.012));
      group.add(boxAt([width + 0.04, 0.06, 0.6], "darkGray", [0, 0.83, 0], 0.016));
      const bays = style === "standard" ? [-0.56, 0, 0.56] : [-0.3, 0.3];
      for (const x of bays) {
        for (const y of [0.17, 0.49]) {
          group.add(boxAt([0.48, 0.25, 0.04], "offWhite", [x, y, 0.28], 0.01));
          group.add(boxAt([0.24, 0.034, 0.028], "cyan", [x, y + 0.17, 0.302], 0.005));
        }
      }
      return alignBaseCenter(group);
    },
  });
}
