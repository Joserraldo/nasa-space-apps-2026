/** Corredores de vidrio entre edificios vecinos (`exterior/01`, `exterior/03`). */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { caja, grupo, parte, tronco } from "./piezasComunes";

/**
 * Corredor de `largo` m a lo largo de z: tubo octogonal bajo con marcos cada ~1,2 m, vidrio, tira
 * en el techo y ventanas cian grandes a los lados.
 */
export function crearCorredor(m: Materiales, largo: number): THREE.Group {
  const rot = (o: THREE.Object3D) => {
    o.rotation.x = Math.PI / 2;
    return o;
  };
  const partes: THREE.Object3D[] = [
    rot(parte(m, "SuitBase", tronco(0.98, 0.98, largo, 8), [0, 1.1, 0], "Corridor_Tube")),
    rot(parte(m, "Glass", tronco(1.02, 1.02, largo - 0.3, 8), [0, 1.1, 0], "Corridor_Glass")),
    parte(m, "Accent", caja(0.2, 0.06, largo - 0.2), [0, 2.1, 0], "Corridor_Roof"),
    parte(m, "SuitBase", caja(1.5, 0.12, largo), [0, 0.06, 0], "Corridor_Floor"),
  ];
  const n = Math.max(1, Math.round(largo / 1.2));
  for (let i = 0; i <= n; i++) {
    const z = -largo / 2 + (i * largo) / n;
    partes.push(rot(parte(m, "SuitBase", tronco(1.2, 1.2, 0.2, 8), [0, 1.1, z], "Corridor_Frame")));
    if (i < n) {
      const zc = z + largo / n / 2, w = largo / n - 0.45;
      for (const s of [-1, 1]) {
        partes.push(parte(m, "Emissive", caja(0.04, 0.6, w), [s * 1.0, 1.3, zc], "Corridor_Window"));
      }
    }
  }
  return grupo("Building_Corridor", ...partes);
}

/** Posición, giro y largo de un corredor de borde a borde entre dos huellas circulares (null si no hay hueco). */
export function corredorEntre(
  a: { x: number; z: number; radio: number },
  b: { x: number; z: number; radio: number },
): { x: number; z: number; giro: number; largo: number } | null {
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  const largo = d - a.radio - b.radio + 0.5;
  if (largo < 1) return null;
  const ux = dx / d, uz = dz / d, c = (a.radio - 0.25 + d - b.radio + 0.25) / 2;
  return { x: a.x + ux * c, z: a.z + uz * c, giro: Math.atan2(ux, uz), largo };
}
