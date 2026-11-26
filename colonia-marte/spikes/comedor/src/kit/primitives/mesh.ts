import * as THREE from "three";
import { chamferBox } from "./geometry";
import { emissive, mat, type ColorKey, type EmissiveKey } from "../../materials/palette";

/** Chamfered box mesh positioned by its bottom-center (pivot on the floor). */
export function block(
  w: number, h: number, d: number,
  color: ColorKey,
  at: [number, number, number] = [0, 0, 0],
  chamfer = 0.03,
): THREE.Mesh {
  const m = new THREE.Mesh(chamferBox(w, h, d, chamfer), mat(color));
  m.position.set(at[0], at[1] + h / 2, at[2]);
  return m;
}

/** Emissive strip (LED). Pivot at its center. */
export function led(
  w: number, h: number, d: number,
  at: [number, number, number],
  key: EmissiveKey = "cyan",
  intensity = 3.2,
): THREE.Mesh {
  const m = new THREE.Mesh(chamferBox(w, h, d, Math.min(w, h, d) * 0.3), emissive(key, intensity));
  m.position.set(...at);
  return m;
}
