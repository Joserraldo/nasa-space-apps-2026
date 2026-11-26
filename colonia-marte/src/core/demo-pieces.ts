import { Group, Mesh } from "three";
import { chamferBox, ledStrip } from "../kit/primitives";
import { PieceRegistry } from "../kit/registry";
import { coloredGeometry, previewGlow, previewOpaque, type PreviewColor } from "../materials/preview";

/** Minimal approved-spike fixtures, not the WS4 production architecture or furniture kit. */
function block(w: number, h: number, d: number, color: PreviewColor, x: number, y: number, z: number, bottom = false): Mesh {
  const geometry = chamferBox(w,h,d,Math.min(0.03, w/4, h/4, d/4), bottom ? ["bottom"] : []);
  const mesh = new Mesh(coloredGeometry(geometry, color), previewOpaque);
  mesh.position.set(x,y+h/2,z);
  return mesh;
}

interface TableParams { width: number; seed: number }
function parseTable(input: unknown): TableParams {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected table parameters");
  const p = input as Record<string, unknown>;
  if (Object.keys(p).some(key => !["width","seed"].includes(key))) throw new Error("Unknown table parameter");
  const width = p.width ?? 1.6, seed = p.seed ?? 1;
  if (typeof width !== "number" || ![1.2,1.6].includes(width) || !Number.isInteger(seed)) throw new Error("Invalid table parameters");
  return { width, seed: seed as number };
}

export function createDemoRegistry(): PieceRegistry {
  const registry = new PieceRegistry();
  registry.register("DN-01", {
    parse: parseTable,
    variants: { standard: { width:1.6, seed:1 }, compact: { width:1.2, seed:1 } },
    metadata: { category:"furniture", pivot:"base-center" },
    build: ({ width }) => {
      const group = new Group();
      group.add(block(0.7,0.06,0.5,"black",0,0,0,true));
      group.add(block(0.24,0.6,0.24,"darkGray",0,0.06,0,true));
      group.add(block(width-0.3,0.06,0.6,"gray",0,0.66,0,true));
      group.add(block(width,0.08,0.9,"white",0,0.72,0));
      for (const x of [-0.21,0.21]) for (const z of [-0.14,0.14]) {
        group.add(block(0.08,0.12,0.08,"black",x,0.6,z));
      }
      for (const z of [-0.425,0.425]) {
        const strip = new Mesh(ledStrip(width-0.4),previewGlow);
        strip.position.set(0,0.70,z); group.add(strip);
      }
      return group;
    },
  });
  registry.register("ST-F01", {
    parse: input => {
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) throw new Error("Floor fixture has no parameters");
      return {};
    },
    variants: { preview: {} },
    metadata: { category:"architecture", pivot:"module-corner", grid:{ size:[2,0.2,2], module:2 } },
    build: () => {
      const group = new Group();
      group.add(block(2,0.12,2,"darkGray",1,0,1,true));
      group.add(block(1.96,0.08,1.96,"offWhite",1,0.12,1,true));
      group.add(block(1.2,0.025,0.12,"gray",1,0.175,0.25,true));
      return group;
    },
  });
  return registry;
}
