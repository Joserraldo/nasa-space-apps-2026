import { Group, Mesh, PlaneGeometry, ShapeGeometry, Vector3 } from "three";
import { batchStatic } from "../../../core/batching";
import { materials } from "../../../materials/shared";
import { polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import {
  alignBaseCenter, boxCenter, extrudedMesh, parseChoice, parseRecord, weldedColoredGeometry, type PaletteKey,
} from "../station/helpers";

export const LANDING_PAD_LODS = ["near", "middle", "far"] as const;
type PadDetail = typeof LANDING_PAD_LODS[number];
const radius = 5.65;
const apothem = radius * Math.cos(Math.PI / 8);
const surface = 1.58;
export const LANDING_PAD_CLEARANCE = 7.15;

function crossBrace(from: Vector3, to: Vector3, width: number) {
  const center = from.clone().lerp(to, 0.5);
  const delta = to.clone().sub(from);
  const brace = boxCenter([width, delta.length(), width], "darkGray", center.toArray(), 0.012);
  brace.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
  return brace;
}

function paintedStripe(width: number, length: number, x: number, z: number, color: PaletteKey, lift = 0.002) {
  const plane = new PlaneGeometry(width, length);
  const mesh = new Mesh(weldedColoredGeometry(plane, color), materials.M_palette);
  plane.dispose();
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, surface + lift, z);
  return mesh;
}

function buildDeck(detail: PadDetail) {
  const deck = new Group();
  const frame = extrudedMesh(polygonShape(radius, 8), 0.29, 0.048, "darkGray", [0, surface - 0.23, 0]);
  const top = extrudedMesh(polygonShape(radius - 0.11, 8), 0.12, 0.021, "hull", [0, surface - 0.06, 0]);
  frame.rotation.x = top.rotation.x = -Math.PI / 2;
  deck.add(frame, top);
  const shape = new ShapeGeometry(polygonRing(radius - 0.36, radius - 0.47, 8));
  const outline = new Mesh(weldedColoredGeometry(shape, "gray"), materials.M_palette);
  shape.dispose();
  outline.rotation.x = -Math.PI / 2;
  outline.position.y = surface + 0.002;
  deck.add(outline);

  for (const x of [-0.77, 0.77]) {
    deck.add(paintedStripe(0.22, 2.38, x, 0, "offWhite"));
  }
  deck.add(paintedStripe(1.32, 0.22, 0, 0, "offWhite"));
  if (detail !== "near") return deck;
  for (const offset of [-3.75, -2.50, 2.50, 3.75]) {
    const length = 2 * Math.min(apothem - 0.55, apothem * Math.SQRT2 - 0.76 - Math.abs(offset));
    deck.add(
      paintedStripe(0.036, length, offset, 0, "darkGray"),
      paintedStripe(length, 0.036, 0, offset, "darkGray", 0.003),
    );
  }
  return deck;
}

function buildSupport(detail: PadDetail) {
  const frame = new Group();
  const point = (i: number, y: number) => {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    return new Vector3(Math.cos(angle) * (radius - 0.33), y, Math.sin(angle) * (radius - 0.33));
  };
  for (let i = 0; i < 8; i++) {
    const base = point(i, 0.08);
    frame.add(boxCenter([0.40, 1.39, 0.40], "darkGray", [base.x, 0.69, base.z], 0.04));
    if (detail === "far") continue;
    const next = i + 1;
    frame.add(crossBrace(base, point(next, 1.25), 0.15));
    if (detail === "near") frame.add(crossBrace(point(next, 0.085), point(i, 1.25), 0.13));
  }
  return frame;
}

function buildStair(detail: PadDetail) {
  const stair = new Group();
  const steps = 8, going = 0.30, rise = 0.19;
  const topZ = apothem - 0.08;
  const toeZ = topZ + going * steps;
  for (const side of [-1, 1]) {
    const x = side * 0.63;
    stair.add(crossBrace(new Vector3(x, 0.10, toeZ), new Vector3(x, surface - 0.08, topZ), 0.14));
    if (detail === "far") continue;
    const handTop = new Vector3(x, surface + 0.89, topZ);
    const handBottom = new Vector3(x, 1.08, toeZ - 0.27);
    stair.add(crossBrace(handBottom, handTop, 0.060));
    for (const t of [0, 0.5, 1]) {
      const post = handTop.clone().lerp(handBottom, t);
      stair.add(boxCenter([0.065, 0.93, 0.065], "darkGray", [post.x, post.y - 0.46, post.z], 0.009));
    }
  }
  if (detail === "near") {
    for (let step = 0; step < steps; step++) {
      stair.add(boxCenter([1.33, 0.115, 0.30], "gray", [0, 0.19 + (steps - step - 1) * rise, topZ + (step + 0.5) * going]));
    }
  } else {
    const incline = boxCenter([1.33, 0.12, Math.hypot(going * steps, rise * steps)], "gray",
      [0, surface / 2 + 0.03, (topZ + toeZ) / 2]);
    incline.rotation.x = Math.atan2(rise, going);
    stair.add(incline);
  }
  return stair;
}

export function registerLandingPad(registry: PieceRegistry): void {
  registry.register<{ detail: PadDetail }>("MI-07", {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, LANDING_PAD_LODS, "near") }),
    variants: { near: { detail: "near" } },
    metadata: { category: "largeFurniture", pivot: "base-center" },
    build: ({ detail }) => {
      const pad = new Group();
      pad.add(buildDeck(detail), buildSupport(detail), buildStair(detail));
      return alignBaseCenter(batchStatic(pad));
    },
  });
}
