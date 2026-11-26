import data from "../../palette.json";

export interface ColorObservation {
  hex: string | null;
  frame: string | null;
  region: readonly number[] | null;
}

export interface PaletteColor {
  id: string;
  role: string;
  observed: ColorObservation;
  base: string;
  baseReason: string;
  baseSample?: ColorObservation;
  usage: string;
  emissive: boolean;
  source: string;
}

const isHex = (value: unknown): value is string => typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function validObservation(value: ColorObservation | undefined, measured: boolean): boolean {
  if (!value || !(isHex(value.hex) || value.hex === null)) return false;
  if (!measured && value.frame === null && value.region === null) return true;
  return isHex(value.hex) && isText(value.frame) && Array.isArray(value.region) &&
    value.region.length === 4 && value.region.every(Number.isInteger) &&
    value.region.every((number, index) => number >= (index < 2 ? 0 : 1));
}

function saturation(hex: string): number {
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  return max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1));
}

function freezeObservation(value: ColorObservation): ColorObservation {
  return Object.freeze({ ...value, region: value.region ? Object.freeze([...value.region]) : null });
}

export function loadPalette(input: unknown): readonly PaletteColor[] {
  const document = input as { version?: number; colors?: PaletteColor[] } | null;
  if (document?.version !== 2 || !Array.isArray(document.colors) || !document.colors.length) {
    throw new Error("Invalid palette document");
  }
  const ids = new Set<string>();
  for (const color of document.colors) {
    if (!color || !isText(color.id) || ids.has(color.id) || !isHex(color.base) || !isText(color.baseReason) ||
      !isText(color.role) || !isText(color.usage) || typeof color.emissive !== "boolean" || !isText(color.source)) {
      throw new Error("Invalid or duplicate palette color");
    }
    if (!validObservation(color.observed, color.source === "measured") ||
      (color.baseSample !== undefined && !validObservation(color.baseSample, true))) {
      throw new Error(`Missing measurement provenance: ${color.id}`);
    }
    if (color.emissive && saturation(color.base) < 0.5) {
      throw new Error(`Emissive base saturation must be at least 0.5: ${color.id}`);
    }
    ids.add(color.id);
  }
  return Object.freeze(document.colors.map(color => Object.freeze({
    ...color, observed: freezeObservation(color.observed),
    ...(color.baseSample ? { baseSample: freezeObservation(color.baseSample) } : {}),
  })));
}

export const palette = loadPalette(data);
export const paletteById = new Map(palette.map(color => [color.id, color]));

export function paletteHex(id: string): string {
  const color = paletteById.get(id);
  if (!color) throw new Error(`Unknown palette color: ${id}`);
  return color.base;
}
