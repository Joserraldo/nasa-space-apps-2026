/** Plataforma de aterrizaje octogonal con escalones y nave low poly (`exterior/03`, arriba a la izquierda). */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";

function girada(o: THREE.Object3D, rx: number, ry: number, rz: number): THREE.Object3D {
  o.rotation.set(rx, ry, rz);
  return o;
}

/** Nave pequeña de alas en flecha, mirando a +z: casco, nariz, cabina de vidrio, deriva, dos motores y tres patas. */
export function crearNave(m: Materiales): THREE.Group {
  const partes: THREE.Object3D[] = [
    parte(m, "SuitBase", chaflan(1.4, 1.0, 2.9, 0.4), [0, 0, 0], "Ship_Hull"),
    girada(parte(m, "SuitBase", tronco(0.12, 0.55, 1.0, 8), [0, 0, 1.9], "Ship_Nose"), Math.PI / 2, 0, 0),
    parte(m, "Glass", chaflan(0.9, 0.45, 1.1, 0.2), [0, 0.5, 0.9], "Ship_Canopy"),
    parte(m, "Accent", caja(0.9, 0.05, 0.9), [0, 0.52, -0.5], "Ship_Spine"),
    parte(m, "SuitBase", caja(0.16, 0.9, 0.9), [0, 0.8, -1.2], "Ship_Fin"),
    parte(m, "Emissive", caja(0.8, 0.1, 0.04), [0, 0.05, 1.46], "Ship_Light"),
  ];
  for (const s of [-1, 1]) {
    // Ala en flecha: se retrasa hacia la punta.
    const ala = parte(m, "SuitBase", chaflan(1.9, 0.14, 1.3, 0.25), [s * 1.5, -0.15, -0.5], "Ship_Wing");
    ala.rotation.y = s * 0.3;
    partes.push(ala);
    partes.push(girada(parte(m, "SuitBase", tronco(0.3, 0.38, 1.3, 8), [s * 0.95, -0.1, -1.55], "Ship_Engine"), Math.PI / 2, 0, 0));
    partes.push(girada(parte(m, "Emissive", tronco(0.2, 0.2, 0.06, 8), [s * 0.95, -0.1, -2.22], "Ship_Glow"), Math.PI / 2, 0, 0));
    partes.push(parte(m, "Accent", caja(1.2, 0.05, 0.22), [s * 1.65, -0.07, -0.4], "Ship_Stripe"));
  }
  for (const [dx, dz] of [[-0.8, -0.6], [0.8, -0.6], [0, 1.0]] as const) {
    partes.push(parte(m, "Boots", caja(0.14, 0.9, 0.14), [dx, -0.75, dz], "Ship_Leg"));
    partes.push(parte(m, "SuitBase", tronco(0.22, 0.26, 0.08, 6), [dx, -1.2, dz], "Ship_Foot"));
  }
  return grupo("Ship", ...partes);
}

/**
 * Plataforma octogonal de dos niveles con cenefa, marca de aterrizaje, balizas en los vértices,
 * escalones al frente (+z) y la nave encima. Radio exterior 3,6 m.
 */
export function crearPlataformaNave(m: Materiales): THREE.Group {
  const partes: THREE.Object3D[] = [
    parte(m, "SuitBase", tronco(3.3, 3.6, 0.5, 8), [0, 0.25, 0], "Pad_Deck"),
    parte(m, "Accent", tronco(3.32, 3.32, 0.1, 8), [0, 0.42, 0], "Pad_Band"),
    parte(m, "SuitBase", tronco(2.7, 2.95, 0.22, 8), [0, 0.61, 0], "Pad_Upper"),
    parte(m, "Boots", tronco(2.2, 2.2, 0.04, 8), [0, 0.74, 0], "Pad_Surface"),
    // Marca de aterrizaje: cruz clara sobre la losa.
    parte(m, "Accent", caja(3.0, 0.03, 0.16), [0, 0.77, 0], "Pad_MarkA"),
    parte(m, "Accent", caja(0.16, 0.03, 3.0), [0, 0.77, 0], "Pad_MarkB"),
  ];
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    partes.push(parte(m, "Emissive", caja(0.18, 0.14, 0.18), [Math.sin(a) * 3.28, 0.55, Math.cos(a) * 3.28], "Pad_Light"));
  }
  // Escalones al frente: tres peldaños que suben hacia la plataforma.
  for (let i = 0; i < 3; i++) {
    partes.push(parte(m, "SuitBase", caja(1.8 - i * 0.1, 0.17, 0.5), [0, 0.085 + i * 0.17, 3.95 - i * 0.45], "Pad_Step"));
  }
  partes.push(parte(m, "Emissive", caja(1.6, 0.04, 0.05), [0, 0.2, 4.22], "Pad_StepLight"));
  const nave = crearNave(m);
  nave.position.set(0, 2.1, -0.3);
  partes.push(nave);
  return grupo("Building_LandingPad", ...partes);
}
