import data from "../../data/environments.json";
import { paletteHex } from "../materials/palette";

export interface EnvironmentPreset {
  id: string; name: string; context: "space" | "interior" | "exterior";
  light: { sun: string; intensity: number; height: number; ambient: number; ground: string; sky?: string };
  sky: { zenith: string; horizon: string; halo: string; size: number; stars: number; earth: number };
  fog: { color: string; near: number; far: number };
  post: { exposure: number; bloom: number; ao: number };
  shadows: boolean;
}

/** Validate at the data boundary, before mutating the live renderer. */
export function loadPresets(input: unknown): readonly EnvironmentPreset[] {
  const doc = input as typeof data;
  if (doc?.version !== 1 || !Array.isArray(doc.presets) || doc.presets.length !== 8) {
    throw new Error("Expected eight environment presets");
  }
  const ids = new Set<string>();
  for (const p of doc.presets) {
    if (!p || !/^AMB-0[1-8]$/.test(p.id) || ids.has(p.id) || !p.name?.trim() ||
      !["space", "interior", "exterior"].includes(p.context) || typeof p.shadows !== "boolean" ||
      !p.light || !p.sky || !p.fog || !p.post) throw new Error("Invalid environment preset");
    ids.add(p.id);
    const numbers = [p.light.intensity, p.light.height, p.light.ambient, p.sky.size, p.sky.stars, p.sky.earth,
      p.fog.near, p.fog.far, p.post.exposure, p.post.bloom, p.post.ao];
    if (!numbers.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0) ||
      p.fog.far <= p.fog.near || p.post.exposure <= 0 || p.sky.size <= 0 || p.sky.size > 1 ||
      p.light.height > 1 || ![0, 1].includes(p.sky.stars) || ![0, 1].includes(p.sky.earth)) {
      throw new Error(`Invalid preset range: ${p.id}`);
    }
    [p.light.sun, p.light.ground, p.sky.zenith, p.sky.horizon, p.sky.halo, p.fog.color].forEach(paletteHex);
    if ("sky" in p.light) paletteHex(p.light.sky as string);
  }
  return Object.freeze(doc.presets.map(p => Object.freeze({
    ...p, light: Object.freeze({ ...p.light }), sky: Object.freeze({ ...p.sky }),
    fog: Object.freeze({ ...p.fog }), post: Object.freeze({ ...p.post }),
  }))) as readonly EnvironmentPreset[];
}
export const presets = loadPresets(data);
