import { paletteHex } from "./palette";
import { materials } from "./shared";

/** Compatibility boundary: existing pieces use the single WS1 atlas material unchanged. */
export const previewColors = Object.fromEntries([
  "white", "offWhite", "gray", "darkGray", "black", "blue", "cyan",
].map(id => [id, paletteHex(id)]));
export type PreviewColor = "white" | "offWhite" | "gray" | "darkGray" | "black" | "blue" | "cyan";
export const previewOpaque = materials.M_palette;
export const previewGlow = materials.M_palette;
export { coloredGeometry } from "./uv";
