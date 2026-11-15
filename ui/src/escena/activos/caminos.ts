/** Red de caminos de losas, plaza de la mesa y balizas de Jezero (ESCENAS §3.2, lámina `mundo/01`). */
import * as THREE from "three";
import { colorToken } from "../materiales";
import { BANCO, LUGARES, TERRENO, lugar, type LugarId } from "../mundo";
import { MallaPavimento, barrer, dentroDe, type Franja, type PuntoPavimento } from "./pavimento";

type P2 = PuntoPavimento;

const MESA = lugar("mesa");
/** Plataforma pavimentada bajo la consola de la mesa (claro central, ESCENAS §3.3). [E] */
export const PLAZA = { x: MESA.mx, z: (MESA.mz + MESA.z) / 2 - 0.3, radio: 2.0 } as const;
/**
 * Medidas de las losas en metros. [E] `ancho`: losa de borde a borde (sin bordillo). `bordillo`:
 * banda más oscura a cada lado. `juntas`: separación entre juntas a lo largo del camino.
 * Alturas: la losa queda un poco por debajo del bordillo y la plaza es un escalón más alta.
 */
export const CAMINO = {
  ancho: 1.3,
  bordillo: 0.12,
  juntas: 1.3,
  altoLosa: 0.05,
  altoBordillo: 0.07,
  altoPlaza: 0.1,
  bordePlaza: 0.16,
} as const;

/** Punto donde se para el jugador en un lugar (`LUGARES`, mundo.ts). */
const en = (id: LugarId): P2 => [lugar(id).x, lugar(id).z];
/** Punto del borde de la plaza en dirección al lugar `id`: ahí arranca cada ramal. */
function plazaHacia(id: LugarId): P2 {
  const [x, z] = en(id);
  const d = Math.hypot(x - PLAZA.x, z - PLAZA.z);
  const k = (PLAZA.radio + 0.2) / d;
  return [PLAZA.x + (x - PLAZA.x) * k, PLAZA.z + (z - PLAZA.z) * k];
}

/**
 * Red de caminos de `mapa-base-jezero.svg` (ESCENAS §3.2), con extremos en los puestos de `LUGARES`:
 * anillo A (oeste) `mesa → taller → escudo → habitat → mesa` con `taller → panel_solar` (entre el
 * panel y el escudo están los cuatro soportes de paneles: no cabe un tramo recto); anillo B (este)
 * `mesa → sensor → reciclador_agua → invernadero → antena → mesa`, y un ramal corto al banco que
 * cuelga de la entrada desde la cámara. Los codos (únicos números a mano) dejan libres los sólidos
 * de `TERRENO` y las rocas de primer plano (`armado.ts`, con sus balizas):
 * - `taller → escudo` rodea por el este la consola del taller (−4,8; −1,4).
 * - `sensor → reciclador` rodea por el oeste la consola del sensor (4,8; −0,8).
 * - `reciclador → invernadero` pasa por el cuello entre esa consola y la cúpula (9; −5, r 3,85).
 * - `antena → plaza` esquiva por el norte la roca de (7,6; 2,4).
 */
export const CAMINOS: readonly (readonly P2[])[] = [
  [plazaHacia("taller"), en("taller"), [-5.0, 0.4], en("panel_solar")],
  [en("taller"), [-2.9, -1.2], en("escudo")],
  [en("escudo"), en("habitat"), plazaHacia("habitat")],
  [plazaHacia("sensor"), en("sensor")],
  [en("sensor"), [2.8, 0.0], en("reciclador_agua"), [4.2, -2.5], [5.72, -1.72], [6.5, -0.3], en("invernadero")],
  [en("invernadero"), [10.6, 2.0], en("antena")],
  [en("antena"), [5.5, 4.0], plazaHacia("antena")],
  [en("banco"), [-1.6, 6.5]],
  [[-0.5, 3.0], [-1.6, 6.5], [-2.4, 10]],
];

/** Distancia de un punto al eje de un segmento. */
export function distanciaTramo(x: number, z: number, a: P2, b: P2): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

/** (x, z) cae sobre la losa o el bordillo de algún camino, ampliado `margen`. */
export function sobreCamino(x: number, z: number, margen = 0): boolean {
  const r = CAMINO.ancho / 2 + CAMINO.bordillo + margen;
  return CAMINOS.some(tramo => tramo.some((a, i) => i > 0 && distanciaTramo(x, z, tramo[i - 1]!, a) < r));
}

// ---------------------------------------------------------------------------------------------
// Geometría: huellas convexas → barrido (pavimento.ts) → losas, bordillo, plaza y juntas
// ---------------------------------------------------------------------------------------------

const COS8 = Math.cos(Math.PI / 8);
const unitario = (a: P2, b: P2): P2 => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};
/** Octógono de apotema `ap` con dos caras perpendiculares a la dirección `u`. */
function octogono([x, z]: P2, ap: number, u: P2 = [1, 0]): P2[] {
  const g = Math.atan2(u[1], u[0]);
  return Array.from({ length: 8 }, (_, i) => {
    const t = g + Math.PI / 8 + i * Math.PI / 4;
    return [x + Math.cos(t) * ap / COS8, z + Math.sin(t) * ap / COS8] as const;
  });
}
/** Largo máximo del inglete de un codo, en semianchos: el del codo de coseno −0,4. */
const LIMITE_INGLETE = Math.sqrt(2 / 0.6);
const esLugar = ([x, z]: P2) => LUGARES.some(l => Math.abs(l.x - x) < 1e-9 && Math.abs(l.z - z) < 1e-9);

/**
 * Huellas convexas de toda la red con semiancho `w`: un rectángulo por tramo recto, una cuña a
 * inglete por fuera de cada codo (esquina limpia, sin redondeo) y un rellano octogonal en los
 * extremos y en los puestos de `LUGARES`, alineado con el camino que llega.
 */
function huellas(w: number): P2[][] {
  return huellasDe(CAMINOS, w);
}

/** `huellas` de una red cualquiera (así se prueba con codos sintéticos). */
export function huellasDe(red: readonly (readonly P2[])[], w: number): P2[][] {
  const salida: P2[][] = [];
  for (const tramo of red) {
    for (let i = 0; i < tramo.length; i++) {
      const v = tramo[i]!;
      const u = i > 0 ? unitario(tramo[i - 1]!, v) : unitario(v, tramo[1]!);
      if (i > 0) {
        const a = tramo[i - 1]!;
        salida.push([[a[0] - u[1] * w, a[1] + u[0] * w], [v[0] - u[1] * w, v[1] + u[0] * w], [v[0] + u[1] * w, v[1] - u[0] * w], [a[0] + u[1] * w, a[1] - u[0] * w]]);
      }
      if (i === 0 || i === tramo.length - 1 || esLugar(v)) {
        salida.push(octogono(v, w, u));
        continue;
      }
      const u2 = unitario(v, tramo[i + 1]!);
      const coseno = u[0] * u2[0] + u[1] * u2[1];
      // Lado de fuera del codo: el siguiente tramo se aleja de él.
      const s = -u[1] * u2[0] + u[0] * u2[1] > 0 ? 1 : -1;
      const n1: P2 = [u[1] * s * w, -u[0] * s * w], n2: P2 = [u2[1] * s * w, -u2[0] * s * w];
      const a1: P2 = [v[0] + n1[0], v[1] + n1[1]], a2: P2 = [v[0] + n2[0], v[1] + n2[1]];
      if (coseno >= -0.4) {
        const k = 1 / (1 + coseno);
        salida.push([v, a1, [v[0] + (n1[0] + n2[0]) * k, v[1] + (n1[1] + n2[1]) * k], a2]);
        continue;
      }
      // Codo muy cerrado: el inglete se dispara, así que se corta a `LIMITE_INGLETE`·w del vértice
      // con un plano perpendicular a la bisectriz (inglete limitado). La cuña queda convexa y sin hueco.
      const sum = Math.hypot(n1[0] + n2[0], n1[1] + n2[1]);
      const d: P2 = sum > 1e-6 ? [(n1[0] + n2[0]) / sum, (n1[1] + n2[1]) / sum] : u;
      const ud = Math.max(u[0] * d[0] + u[1] * d[1], 0.05);
      const t = (LIMITE_INGLETE * w - (n1[0] * d[0] + n1[1] * d[1])) / ud;
      salida.push([v, a1, [a1[0] + u[0] * t, a1[1] + u[1] * t], [a2[0] - u2[0] * t, a2[1] - u2[1] * t], a2]);
    }
  }
  return salida;
}

/** Tramos rectos sin repetir (dos anillos pueden compartir uno). */
function segmentos(): [P2, P2][] {
  const vistos = new Set<string>();
  const salida: [P2, P2][] = [];
  for (const tramo of CAMINOS)
    for (let i = 1; i < tramo.length; i++) {
      const a = tramo[i - 1]!, b = tramo[i]!;
      const clave = [a.join(","), b.join(",")].sort().join("|");
      if (!vistos.has(clave)) salida.push([a, b]);
      vistos.add(clave);
    }
  return salida;
}

/** Plaza: octógono de apotema `ap` con caras alineadas a los ejes. */
const plaza = (ap: number) => octogono([PLAZA.x, PLAZA.z], ap);

/**
 * Juntas entre losas: franjas finas transversales cada `CAMINO.juntas`, 4 mm sobre la losa (nunca
 * coplanares). Solo en tramo libre: lejos de codos, cruces, rellanos y plaza, y con las cuatro
 * esquinas dentro de la losa (`losas`), para que ninguna quede encima de otra ni asome fuera.
 */
function juntas(m: MallaPavimento, color: THREE.Color, losas: readonly Franja[]): void {
  const r = CAMINO.ancho / 2, ancho = 0.04, y = CAMINO.altoLosa + 0.004;
  const arriba = new THREE.Vector3(0, 1, 0);
  const segs = segmentos();
  const libre = (x: number, z: number, propio: number) =>
    Math.hypot(x - PLAZA.x, z - PLAZA.z) > PLAZA.radio / COS8 + 0.1
    && segs.every(([a, b], k) => k === propio || distanciaTramo(x, z, a, b) > r + CAMINO.bordillo + 0.05);
  segs.forEach(([a, b], k) => {
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u = unitario(a, b), n: P2 = [-u[1] * r, u[0] * r];
    const pasos = Math.floor(largo / CAMINO.juntas);
    const inicio = (largo - pasos * CAMINO.juntas) / 2;
    for (let j = 0; j <= pasos; j++) {
      const t = inicio + j * CAMINO.juntas;
      if (t < r / COS8 + 0.15 || t > largo - r / COS8 - 0.15) continue;
      const c: P2 = [a[0] + u[0] * t, a[1] + u[1] * t];
      const extremos = [-1, 0, 1].map(s => [c[0] + n[0] * s, c[1] + n[1] * s] as const);
      if (!extremos.every(([x, z]) => libre(x, z, k))) continue;
      const p = (s: number, d: number) => new THREE.Vector3(c[0] + n[0] * s + u[0] * d, y, c[1] + n[1] * s + u[1] * d);
      // Sus cuatro esquinas caen dentro de la losa real (unión de huellas menos la plaza).
      if (![-1, 1].every(s => [-ancho / 2, ancho / 2].every(d => { const q = p(s, d); return dentroDe(losas, q.x, q.z); }))) continue;
      m.cuadro(p(-1, -ancho / 2), p(1, -ancho / 2), p(1, ancho / 2), p(-1, ancho / 2), color, arriba);
    }
  });
  // Plaza: dos juntas en cruz a cada lado de la consola, recortadas al octógono interior.
  const ap = PLAZA.radio - CAMINO.bordePlaza, yp = CAMINO.altoPlaza + 0.004;
  for (const c of [-0.75, 0.75]) {
    const h = Math.min(ap, ap * Math.SQRT2 - Math.abs(c) - ancho);
    const v = (x: number, z: number) => new THREE.Vector3(PLAZA.x + x, yp, PLAZA.z + z);
    m.cuadro(v(c - ancho / 2, -h), v(c + ancho / 2, -h), v(c + ancho / 2, h), v(c - ancho / 2, h), color, arriba);
    m.cuadro(v(-h, c - ancho / 2), v(h, c - ancho / 2), v(h, c + ancho / 2), v(-h, c + ancho / 2), color, arriba);
  }
}

/**
 * Losas marfil con bordillo, plaza y juntas en una sola geometría (material `Rock`, color de
 * vértice): un draw call. Todo sale de barridos de unión, así los tramos que se cruzan forman una
 * única superficie y ninguna cara queda superpuesta a otra a la misma altura:
 * - losa: unión de huellas de semiancho r, menos la plaza, a `altoLosa`;
 * - bordillo: (huellas r + bordillo) − (huellas r) − plaza, a `altoBordillo`, con su cara exterior
 *   hasta el suelo y el escalón interior hasta la losa;
 * - plaza: octógono más alto, con un marco más oscuro y su pared exterior.
 */
export function geometriaCaminos(): THREE.BufferGeometry {
  const r = CAMINO.ancho / 2, rb = r + CAMINO.bordillo;
  // Colores solo de tokens: losa marfil arena, bordillo y juntas hacia el regolito, cara lateral más oscura.
  const marfil = colorToken("traje-marfil");
  const losa = marfil.clone().lerp(colorToken("sombra-suelo"), 0.4);
  const borde = marfil.clone().lerp(colorToken("regolito-medio"), 0.45);
  const lateral = marfil.clone().lerp(colorToken("regolito-medio"), 0.7);
  const junta = marfil.clone().lerp(colorToken("regolito-medio"), 0.35);

  const m = new MallaPavimento();
  const sinPlaza = [plaza(PLAZA.radio)];
  const exterior = huellas(rb), interior = huellas(r);
  const losas = barrer(interior, sinPlaza);
  m.caras(losas, CAMINO.altoLosa, losa);
  // El escalón no se emite en el contorno de la plaza (ya lo cubre su pared exterior, coplanar):
  // para esta pasada el hueco es 1 cm más pequeño y su contorno queda oculto dentro de la plaza.
  m.paredes(barrer(interior, [plaza(PLAZA.radio - 0.01)]), CAMINO.altoLosa, CAMINO.altoBordillo, borde, true);
  m.caras(barrer(exterior, [...interior, ...sinPlaza]), CAMINO.altoBordillo, borde);
  m.paredes(barrer(exterior, sinPlaza), -0.02, CAMINO.altoBordillo, lateral);

  const centro = [plaza(PLAZA.radio - CAMINO.bordePlaza)];
  m.caras(barrer(centro, [], sinPlaza), CAMINO.altoPlaza, losa); // mismas guías que el marco: sin grietas en T
  m.caras(barrer(sinPlaza, centro), CAMINO.altoPlaza, borde);
  m.paredes(barrer(sinPlaza), -0.02, CAMINO.altoPlaza, lateral);
  juntas(m, junta, losas);
  return m.geometria();
}

// ---------------------------------------------------------------------------------------------
// Balizas
// ---------------------------------------------------------------------------------------------

/** Separación entre balizas a lo largo del camino y distancia al eje. [E] */
export const BALIZAS = { cada: 5, aparte: 1.1 } as const;

/** Choca con un sólido de `TERRENO`, el banco o la plaza (con `margen`). */
export function chocaConBase(x: number, z: number, margen: number): boolean {
  if (TERRENO.circulos.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margen)) return true;
  if (TERRENO.capsulas.some((c) => x > c.x0 - c.r && x < c.x1 + c.r && Math.abs(z - c.z) < c.r + margen)) return true;
  if (x > BANCO.x0 - margen && x < BANCO.x1 + margen && z > BANCO.zBajo - margen && z < BANCO.zFondo + margen) return true;
  return Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.radio + margen;
}

/** Balizas a los lados de los caminos, alternando lado, sin caer sobre módulos ni la plaza. */
export function posicionesBalizas(): P2[] {
  const salida: P2[] = [];
  for (const tramo of CAMINOS) {
    let lado = 1; // alterna dentro de cada tramo: añadir o quitar uno no mueve las balizas de los demás
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
