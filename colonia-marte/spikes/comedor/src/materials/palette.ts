import * as THREE from "three";

/**
 * Single source of colors for the spike. Values estimated from the reference
 * frames (docs/referencias/v2/v2-t017.10.jpg); to be measured in WS1.
 * The spike shares one material per color instead of the final palette atlas.
 */
export const PALETTE = {
  white: "#DDE2E7",
  offWhite: "#C3CAD2",
  gray: "#9AA3AD",
  darkGray: "#4A525C",
  black: "#22262D",
  blue: "#1F6FB0",
  plantDark: "#2F7D3A",
  plantLight: "#5DBB4C",
  soil: "#3A2E26",
} as const;

export const EMISSIVE = {
  cyan: "#3FD8FF",
  warmWhite: "#FFF4E0",
  white: "#F4FAFF",
} as const;

export type ColorKey = keyof typeof PALETTE;
export type EmissiveKey = keyof typeof EMISSIVE;

const solid = new Map<string, THREE.MeshStandardMaterial>();
const glow = new Map<string, THREE.MeshStandardMaterial>();

export function mat(key: ColorKey): THREE.MeshStandardMaterial {
  let m = solid.get(key);
  if (!m) {
    const glossy = key === "white" || key === "offWhite";
    m = new THREE.MeshStandardMaterial({
      color: PALETTE[key],
      roughness: glossy ? 0.42 : 0.6,
      metalness: 0.0,
    });
    m.name = `M_palette_${key}`;
    solid.set(key, m);
  }
  return m;
}

/** Emissive strips; intensity above 1 so bloom picks them up. */
export function emissive(key: EmissiveKey, intensity = 3.2): THREE.MeshStandardMaterial {
  const id = `${key}_${intensity}`;
  let m = glow.get(id);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: "#000000",
      emissive: EMISSIVE[key],
      emissiveIntensity: intensity,
      roughness: 1,
    });
    m.name = `M_palette_glow_${key}`;
    glow.set(id, m);
  }
  return m;
}

export function materialCount(): number {
  return solid.size + glow.size;
}
