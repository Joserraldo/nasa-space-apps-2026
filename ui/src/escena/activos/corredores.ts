/** Corredores de vidrio entre edificios vecinos (`exterior/01`, `exterior/03`). */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { colorToken } from "../materiales";
import { caja, grupo, parte, tronco } from "./piezasComunes";

/** Vidrio teal-cian translúcido (lámina `exterior/03`): clon del slot `Glass` con el token `cian`, uno por juego de materiales. */
const vidrios = new WeakMap<Materiales, THREE.Material>();
function vidrioTeal(m: Materiales): THREE.Material {
  let v = vidrios.get(m);
  if (!v) {
    const c = m.Glass.clone();
    c.color = colorToken("cian").lerp(colorToken("teal"), 0.4);
    c.emissive = c.color.clone();
    c.emissiveIntensity = 0.45;
    c.opacity = 0.55;
    c.name = "Corridor_Glass";
    vidrios.set(m, c);
    v = c;
  }
  return v;
}

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
    rot(parte(m, "Glass", tronco(1.0, 1.0, largo - 0.2, 8), [0, 1.1, 0], "Corridor_Glass")),
    parte(m, "Emissive", caja(0.34, 0.06, largo - 0.2), [0, 2.12, 0], "Corridor_Roof"),
    parte(m, "SuitBase", caja(1.5, 0.12, largo), [0, 0.06, 0], "Corridor_Floor"),
  ];
  // Zócalo rosa a cada lado (lámina 01: faldón bajo con ranuras) y junta ancha con cada edificio (lámina 03).
  for (const s of [-1, 1]) {
    partes.push(parte(m, "SuitBase", caja(0.3, 0.5, largo - 0.1), [s * 0.95, 0.35, 0], "Corridor_Skirt"));
    partes.push(parte(m, "Accent", caja(0.05, 0.08, largo - 0.4), [s * 1.12, 0.45, 0], "Corridor_SkirtBand"));
    partes.push(rot(parte(m, "SuitBase", tronco(1.38, 1.38, 0.34, 8), [0, 1.1, s * (largo / 2 - 0.05)], "Corridor_Joint")));
  }
  const n = Math.max(1, Math.round(largo / 1.2));
  for (let i = 0; i <= n; i++) {
    const z = -largo / 2 + (i * largo) / n;
    partes.push(rot(parte(m, "SuitBase", tronco(1.16, 1.16, 0.22, 8), [0, 1.1, z], "Corridor_Frame")));
  }
  const vidrio = vidrioTeal(m);
  for (const o of partes) if (o.name === "Corridor_Glass") (o as THREE.Mesh).material = vidrio;
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
