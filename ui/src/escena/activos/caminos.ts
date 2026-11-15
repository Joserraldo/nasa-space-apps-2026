/** Red adoquinada y balizas de Jezero (ESCENAS §3.2). */
import * as THREE from "three";
import { colorToken } from "../materiales";
import { BANCO, TERRENO } from "../mundo";

// ---------------------------------------------------------------------------------------------
// Caminos adoquinados, balizas, edificios y kit
// ---------------------------------------------------------------------------------------------

import { pavimento } from "./pavimento";

type P2 = readonly [number, number];

/** Plaza adoquinada alrededor de la mesa (claro central, ESCENAS §3.3). [E] */
export const PLAZA = { x: 0, z: 0.6, radio: 2.0 } as const;
/** Ancho del camino y lado de cada adoquín. [E] */
export const CAMINO = { ancho: 1.3 } as const;

/**
 * Red de caminos (ESCENAS §3.2): circuito A (oeste) `mesa → taller → panel_solar → escudo →
 * habitat → mesa`, circuito B (este) `mesa → sensor → invernadero → antena → mesa`, el reciclador
 * desde el hábitat, el atajo del banco y la entrada desde la cámara. Puntos `x, z` de juego; los
 * extremos son los puntos donde se para el jugador (`LUGARES`) y los codos esquivan los módulos.
 */
export const CAMINOS: readonly (readonly P2[])[] = [
  [[-2.2, 0.5], [-4, 0.1], [-8, -0.5]],
  [[-4, 0.1], [-2.9, -2.8], [-4.5, -5.3]],
  [[-4.5, -5.3], [-1.8, -4.6], [0, -4.3], [0, -2.2]],
  [[0, -4.3], [2.6, -4.4], [4.6, -4.2]],
  [[2.2, 0.6], [4.2, 0.9], [6.6, 0.9], [9, -0.4]],
  [[9, -0.4], [10.6, 2.0], [9.6, 4.4]],
  [[9.6, 4.4], [5.5, 4.0], [1.9, 2.5]],
  [[-1.9, 2.5], [-4.6, 4.4]],
  [[-0.5, 3.0], [-1.6, 6.5], [-2.4, 10]],
];

/** Distancia de un punto al eje de un segmento. */
export function distanciaTramo(x: number, z: number, a: P2, b: P2): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

export function sobreCamino(x: number, z: number, margen = 0): boolean {
  return CAMINOS.some(tramo => tramo.some((a, i) => i > 0 && distanciaTramo(x, z, tramo[i - 1]!, a) < CAMINO.ancho / 2 + margen));
}

/** Una sola unión de plaza, franjas y cruces. Ninguna losa queda encima de otra. */
export function geometriaCaminos(): THREE.BufferGeometry {
  const octogono = (x: number, z: number, r: number): P2[] =>
    Array.from({ length: 8 }, (_, i) => [x + Math.cos(Math.PI / 8 + i * Math.PI / 4) * r, z + Math.sin(Math.PI / 8 + i * Math.PI / 4) * r] as const);
  const huellas: P2[][] = [octogono(PLAZA.x, PLAZA.z, PLAZA.radio)];
  const nodos = new Set<string>();
  const r = CAMINO.ancho / 2;
  for (const tramo of CAMINOS) {
    for (const [x, z] of tramo) {
      const id = `${x},${z}`;
      if (!nodos.has(id)) huellas.push(octogono(x, z, r));
      nodos.add(id);
    }
    for (let i = 1; i < tramo.length; i++) {
      const a = tramo[i - 1]!, b = tramo[i]!;
      const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dx = -(b[1] - a[1]) / largo * r, dz = (b[0] - a[0]) / largo * r;
      huellas.push([[a[0] + dx, a[1] + dz], [b[0] + dx, b[1] + dz], [b[0] - dx, b[1] - dz], [a[0] - dx, a[1] - dz]]);
    }
  }
  return pavimento(huellas, colorToken("camino").lerp(colorToken("sombra-suelo"), 0.25));
}

/** Separación entre balizas a lo largo del camino y distancia al eje. [E] */
export const BALIZAS = { cada: 5, aparte: 1.1 } as const;

function chocaConBase(x: number, z: number, margen: number): boolean {
  if (TERRENO.circulos.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margen)) return true;
  if (TERRENO.capsulas.some((c) => x > c.x0 - c.r && x < c.x1 + c.r && Math.abs(z - c.z) < c.r + margen)) return true;
  if (x > BANCO.x0 - margen && x < BANCO.x1 + margen && z > BANCO.zBajo - margen && z < BANCO.zFondo + margen) return true;
  return Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.radio + margen;
}

/** Balizas a los lados de los caminos, alternando lado, sin caer sobre módulos ni la plaza. */
export function posicionesBalizas(): P2[] {
  const salida: P2[] = [];
  let lado = 1;
  for (const tramo of CAMINOS) {
    let recorrido = 0; // metros ya recorridos del tramo hasta el inicio del segmento
    let siguiente = BALIZAS.cada / 2;
    for (let k = 0; k < tramo.length - 1; k++) {
      const [x0, z0] = tramo[k]!, [x1, z1] = tramo[k + 1]!;
      const largo = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / largo, uz = (z1 - z0) / largo;
      for (; siguiente < recorrido + largo; siguiente += BALIZAS.cada) {
        const t = siguiente - recorrido;
        lado = -lado;
        const x = x0 + ux * t - uz * BALIZAS.aparte * lado, z = z0 + uz * t + ux * BALIZAS.aparte * lado;
        if (chocaConBase(x, z, 0.6) || sobreCamino(x, z, 0.25) || salida.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 2.0)) continue;
        salida.push([x, z]);
      }
      recorrido += largo;
    }
  }
  return salida;
}
