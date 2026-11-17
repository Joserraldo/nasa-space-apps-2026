/** Red de caminos de losas, plaza de la mesa y balizas de Jezero (ESCENAS §3.2, lámina `mundo/01`). */
import * as THREE from "three";
import { colorToken } from "../materiales";
import { BANCO, LUGARES, TERRENO, lugar, type LugarId } from "../mundo";
import { MallaPavimento, barrer, dentroDe, type Franja, type PuntoPavimento } from "./pavimento";
import { POS_ESTACIONES } from "./estaciones";

type P2 = PuntoPavimento;

const MESA = lugar("mesa");
/**
 * Plataforma baja de losas bajo la consola de la mesa y el equipo solar (dos paneles a su derecha,
 * `mundo/01`). Rectángulo alineado con los ejes, como la consola (giro 0): `x0..x1` × `z0..z1`. [E]
 */
export const PLAZA = { x0: MESA.mx - 1.4, x1: MESA.mx + 4.3, z0: MESA.mz - 1.2, z1: MESA.z + 0.3, x: MESA.mx + 1.0, z: (MESA.mz - 1.2 + MESA.z + 0.4) / 2 } as const;
/** Distancia de un punto al rectángulo de la plataforma (0 dentro). */
export const distanciaPlaza = (x: number, z: number) => Math.hypot(Math.max(PLAZA.x0 - x, 0, x - PLAZA.x1), Math.max(PLAZA.z0 - z, 0, z - PLAZA.z1));
/**
 * Medidas de las losas en metros. [E] `ancho`: losa de borde a borde (sin bordillo). `bordillo`:
 * banda más oscura a cada lado. `juntas`: separación entre juntas a lo largo del camino.
 * Alturas: la losa queda un poco por debajo del bordillo y la plaza es un escalón más alta.
 */
export const CAMINO = {
  ancho: 0.95,
  /** Camino ancho del jugador (primer plano a consola), `mundo/01`: losa de borde a borde. */
  anchoTroncal: 1.5,
  bordillo: 0.08,
  juntas: 1.0,
  altoLosa: 0.05,
  altoBordillo: 0.07,
  altoPlaza: 0.1,
  bordePlaza: 0.12,
} as const;

/** Punto donde se para el jugador en un lugar (`LUGARES`, mundo.ts). */
const en = (id: LugarId): P2 => [lugar(id).x, lugar(id).z];
/** Punto 0,2 m fuera del borde de la plataforma, en dirección al lugar `id`: ahí arranca cada ramal. */
function plazaHacia(id: LugarId): P2 {
  const [x, z] = en(id);
  const dx = x - PLAZA.x, dz = z - PLAZA.z, d = Math.hypot(dx, dz);
  const salida = Math.min((PLAZA.x1 - PLAZA.x) / Math.abs(dx || 1e-9), (PLAZA.z1 - PLAZA.z) / Math.abs(dz || 1e-9));
  const k = salida + 0.2 / d;
  return [PLAZA.x + dx * k, PLAZA.z + dz * k];
}

/**
 * Camino ancho (`mundo/01`): desde el primer plano, entre las dos rocas grandes de abajo, hasta la
 * plataforma de la consola de la mesa, de donde salen los anillos A y B. Una sola cinta continua;
 * el ramal del banco se une a ella en su codo (-1,6; 6,5).
 */
/** Camino ancho (`mundo/01`): del primer plano a la plataforma de la consola de la mesa, de donde salen los anillos A y B. */
export const TRONCAL: readonly (readonly P2[])[] = [
  [[-2.4, 11.0], [-1.6, 6.5], [-0.45, 3.9], [-0.45, PLAZA.z1 + 0.2]],
  // Ramal ancho del anillo al pie de la torre de control.
  [[-9.6, -11.9], [-11.5, -16.6]],
];
/**
 * Anillo EXTERIOR continuo (`exterior/03`): rodea toda la base por dentro del círculo caminable,
 * delante de la torre, las cúpulas y las plataformas del decorado (que están fuera). Cerrado: el
 * último punto repite el primero. Sus codos dejan libres los sólidos de `TERRENO`, el banco y la antena. [E]
 */
export const ANILLO: readonly P2[] = [
  [0, -12.9], [5.5, -12.6], [10.8, -11.4], [13.4, -8.2], [14.5, -3.6], [14.9, 1.6], [14.6, 6.4], [11.8, 9.9], [6, 11.0],
  [-2.4, 11.0], [-11.6, 8.6], [-13.6, 3.6], [-13.2, -0.5], [-13.4, -5.0], [-12.6, -9.0], [-9.6, -11.9], [-5, -12.9], [0, -12.9],
];
/**
 * Ramales de la colonia (lámina `04_Organizacion/01_distribucion_exterior`): del anillo a los edificios
 * del borde, para que ninguno quede suelto en el regolito. Terminan a unos pasos de cada edificio, fuera
 * de su huella; la parte que pasa el límite caminable (20 m) es solo decorado. [E]
 * - Nave: del codo oeste a la escalera de la plataforma.
 * - Refugio: del codo suroeste a su puerta.
 * - Cúpulas del invernadero: del codo noreste, por fuera del laboratorio y de su tubo de vidrio.
 * - Paneles: del codo noroeste al campo de energía.
 */
export const RAMALES: readonly (readonly P2[])[] = [
  [[-13.4, -5.0], [-19.2, -6.2]],
  [[-11.6, 8.6], [-15.3, 13.1]],
  [[10.8, -11.4], [10.6, -22.4]],
  [[13.4, -8.2], [19.6, -19.4]],
  [[-12.6, -9.0], [-18.0, -14.1]],
];
/** Semiancho extra del camino ancho respecto de los demás. */
const EXTRA_TRONCAL = (CAMINO.anchoTroncal - CAMINO.ancho) / 2;
const semianchoDe = (tramo: readonly P2[]) => CAMINO.ancho / 2 + (TRONCAL.includes(tramo) ? EXTRA_TRONCAL : 0);

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
 * - `antena → plaza` sube por el norte y deja libre la esquina inferior derecha del encuadre para una roca grande.
 */
export const CAMINOS: readonly (readonly P2[])[] = [
  [en("taller"), [-2.9, -1.2], en("escudo")],
  [en("escudo"), en("habitat"), plazaHacia("habitat")],
  [plazaHacia("sensor"), en("sensor")],
  [en("sensor"), [2.8, 0.0], en("reciclador_agua"), [4.2, -2.5], [5.72, -1.72], [6.5, -0.3], en("invernadero")],
  [en("invernadero"), [10.6, 2.0], en("antena")],
  [en("antena"), [8.4, 1.8], plazaHacia("antena")],
  [en("banco"), [-1.6, 6.5]],
  [en("invernadero"), [12.4, 0.9], [14.9, 1.6]],
  // De la consola a la torre: por el taller y el panel solar hasta el anillo (estrecho: entre la roca y la consola del taller).
  [plazaHacia("taller"), en("taller"), [-5.0, 0.4], en("panel_solar"), [-13.2, -0.5]],
  ANILLO,
  ...TRONCAL,
  ...RAMALES,
];

/** Distancia de un punto al eje de un segmento. */
export function distanciaTramo(x: number, z: number, a: P2, b: P2): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

/** (x, z) cae sobre la losa o el bordillo de algún camino, ampliado `margen`. */
export function sobreCamino(x: number, z: number, margen = 0): boolean {
  return CAMINOS.some(tramo => {
    const r = semianchoDe(tramo) + CAMINO.bordillo + margen;
    return tramo.some((a, i) => i > 0 && distanciaTramo(x, z, tramo[i - 1]!, a) < r);
  });
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
export function huellasDe(red: readonly (readonly P2[])[], base: number): P2[][] {
  const salida: P2[][] = [];
  for (const tramo of red) {
    const w = base + (TRONCAL.includes(tramo) ? EXTRA_TRONCAL : 0);
    const n = tramo.length;
    const cerrado = n > 3 && tramo[0]![0] === tramo[n - 1]![0] && tramo[0]![1] === tramo[n - 1]![1] && !esLugar(tramo[0]!);
    for (let i = 0; i < n; i++) {
      const v = tramo[i]!;
      const u = i > 0 ? unitario(tramo[i - 1]!, v) : unitario(cerrado ? tramo[n - 2]! : v, cerrado ? v : tramo[1]!);
      if (i > 0) {
        const a = tramo[i - 1]!;
        salida.push([[a[0] - u[1] * w, a[1] + u[0] * w], [v[0] - u[1] * w, v[1] + u[0] * w], [v[0] + u[1] * w, v[1] - u[0] * w], [a[0] + u[1] * w, a[1] - u[0] * w]]);
      }
      if (cerrado && i === n - 1) continue; // repite el vértice 0: su codo ya se hizo
      if ((!cerrado && (i === 0 || i === n - 1)) || esLugar(v)) {
        // Un extremo que cae sobre otro tramo (ramal que se une a un camino) no lleva rellano: ya está dentro de su cinta.
        if (!esLugar(v) && red.some(o => o !== tramo && o.some((p, k) => k > 0 && distanciaTramo(v[0], v[1], o[k - 1]!, p) < 1e-6))) continue;
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
function segmentos(): [P2, P2, number][] {
  const vistos = new Set<string>();
  const salida: [P2, P2, number][] = [];
  for (const tramo of CAMINOS)
    for (let i = 1; i < tramo.length; i++) {
      const a = tramo[i - 1]!, b = tramo[i]!;
      const clave = [a.join(","), b.join(",")].sort().join("|");
      if (!vistos.has(clave)) salida.push([a, b, semianchoDe(tramo)]);
      vistos.add(clave);
    }
  return salida;
}

/** Plataforma: rectángulo de la plaza crecido `m` por cada lado (negativo = encogido). */
const plaza = (m = 0): P2[] => [[PLAZA.x0 - m, PLAZA.z0 - m], [PLAZA.x1 + m, PLAZA.z0 - m], [PLAZA.x1 + m, PLAZA.z1 + m], [PLAZA.x0 - m, PLAZA.z1 + m]];

/**
 * Juntas entre losas: franjas finas transversales cada `CAMINO.juntas`, 4 mm sobre la losa (nunca
 * coplanares). Solo en tramo libre: lejos de codos, cruces, rellanos y plaza, y con las cuatro
 * esquinas dentro de la losa (`losas`), para que ninguna quede encima de otra ni asome fuera.
 */
function juntas(m: MallaPavimento, color: THREE.Color, losas: readonly Franja[]): void {
  const ancho = 0.04, y = CAMINO.altoLosa + 0.004;
  const arriba = new THREE.Vector3(0, 1, 0);
  const segs = segmentos();
  const libre = (x: number, z: number, propio: number) =>
    distanciaPlaza(x, z) > 0.1
    && segs.every(([a, b, rr], k) => k === propio || distanciaTramo(x, z, a, b) > rr + CAMINO.bordillo + 0.05);
  segs.forEach(([a, b, r], k) => {
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
  // Plataforma: juntas cada metro y medio en x y una en z, recortadas al rectángulo interior.
  const bp = CAMINO.bordePlaza, yp = CAMINO.altoPlaza + 0.004;
  const v = (x: number, z: number) => new THREE.Vector3(x, yp, z);
  for (let x = PLAZA.x0 + bp + 1.5; x < PLAZA.x1 - bp - 0.5; x += 1.5)
    m.cuadro(v(x - ancho / 2, PLAZA.z0 + bp), v(x + ancho / 2, PLAZA.z0 + bp), v(x + ancho / 2, PLAZA.z1 - bp), v(x - ancho / 2, PLAZA.z1 - bp), color, arriba);
  const zj = PLAZA.z + 0.6;
  m.cuadro(v(PLAZA.x0 + bp, zj - ancho / 2), v(PLAZA.x1 - bp, zj - ancho / 2), v(PLAZA.x1 - bp, zj + ancho / 2), v(PLAZA.x0 + bp, zj + ancho / 2), color, arriba);
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
  const losa = marfil.clone().lerp(colorToken("sombra-suelo"), 0.3);
  const borde = marfil.clone().lerp(colorToken("regolito-medio"), 0.28);
  const lateral = marfil.clone().lerp(colorToken("regolito-medio"), 0.5);
  const junta = marfil.clone().lerp(colorToken("regolito-medio"), 0.2);

  const m = new MallaPavimento();
  const sinPlaza = [plaza()];
  const exterior = huellas(rb), interior = huellas(r);
  const losas = barrer(interior, sinPlaza);
  m.caras(losas, CAMINO.altoLosa, losa);
  // El escalón no se emite en el contorno de la plaza (ya lo cubre su pared exterior, coplanar):
  // para esta pasada el hueco es 1 cm más pequeño y su contorno queda oculto dentro de la plaza.
  m.paredes(barrer(interior, [plaza(-0.01)]), CAMINO.altoLosa, CAMINO.altoBordillo, borde, true);
  m.caras(barrer(exterior, [...interior, ...sinPlaza]), CAMINO.altoBordillo, borde);
  m.paredes(barrer(exterior, sinPlaza), -0.02, CAMINO.altoBordillo, lateral);

  const centro = [plaza(-CAMINO.bordePlaza)];
  m.caras(barrer(centro, [], sinPlaza), CAMINO.altoPlaza, losa); // mismas guías que el marco: sin grietas en T
  m.caras(barrer(sinPlaza, centro), CAMINO.altoPlaza, borde);
  m.paredes(barrer(sinPlaza), -0.02, CAMINO.altoPlaza, lateral);
  juntas(m, junta, losas);
  return m.geometria();
}

// ---------------------------------------------------------------------------------------------
// Balizas
// ---------------------------------------------------------------------------------------------

/** Balizas: `n` en el anillo, `troncal` en el camino ancho y una cada `pasoRamal` en los ramales (total máx. de la prueba escena3d.test.ts: 20) y distancia de cada una al eje. [E] */
export const BALIZAS = { n: 4, fase: 0.1, aparte: 0.95, troncal: 8, pasoTroncal: 1.7, aparteTroncal: 1.15, pasoRamal: 2.6 } as const;
const ANILLO_CENTRO: P2 = [1.5, -1.0];

/** Choca con un sólido de `TERRENO`, el banco o la plaza (con `margen`). */
export function chocaConBase(x: number, z: number, margen: number): boolean {
  if (TERRENO.circulos.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margen)) return true;
  if (TERRENO.capsulas.some((c) => x > c.x0 - c.r && x < c.x1 + c.r && Math.abs(z - c.z) < c.r + margen)) return true;
  if (x > BANCO.x0 - margen && x < BANCO.x1 + margen && z > BANCO.zBajo - margen && z < BANCO.zFondo + margen) return true;
  return distanciaPlaza(x, z) < margen;
}

/**
 * Balizas del anillo exterior: `BALIZAS.n` repartidas a distancia uniforme a lo largo de su
 * perímetro, en el borde interior (el exterior queda libre para el decorado). Sin caer sobre
 * módulos, la plataforma ni otro camino.
 */
export function posicionesBalizas(): P2[] {
  const n = ANILLO.length;
  const largos = ANILLO.slice(1).map((p, k) => Math.hypot(p[0] - ANILLO[k]![0], p[1] - ANILLO[k]![1]));
  const total = largos.reduce((a, b) => a + b, 0);
  const salida: P2[] = [];
  for (let j = 0; j < BALIZAS.n; j++) {
    let d = ((j + BALIZAS.fase) * total) / BALIZAS.n;
    let k = 0;
    while (k < n - 2 && d > largos[k]!) d -= largos[k++]!;
    const a = ANILLO[k]!, b = ANILLO[k + 1]!, t = d / largos[k]!;
    const ux = (b[0] - a[0]) / largos[k]!, uz = (b[1] - a[1]) / largos[k]!;
    const x0 = a[0] + (b[0] - a[0]) * t, z0 = a[1] + (b[1] - a[1]) * t;
    // Normal hacia el centro del anillo.
    let nx = -uz, nz = ux;
    if (nx * (ANILLO_CENTRO[0] - x0) + nz * (ANILLO_CENTRO[1] - z0) < 0) { nx = -nx; nz = -nz; }
    const x = x0 + nx * BALIZAS.aparte, z = z0 + nz * BALIZAS.aparte;
    if (chocaConBase(x, z, 0.6) || sobreCamino(x, z, 0.25)) continue;
    salida.push([x, z]);
  }
  const ancho = [...balizasTroncal(), ...balizasRamales()];
  return [...ancho, ...salida.filter(([x, z]) => ancho.every(([a, b]) => Math.hypot(x - a, z - b) > 1.2))];
}

/** Balizas de los ramales de la colonia: alternadas a cada lado, una cada `pasoRamal` metros, como en la lámina. */
function balizasRamales(): P2[] {
  const salida: P2[] = [];
  for (const [a, b] of RAMALES as readonly (readonly [P2, P2])[]) {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
    let lado = 1;
    for (let d = 1.6; d < l - 0.6; d += BALIZAS.pasoRamal, lado = -lado) {
      const x = a[0] + ux * d - uz * lado * BALIZAS.aparte, z = a[1] + uz * d + ux * lado * BALIZAS.aparte;
      // Solo dentro de lo caminable y con aire alrededor de las estaciones; más afuera el ramal es decorado.
      if (Math.hypot(x, z) > TERRENO.limite - 0.5 || POS_ESTACIONES.some((e) => Math.hypot(x - e.x, z - e.z) < e.radio + 0.9)) continue;
      if (chocaConBase(x, z, 0.6) || sobreCamino(x, z, 0.25)) continue;
      salida.push([x, z]);
    }
  }
  return salida;
}

/**
 * Balizas del camino ancho (`mundo/01`): alternadas a izquierda y derecha, una cada `pasoTroncal`
 * metros desde la entrada del primer plano hacia la torre, justo fuera de la cinta.
 */
function balizasTroncal(): P2[] {
  const salida: P2[] = [];
  let lado = 1;
  for (const tramo of TRONCAL) {
   let resto = 1.2;
   if (tramo !== TRONCAL[0]) lado = -1;
   for (let k = 0; k < tramo.length - 1 && salida.length < BALIZAS.troncal; k++) {
    const a = tramo[k]!, b = tramo[k + 1]!, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
    for (let d = resto; d < Math.min(l - 0.3, tramo === TRONCAL[0] ? 99 : 2.6) && salida.length < BALIZAS.troncal; d += BALIZAS.pasoTroncal) {
      const x = a[0] + ux * d - uz * lado * BALIZAS.aparteTroncal, z = a[1] + uz * d + ux * lado * BALIZAS.aparteTroncal;
      lado = -lado;
      if (chocaConBase(x, z, 0.6) || sobreCamino(x, z, 0.25)) continue;
      salida.push([x, z]);
      resto = d + BALIZAS.pasoTroncal - l;
    }
   }
  }
  return salida;
}
