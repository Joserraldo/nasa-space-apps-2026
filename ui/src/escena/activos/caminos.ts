/** Red adoquinada y balizas de Jezero (ESCENAS §3.2). */
import * as THREE from "three";
import { colorToken } from "../materiales";
import { TERRENO } from "../mundo";

// ---------------------------------------------------------------------------------------------
// Caminos adoquinados, balizas, edificios y kit
// ---------------------------------------------------------------------------------------------

type P2 = readonly [number, number];

/** Plaza adoquinada alrededor de la mesa (claro central, ESCENAS §3.3). [E] */
export const PLAZA = { x: 0, z: 0.6, radio: 2.5 } as const;
/** Ancho del camino y lado de cada adoquín. [E] */
export const CAMINO = { ancho: 2.1, adoquin: 1.0, junta: 0.07 } as const;

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

/** Semilla decorativa de la variación de adoquines. */
const SEMILLA_CAMINO = 314;

function azarDecorativo(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Geometría de toda la red: adoquines en tronco de pirámide (tapa biselada), dos por fila, con
 * junta, color `camino` con leve variación hacia `lila`; losas octogonales en los cruces y la plaza.
 * Una sola malla (slot Rock, color de vértice): 1 draw call, sin sombra propia.
 */
export function geometriaCaminos(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const azar = azarDecorativo(SEMILLA_CAMINO);
  const base = colorToken("camino");
  const lila = colorToken("lila");
  const lado = colorToken("camino").lerp(colorToken("regolito-medio"), 0.35);
  const ct = new THREE.Color();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  /** Triángulo con la normal hacia `hacia` (o hacia +y si es null). */
  const tri = (p: number[], q: number[], r: number[], color: THREE.Color, centro: number[] | null) => {
    a.set(p[0]!, p[1]!, p[2]!); b.set(q[0]!, q[1]!, q[2]!); c.set(r[0]!, r[1]!, r[2]!);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const fuera = centro
      ? n.x * ((p[0]! + q[0]! + r[0]!) / 3 - centro[0]!) + n.z * ((p[2]! + q[2]! + r[2]!) / 3 - centro[2]!)
      : n.y;
    if (fuera < 0) pos.push(...p, ...r, ...q);
    else pos.push(...p, ...q, ...r);
    for (let k = 0; k < 3; k++) col.push(color.r, color.g, color.b);
  };
  /** Losa de contorno `anillo` (puntos x, z) con tapa biselada `bisel` hacia el centro. */
  const losa = (anillo: P2[], h: number, bisel: number) => {
    let cx = 0, cz = 0;
    for (const [x, z] of anillo) { cx += x; cz += z; }
    cx /= anillo.length; cz /= anillo.length;
    ct.copy(base).lerp(lila, azar() * 0.45).lerp(lado, azar() * 0.12);
    const arriba = anillo.map(([x, z]) => {
      const dx = cx - x, dz = cz - z, d = Math.hypot(dx, dz) || 1;
      return [x + (dx / d) * bisel, h, z + (dz / d) * bisel];
    });
    const abajo = anillo.map(([x, z]) => [x, 0, z]);
    for (let i = 1; i < arriba.length - 1; i++) tri(arriba[0]!, arriba[i]!, arriba[i + 1]!, ct, null);
    const centro = [cx, 0, cz];
    for (let i = 0; i < anillo.length; i++) {
      const j = (i + 1) % anillo.length;
      tri(abajo[i]!, abajo[j]!, arriba[j]!, lado, centro);
      tri(abajo[i]!, arriba[j]!, arriba[i]!, lado, centro);
    }
  };
  const octogono = (x: number, z: number, r: number, giro = Math.PI / 8): P2[] =>
    Array.from({ length: 8 }, (_, i) => [x + Math.cos(giro + (i * Math.PI) / 4) * r, z + Math.sin(giro + (i * Math.PI) / 4) * r] as const);

  // Plaza: rejilla de adoquines dentro del octógono, con un borde de losas.
  const { ancho, adoquin, junta } = CAMINO;
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++) {
      const x = PLAZA.x + i * adoquin, z = PLAZA.z + j * adoquin;
      const dx = Math.abs(i * adoquin), dz = Math.abs(j * adoquin);
      if (Math.max(dx, dz) > PLAZA.radio - 0.4 || dx + dz > PLAZA.radio * 1.25) continue;
      const s = (adoquin - junta) / 2;
      losa([[x - s, z - s], [x - s, z + s], [x + s, z + s], [x + s, z - s]], 0.035 + azar() * 0.012, 0.05);
    }
  // Tramos: dos adoquines por fila; losa octogonal en cada nodo.
  for (const tramo of CAMINOS) {
    for (const [x, z] of tramo) losa(octogono(x, z, ancho * 0.55), 0.03, 0.06);
    for (let k = 0; k < tramo.length - 1; k++) {
      const [x0, z0] = tramo[k]!, [x1, z1] = tramo[k + 1]!;
      const largo = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / largo, uz = (z1 - z0) / largo, vx = -uz, vz = ux;
      const filas = Math.max(1, Math.round(largo / adoquin));
      const paso = largo / filas;
      for (let f = 0; f < filas; f++) {
        const t = (f + 0.5) * paso;
        // Filas alternas desplazadas medio adoquín (aparejo), como en la lámina.
        const corte = f % 2 === 0 ? 0 : (azar() - 0.5) * 0.5;
        for (const [v0, v1] of [[-ancho / 2, corte], [corte, ancho / 2]] as const) {
          const l = paso / 2 - junta / 2, w0 = v0 + junta / 2, w1 = v1 - junta / 2;
          const cx = x0 + ux * t, cz = z0 + uz * t;
          const p = (du: number, dv: number): P2 => [cx + ux * du + vx * dv, cz + uz * du + vz * dv];
          losa([p(-l, w0), p(-l, w1), p(l, w1), p(l, w0)], 0.04 + azar() * 0.012, 0.045);
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Separación entre balizas a lo largo del camino y distancia al eje. [E] */
export const BALIZAS = { cada: 2.6, aparte: 1.55 } as const;

function chocaConBase(x: number, z: number, margen: number): boolean {
  if (TERRENO.circulos.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margen)) return true;
  if (TERRENO.capsulas.some((c) => x > c.x0 - c.r && x < c.x1 + c.r && Math.abs(z - c.z) < c.r + margen)) return true;
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
        if (chocaConBase(x, z, 0.6) || salida.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 2.0)) continue;
        salida.push([x, z]);
      }
      recorrido += largo;
    }
  }
  return salida;
}
