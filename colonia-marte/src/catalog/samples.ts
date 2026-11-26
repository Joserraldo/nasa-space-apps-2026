import type { BufferGeometry } from "three";
import {
  chamferBox, extrudeProfile, panelInset, ledStrip, pipeRun, truncatedIcosa, geodesicHalf, chamferRect,
} from "../kit/primitives";

export const primitiveSamples: Record<string, () => BufferGeometry> = {
  chamferBox: () => chamferBox(1, 0.8, 0.6, 0.04),
  extrudeProfile: () => extrudeProfile(chamferRect(1, 0.8, 0.12), 0.2, 0.02),
  panelInset: () => panelInset(),
  ledStrip: () => ledStrip(),
  pipeRun: () => pipeRun([[0, 0, 0], [0, 0.5, 0], [0.4, 0.8, 0]]),
  truncatedIcosa: () => truncatedIcosa(),
  geodesicHalf: () => geodesicHalf(),
};
