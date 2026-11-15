/**
 * Terreno de Jezero y rocas basálticas: funciones puras arriba; `crearTerreno` y `crearRocas`
 * (Three.js) al final.
 *
 * Datos: `data/terreno/jezero/elevacion.bin`, descrito en `data/terreno/jezero/jezero.json`
 * (campo `dem`). El archivo es una rejilla de `ancho × alto` enteros con signo de 16 bits,
 * little-endian (Int16LE), en metros, fila a fila de norte a sur (así lo lee
 * `data/scripts/jezero-curar.ts`).
 *
 * Estilo: facetado con normales planas en terreno y rocas (DISEÑO.md §3.1).
 * El wrapper de Three puede usar la malla indexada con `flatShading: true` en el material
 * (las normales planas se calculan en el shader), o pedir `facetada: true` para recibir
 * vértices duplicados por triángulo y llamar a `computeVertexNormals()` sin compartir normales.
 */

import * as THREE from "three";
import { colorToken, geometriaBase, type Materiales } from "../materiales";

/** Presupuesto de toda la escena (docs/prompts/front-escenario.md, "Meta"). */
export const PRESUPUESTO = { drawCalls: 80, triangulos: 80000 } as const;

/** Triángulos máximos para el terreno: 1/4 del presupuesto; el resto, para la base, el kit y los personajes. */
export const MAX_TRIANGULOS_TERRENO = 20000;

/**
 * Paso de submuestreo por defecto para el DEM de 280×280.
 * Una rejilla de n×n puntos tiene 2·(n−1)² triángulos.
 * - paso 2 → n = 140 → 2·139² = 38 642 (se pasa de 20 000).
 * - paso 3 → n = floor(279/3)+1 = 94 → 2·93² = 17 298 (cabe con margen). Se elige 3.
 */
export const PASO_POR_DEFECTO = 3;

/**
 * Exageración vertical por defecto. Jezero mide ~81 km de lado (280 px × 289 m) con ~2,6 km de
 * relieve (−3093 a −501 m): a escala real se ve plano (3 %). Con ×3 el borde del cráter y el
 * delta se leen desde la cámara de juego. [E] a calibrar en pantalla.
 */
export const ESCALA_VERTICAL_POR_DEFECTO = 3;

/** Lado mayor del terreno en unidades de mundo. [E] a calibrar con la base compacta. */
export const TAMANO_MUNDO_POR_DEFECTO = 400;

/** Colores del entorno (DISEÑO.md §2.3 "Entorno marciano"). */
export const COLOR_TERRENO = "#FA8D6F"; // regolito-claro: suelo iluminado
export const COLOR_ROCA = {
  /** Cara superior, más clara que los lados (regolito-medio, DISEÑO.md §2.3). */
  superior: "#B76A78",
  /** Caras laterales oscuras (roca-basalto, DISEÑO.md §2.3). */
  lados: "#813E55",
} as const;

export interface Rejilla {
  alturas: Float32Array;
  ancho: number;
  alto: number;
}

export interface OpcionesMalla {
  /** Metros entre muestras de `alturas` (tras submuestrear: metrosPorPixel × paso). */
  metrosPorPixel: number;
  /** Exageración vertical (1 = escala real). */
  escalaVertical: number;
  /** Lado mayor del terreno en unidades de mundo. */
  tamañoMundo: number;
  /** true: duplica vértices por triángulo (sin compartir normales). */
  facetada?: boolean;
}

export interface Malla {
  posiciones: Float32Array;
  indices: Uint32Array | Uint16Array;
  triangulos: number;
}

/** Lee el DEM (Int16LE, metros) y devuelve las alturas en metros. */
export function leerDem(buffer: ArrayBuffer, ancho: number, alto: number): Float32Array {
  const n = ancho * alto;
  if (buffer.byteLength < n * 2) {
    throw new Error(`DEM corto: ${buffer.byteLength} bytes, se esperaban ${n * 2}`);
  }
  const vista = new DataView(buffer);
  const alturas = new Float32Array(n);
  for (let i = 0; i < n; i++) alturas[i] = vista.getInt16(i * 2, true);
  return alturas;
}

/** Toma una muestra de cada `paso` en filas y columnas (conserva la primera fila y columna). */
export function submuestrear(alturas: Float32Array, ancho: number, alto: number, paso: number = PASO_POR_DEFECTO): Rejilla {
  if (!Number.isInteger(paso) || paso < 1) throw new Error(`Paso inválido: ${paso}`);
  const nAncho = Math.floor((ancho - 1) / paso) + 1;
  const nAlto = Math.floor((alto - 1) / paso) + 1;
  const salida = new Float32Array(nAncho * nAlto);
  for (let f = 0; f < nAlto; f++) {
    for (let c = 0; c < nAncho; c++) {
      salida[f * nAncho + c] = alturas[f * paso * ancho + c * paso] ?? 0;
    }
  }
  return { alturas: salida, ancho: nAncho, alto: nAlto };
}

/** Escala y desplazamientos compartidos por la malla y por `alturaEnMundo`. */
function marco(r: Rejilla, o: OpcionesMalla) {
  let min = Infinity;
  let max = -Infinity;
  for (const h of r.alturas) {
    if (h < min) min = h;
    if (h > max) max = h;
  }
  const ladoM = Math.max(r.ancho - 1, r.alto - 1) * o.metrosPorPixel;
  const escala = o.tamañoMundo / ladoM; // unidades de mundo por metro
  return {
    escala,
    paso: o.metrosPorPixel * escala, // unidades de mundo entre muestras
    x0: -((r.ancho - 1) * o.metrosPorPixel * escala) / 2,
    z0: -((r.alto - 1) * o.metrosPorPixel * escala) / 2,
    hCentro: (min + max) / 2,
    escalaY: escala * o.escalaVertical,
  };
}

/**
 * Malla de rejilla centrada en el origen (x, z en [−lado/2, lado/2]; y centrada entre la altura
 * mínima y la máxima). Fila f → z creciente (norte arriba en el mapa = −z), columna c → x.
 */
export function mallaTerreno(alturas: Float32Array, ancho: number, alto: number, opciones: OpcionesMalla): Malla {
  const r: Rejilla = { alturas, ancho, alto };
  const m = marco(r, opciones);
  const nVert = ancho * alto;
  const pos = new Float32Array(nVert * 3);
  for (let f = 0; f < alto; f++) {
    for (let c = 0; c < ancho; c++) {
      const i = f * ancho + c;
      pos[i * 3] = m.x0 + c * m.paso;
      pos[i * 3 + 1] = ((alturas[i] ?? m.hCentro) - m.hCentro) * m.escalaY;
      pos[i * 3 + 2] = m.z0 + f * m.paso;
    }
  }
  const triangulos = 2 * (ancho - 1) * (alto - 1);
  const idx = new Uint32Array(triangulos * 3);
  let k = 0;
  for (let f = 0; f < alto - 1; f++) {
    for (let c = 0; c < ancho - 1; c++) {
      const a = f * ancho + c;
      const b = a + 1;
      const d = a + ancho;
      const e = d + 1;
      // Orden antihorario visto desde +y (cara hacia arriba).
      idx[k++] = a; idx[k++] = d; idx[k++] = b;
      idx[k++] = b; idx[k++] = d; idx[k++] = e;
    }
  }
  if (opciones.facetada) {
    const plano = new Float32Array(triangulos * 9);
    for (let t = 0; t < idx.length; t++) {
      const v = idx[t] ?? 0;
      plano[t * 3] = pos[v * 3] ?? 0;
      plano[t * 3 + 1] = pos[v * 3 + 1] ?? 0;
      plano[t * 3 + 2] = pos[v * 3 + 2] ?? 0;
    }
    const n = triangulos * 3;
    const sec = n <= 65535 ? new Uint16Array(n) : new Uint32Array(n);
    for (let t = 0; t < n; t++) sec[t] = t;
    return { posiciones: plano, indices: sec, triangulos };
  }
  return { posiciones: pos, indices: nVert <= 65535 ? Uint16Array.from(idx) : idx, triangulos };
}

/**
 * Altura del terreno (unidades de mundo) en (x, z), interpolada sobre los dos triángulos de la
 * celda igual que `mallaTerreno`, para que lo apoyado quede justo sobre la superficie.
 */
export function alturaEnMundo(r: Rejilla, opciones: OpcionesMalla, x: number, z: number): number {
  const m = marco(r, opciones);
  const u = Math.min(r.ancho - 1, Math.max(0, (x - m.x0) / m.paso));
  const v = Math.min(r.alto - 1, Math.max(0, (z - m.z0) / m.paso));
  const c = Math.min(r.ancho - 2, Math.floor(u));
  const f = Math.min(r.alto - 2, Math.floor(v));
  const fu = u - c;
  const fv = v - f;
  const h = (ff: number, cc: number) => ((r.alturas[ff * r.ancho + cc] ?? m.hCentro) - m.hCentro) * m.escalaY;
  const a = h(f, c), b = h(f, c + 1), d = h(f + 1, c), e = h(f + 1, c + 1);
  // Triángulos (a, d, b) y (b, d, e); la diagonal va de b a d (fu + fv = 1).
  return fu + fv <= 1 ? a + fu * (b - a) + fv * (d - a) : e + (1 - fu) * (d - e) + (1 - fv) * (b - e);
}

export interface TransformacionRoca {
  posicion: [number, number, number];
  escala: [number, number, number];
  /** Euler XYZ en radianes. */
  rotacion: [number, number, number];
}

export interface OpcionesRocas {
  /** Radio (unidades de mundo) alrededor del origen donde caen las rocas. Por defecto 0,45·lado. */
  radio?: number;
  escalaMin?: number;
  escalaMax?: number;
}

/** PRNG determinista (mulberry32). */
function aleatorio(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Transformaciones deterministas para instanciar UNA roca maestra (`InstancedMesh`).
 * Misma semilla → mismas rocas. Cada roca se apoya sobre el terreno (y = altura en su x, z).
 * Rotación solo un poco inclinada en x/z para que la cara superior clara siga mirando arriba.
 */
export function rocasBasalticas(
  semilla: number,
  n: number,
  terreno: Rejilla,
  opcionesMalla: OpcionesMalla,
  opciones: OpcionesRocas = {},
): TransformacionRoca[] {
  const azar = aleatorio(semilla);
  const radio = opciones.radio ?? opcionesMalla.tamañoMundo * 0.45;
  const eMin = opciones.escalaMin ?? 0.4;
  const eMax = opciones.escalaMax ?? 1.6;
  const rocas: TransformacionRoca[] = [];
  for (let i = 0; i < n; i++) {
    const ang = azar() * Math.PI * 2;
    const dist = Math.sqrt(azar()) * radio;
    const x = Math.cos(ang) * dist;
    const z = Math.sin(ang) * dist;
    const e = eMin + azar() * (eMax - eMin);
    rocas.push({
      posicion: [x, alturaEnMundo(terreno, opcionesMalla, x, z), z],
      escala: [e * (0.8 + azar() * 0.4), e * (0.5 + azar() * 0.3), e * (0.8 + azar() * 0.4)],
      rotacion: [(azar() - 0.5) * 0.3, azar() * Math.PI * 2, (azar() - 0.5) * 0.3],
    });
  }
  return rocas;
}

// ---------------------------------------------------------------------------------------------
// Wrappers Three.js. Terreno y rocas comparten el material `Rock` (color de vértice): 1 programa.
// ---------------------------------------------------------------------------------------------

export interface OpcionesTerreno {
  /** Rejilla ya submuestreada (`submuestrear(leerDem(...))`). */
  rejilla: Rejilla;
  /** Escala de la malla; `facetada` se fuerza a true. */
  malla: OpcionesMalla;
}

export interface Terreno3D {
  malla: THREE.Mesh;
  rejilla: Rejilla;
  opciones: OpcionesMalla;
}

/** Normal Y por encima de la cual una cara cuenta como "mira arriba" (≈ 45°). */
const NORMAL_ARRIBA = 0.7;

/**
 * Pinta cada triángulo de una geometría no indexada con un tono según su normal plana.
 * Debe llamarse después de `computeVertexNormals()`.
 */
function pintarPorNormal(geo: THREE.BufferGeometry, arriba: THREE.Color, lados: THREE.Color, mezcla: boolean): void {
  const normal = geo.getAttribute("normal");
  const colores = new Float32Array(normal.count * 3);
  const c = new THREE.Color();
  for (let v = 0; v < normal.count; v += 3) {
    const ny = normal.getY(v);
    if (mezcla) c.copy(lados).lerp(arriba, Math.min(1, Math.max(0, (ny - 0.5) / 0.5)));
    else c.copy(ny > NORMAL_ARRIBA ? arriba : lados);
    for (let k = 0; k < 3; k++) {
      colores[(v + k) * 3] = c.r;
      colores[(v + k) * 3 + 1] = c.g;
      colores[(v + k) * 3 + 2] = c.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
}

/**
 * Terreno de Jezero como `Mesh` facetado: vértices duplicados por triángulo (normales planas),
 * `regolito-claro` en lo llano y `regolito-medio` en las laderas. Recibe sombras, no las proyecta.
 */
export function crearTerreno(materiales: Materiales, opciones: OpcionesTerreno): Terreno3D {
  const { rejilla } = opciones;
  const op: OpcionesMalla = { ...opciones.malla, facetada: true };
  const m = mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, op);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(m.posiciones, 3));
  geo.computeVertexNormals(); // no indexada: cada triángulo con su normal plana
  pintarPorNormal(geo, colorToken("regolito-claro"), colorToken("regolito-medio"), true);
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, materiales.Rock);
  malla.name = "Terrain_Jezero";
  malla.receiveShadow = true;
  malla.castShadow = false;
  return { malla, rejilla, opciones: op };
}

/** Semilla decorativa de la forma de la roca maestra (separada del RNG de la misión). */
const SEMILLA_FORMA_ROCA = 1977;

/** Roca maestra: icosaedro no indexado con desplazamiento determinista y base hundida. */
function geometriaRoca(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 0); // ya no indexada en r160
  const pos = geo.getAttribute("position");
  const azar = aleatorio(SEMILLA_FORMA_ROCA);
  // El mismo vértice aparece en varios triángulos: se desplaza igual en todos (roca cerrada).
  const desplazamiento = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const clave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    let d = desplazamiento.get(clave);
    if (d === undefined) {
      d = 0.75 + azar() * 0.45;
      desplazamiento.set(clave, d);
    }
    // Aplana la parte de arriba (cara superior legible) y hunde la base en el suelo.
    pos.setXYZ(i, x * d, (y > 0.6 ? 0.6 + (y - 0.6) * 0.3 : y) * d - 0.25, z * d);
  }
  geo.computeVertexNormals();
  pintarPorNormal(geo, colorToken("regolito-medio"), colorToken("roca-basalto"), false);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * `n` rocas basálticas en UN `InstancedMesh` (1 draw call + su sombra) sobre `terreno`.
 * Geometría maestra compartida de la caché; cara superior `regolito-medio`, lados `roca-basalto`.
 */
export function crearRocas(materiales: Materiales, terreno: Terreno3D, n: number, semilla: number): THREE.InstancedMesh {
  const geo = geometriaBase("roca-basalto", geometriaRoca);
  const rocas = rocasBasalticas(semilla, n, terreno.rejilla, terreno.opciones);
  const malla = new THREE.InstancedMesh(geo, materiales.Rock, rocas.length);
  malla.name = "Rocks_Basalt";
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  rocas.forEach((r, i) => {
    p.set(...r.posicion);
    q.setFromEuler(e.set(...r.rotacion));
    s.set(...r.escala);
    malla.setMatrixAt(i, m.compose(p, q, s));
  });
  malla.instanceMatrix.needsUpdate = true;
  malla.computeBoundingSphere();
  malla.castShadow = true;
  malla.receiveShadow = true;
  return malla;
}

// ---------------------------------------------------------------------------------------------
/**
 * Presupuesto: cuenta de render por recorrido de la escena, sin WebGL (APLICACION.md §8).
 *
 * Aproxima lo que daría `renderer.info.render` tras un `render()`: una llamada por malla visible
 * (o por grupo si usa varios materiales) y otra por cada luz con sombra en las mallas con
 * `castShadow`. Una `InstancedMesh` es 1 llamada con `count` copias de sus triángulos.
 * No descarta por cámara: es la cota alta de la vista.
 * Vive aquí junto a `PRESUPUESTO` hasta que exista `escena3d.ts` nuevo.
 */

export interface CuentaRender {
  drawCalls: number;
  triangulos: number;
}

function triangulosDe(g: THREE.BufferGeometry): number {
  const total = g.index ? g.index.count : (g.getAttribute("position")?.count ?? 0);
  const rango = Math.min(total, g.drawRange.count) - g.drawRange.start;
  return Math.max(0, Math.floor(rango / 3));
}

function visibleEnArbol(o: THREE.Object3D): boolean {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export function contarRender(escena: THREE.Object3D): CuentaRender {
  let lucesConSombra = 0;
  escena.traverse((o) => {
    if (o instanceof THREE.Light && o.castShadow && visibleEnArbol(o)) {
      lucesConSombra += o instanceof THREE.PointLight ? 6 : 1; // la puntual dibuja un cubo
    }
  });

  const cuenta: CuentaRender = { drawCalls: 0, triangulos: 0 };
  escena.traverse((o) => {
    if (!visibleEnArbol(o)) return;
    if (o instanceof THREE.Sprite) {
      cuenta.drawCalls++;
      cuenta.triangulos += 2;
      return;
    }
    if (!(o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points)) return;
    const g = o.geometry as THREE.BufferGeometry;
    const llamadas = Array.isArray(o.material) && g.groups.length > 0 ? g.groups.length : 1;
    const copias = o instanceof THREE.InstancedMesh ? o.count : 1;
    const tris = o instanceof THREE.Mesh ? triangulosDe(g) * copias : 0;
    const pasadas = 1 + (o instanceof THREE.Mesh && o.castShadow ? lucesConSombra : 0);
    cuenta.drawCalls += llamadas * pasadas;
    cuenta.triangulos += tris * pasadas;
  });
  return cuenta;
}
