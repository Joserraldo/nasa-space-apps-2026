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

/**
 * Suelo (DISEÑO.md §2.3): sin tone mapping, `regolito-claro` puro lee el naranja rojizo saturado
 * de `mundo/01` (antes se mezclaba con `sombra-suelo` para compensar ACES y salía salmón pálido).
 * Cada cara cae al azar hasta `variacion` hacia `regolito-medio` (facetas leves, también en el
 * claro llano) y las laderas hasta `ladera`. [E]
 */
export const MEZCLA_SUELO = { variacion: 0.28, ladera: 0.75 } as const;

/**
 * Gravilla (lámina `exterior/02`, "rocas pequeñas", y el suelo de `mundo/01`): piedritas de
 * 0,1–0,3 m repartidas con semilla fija en todo el suelo cercano, fuera del centro de la base.
 * Decorativa e inventada (MARTE §8): no es dato de Mars Trek. [E]
 */
export const GRAVILLA = { n: 1100, semilla: 314, radioMin: 3, radio: 34, escalaMin: 0.14, escalaMax: 0.42 } as const;

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
/** Marco precalculado: calcúlalo una vez por rejilla y pásalo a `alturaEnMundo` en bucles. */
export type MarcoTerreno = ReturnType<typeof marco>;

export function marco(r: Rejilla, o: OpcionesMalla) {
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
export function alturaEnMundo(
  r: Rejilla,
  opciones: OpcionesMalla,
  x: number,
  z: number,
  m: MarcoTerreno = marco(r, opciones),
): number {
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

export interface Claro {
  /** Rejilla con el disco central aplanado (metros, como la original). */
  rejilla: Rejilla;
  /** Altura de mundo del claro: baja el terreno esta cantidad para que el claro quede en y = 0. */
  altura: number;
}

/**
 * Aplana un disco de `radio` (unidades de mundo) alrededor del origen a la altura que tenía su
 * centro, y suaviza el borde hasta `borde` (smoothstep), para apoyar la base en y = 0 con el
 * relieve de Jezero alrededor. No modifica la rejilla de entrada.
 */
export function aplanarClaro(r: Rejilla, opciones: OpcionesMalla, radio: number, borde: number): Claro {
  const m = marco(r, opciones);
  const centroM = m.hCentro + alturaEnMundo(r, opciones, 0, 0, m) / m.escalaY;
  const alturas = new Float32Array(r.alturas.length);
  for (let f = 0; f < r.alto; f++) {
    for (let c = 0; c < r.ancho; c++) {
      const i = f * r.ancho + c;
      const d = Math.hypot(m.x0 + c * m.paso, m.z0 + f * m.paso);
      const t = Math.min(1, Math.max(0, (d - radio) / Math.max(1e-6, borde - radio)));
      const w = t * t * (3 - 2 * t);
      alturas[i] = centroM + ((r.alturas[i] ?? centroM) - centroM) * w;
    }
  }
  const rejilla: Rejilla = { alturas, ancho: r.ancho, alto: r.alto };
  return { rejilla, altura: alturaEnMundo(rejilla, opciones, 0, 0) };
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
  /** Radio libre de rocas alrededor del origen (el claro de la base). Por defecto 0. */
  radioMin?: number;
  escalaMin?: number;
  escalaMax?: number;
  /** Descarta las rocas que caerían en (x, z) (caminos, edificios). Puede dar menos de `n`. */
  excluir?: (x: number, z: number) => boolean;
}

/** PRNG determinista (mulberry32). */
export function aleatorio(semilla: number): () => number {
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
  const radioMin = Math.min(radio, Math.max(0, opciones.radioMin ?? 0));
  const eMin = opciones.escalaMin ?? 0.4;
  const eMax = opciones.escalaMax ?? 1.6;
  const rocas: TransformacionRoca[] = [];
  const m = marco(terreno, opcionesMalla); // una vez, no por roca
  for (let i = 0; i < n; i++) {
    const ang = azar() * Math.PI * 2;
    const dist = radioMin > 0 ? Math.sqrt(radioMin * radioMin + azar() * (radio * radio - radioMin * radioMin)) : Math.sqrt(azar()) * radio;
    const x = Math.cos(ang) * dist;
    const z = Math.sin(ang) * dist;
    const e = eMin + azar() * (eMax - eMin);
    const r1 = azar(), r2 = azar(), r3 = azar(), r4 = azar(), r5 = azar(), r6 = azar();
    if (opciones.excluir?.(x, z)) continue;
    rocas.push({
      posicion: [x, alturaEnMundo(terreno, opcionesMalla, x, z, m), z],
      escala: [e * (0.8 + r1 * 0.4), e * (0.5 + r2 * 0.3), e * (0.8 + r3 * 0.4)],
      rotacion: [(r4 - 0.5) * 0.3, r5 * Math.PI * 2, (r6 - 0.5) * 0.3],
    });
  }
  return rocas;
}
