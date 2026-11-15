/** Mallas Three.js del terreno de Jezero, rocas y cordillera. */
import * as THREE from "three";
import { colorToken, geometriaBase, type Materiales } from "../materiales";
import { GRAVILLA, MEZCLA_SUELO, aleatorio, mallaTerreno, rocasBasalticas, type OpcionesMalla, type OpcionesRocas, type Rejilla, type TransformacionRoca } from "./terrenoDatos";

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
 * Pinta cada triángulo de una geometría no indexada según su normal plana: `arriba` en las caras
 * que miran al cielo (polvo depositado, MARTE §3), `lados` en el resto, y una variación al azar de
 * hasta `variacion` hacia `oscuro` para que cada faceta se distinga. Va tras `computeVertexNormals()`.
 */
function pintarPorNormal(geo: THREE.BufferGeometry, arriba: THREE.Color, lados: THREE.Color, oscuro: THREE.Color, semilla: number, variacion: number): void {
  const normal = geo.getAttribute("normal");
  const colores = new Float32Array(normal.count * 3);
  const c = new THREE.Color();
  const azar = aleatorio(semilla);
  for (let v = 0; v < normal.count; v += 3) {
    const ny = normal.getY(v);
    const t = ny > NORMAL_ARRIBA ? 1 : Math.min(1, Math.max(0, (ny - 0.2) / (NORMAL_ARRIBA - 0.2))) * 0.45;
    c.copy(lados).lerp(arriba, t).lerp(oscuro, azar() * variacion);
    for (let k = 0; k < 3; k++) {
      colores[(v + k) * 3] = c.r;
      colores[(v + k) * 3 + 1] = c.g;
      colores[(v + k) * 3 + 2] = c.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
}

/** Pinta el suelo cara a cara: `regolito-claro` en lo llano, hacia `regolito-medio` en laderas. */
function pintarSuelo(geo: THREE.BufferGeometry): void {
  const normal = geo.getAttribute("normal");
  const colores = new Float32Array(normal.count * 3);
  const llano = colorToken("regolito-claro");
  const medio = colorToken("regolito-medio");
  const c = new THREE.Color();
  const azar = aleatorio(SEMILLA_SUELO);
  for (let v = 0; v < normal.count; v += 3) {
    const ladera = 1 - Math.min(1, Math.max(0, (normal.getY(v) - 0.55) / 0.4));
    c.copy(llano).lerp(medio, Math.min(1, azar() * MEZCLA_SUELO.variacion + ladera * MEZCLA_SUELO.ladera));
    for (let k = 0; k < 3; k++) colores.set([c.r, c.g, c.b], (v + k) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
}

/** Semilla decorativa del moteado del suelo. */
const SEMILLA_SUELO = 2020;

/**
 * Terreno de Jezero como `Mesh` facetado: vértices duplicados por triángulo (normales planas),
 * terracota rosada en lo llano y `regolito-medio` en las laderas. Recibe sombras, no las proyecta.
 */
export function crearTerreno(materiales: Materiales, opciones: OpcionesTerreno): Terreno3D {
  const { rejilla } = opciones;
  const op: OpcionesMalla = { ...opciones.malla, facetada: true };
  const m = mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, op);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(m.posiciones, 3));
  geo.computeVertexNormals(); // no indexada: cada triángulo con su normal plana
  pintarSuelo(geo);
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, materiales.Rock);
  malla.name = "Terrain_Jezero";
  malla.receiveShadow = true;
  malla.castShadow = false;
  return { malla, rejilla, opciones: op };
}

/** Semilla decorativa de la forma de la roca maestra (separada del RNG de la misión). */
const SEMILLA_FORMA_ROCA = 1977;

/** Semilla decorativa de la forma de la piedrita maestra de la gravilla. */
const SEMILLA_FORMA_GRAVILLA = 1984;

/**
 * Tonos de roca (lámina `mundo/01` y `exterior/02`): lados rojizo terroso oscuro (`roca-basalto`
 * calentado con `regolito-claro`, así no sale magenta) y cara superior más clara por el polvo. [E]
 */
const TONO_ROCA = { lados: 0.35, arriba: 0.5, variacion: 0.3 } as const;

/**
 * Trozo facetado cerrado a partir de un poliedro no indexado: cada vértice se aleja del centro al
 * azar entre `dMin` y `dMax` (igual en todos los triángulos que lo comparten), se inclina un poco
 * hacia un lado (roca asimétrica), se aplana la cima a `cima` (cara superior legible) y se hunde
 * `hundir` en el suelo. Pintado por normal con `TONO_ROCA`.
 */
function trozoFacetado(geo: THREE.BufferGeometry, semilla: number, dMin: number, dMax: number, cima: number, hundir: number): THREE.BufferGeometry {
  const pos = geo.getAttribute("position");
  const azar = aleatorio(semilla);
  const desplazamiento = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const clave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    let d = desplazamiento.get(clave);
    if (d === undefined) {
      d = dMin + azar() * (dMax - dMin);
      desplazamiento.set(clave, d);
    }
    const yy = y * d;
    const ya = yy > cima ? cima + (yy - cima) * 0.2 : yy;
    pos.setXYZ(i, x * d * 1.05 + ya * 0.12, ya - hundir, z * d * 0.95);
  }
  geo.computeVertexNormals();
  const claro = colorToken("regolito-claro");
  const lados = colorToken("roca-basalto").lerp(claro, TONO_ROCA.lados);
  const arriba = colorToken("regolito-medio").lerp(claro, TONO_ROCA.arriba);
  pintarPorNormal(geo, arriba, lados, colorToken("roca-basalto"), semilla, TONO_ROCA.variacion);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Roca maestra: dodecaedro (36 caras) desplazado, con cima plana y base hundida: facetas grandes
 * e irregulares como las de `exterior/02`, no una caja. Radio en planta ≤ ~1,2 u
 * (`radioRocaPrimerPlano` de `armado.ts` cuenta con eso).
 */
function geometriaRoca(): THREE.BufferGeometry {
  return trozoFacetado(new THREE.DodecahedronGeometry(1, 0), SEMILLA_FORMA_ROCA, 0.72, 1.12, 0.42, 0.22);
}

/**
 * Roca alta de primer plano (`mundo/01`): dodecaedro más anguloso, de cima alta casi sin aplanar y
 * base poco hundida, para que se lea entera en las esquinas. 36 caras, geometría propia.
 */
function geometriaRocaAlta(): THREE.BufferGeometry {
  return trozoFacetado(new THREE.DodecahedronGeometry(1, 0), SEMILLA_FORMA_ROCA + 7, 0.62, 1.2, 1.25, 0.12);
}

/** Piedrita maestra de la gravilla: octaedro desplazado y aplanado (8 caras). */
function geometriaGravilla(): THREE.BufferGeometry {
  const geo = trozoFacetado(new THREE.OctahedronGeometry(1, 0), SEMILLA_FORMA_GRAVILLA, 0.75, 1.15, 0.3, 0.1);
  // Más oscura que el suelo (como en `mundo/01`): se lee como piedritas y no como manchas del terreno.
  const color = geo.getAttribute("color");
  for (let i = 0; i < color.count; i++) color.setXYZ(i, color.getX(i) * 0.6, color.getY(i) * 0.6, color.getZ(i) * 0.6);
  return geo;
}

/**
 * `n` rocas basálticas en UN `InstancedMesh` (1 draw call + su sombra) sobre `terreno`.
 * Geometría maestra compartida de la caché; cara superior `regolito-medio`, lados `roca-basalto`.
 */
export function crearRocas(
  materiales: Materiales,
  terreno: Terreno3D,
  n: number,
  semilla: number,
  opciones: OpcionesRocas = {},
): THREE.InstancedMesh {
  return instanciarRocas(materiales, rocasBasalticas(semilla, n, terreno.rejilla, terreno.opciones, opciones));
}

/** Rocas ya colocadas en UN `InstancedMesh` con la roca maestra de la caché (1 draw call + sombra). */
export function instanciarRocas(materiales: Materiales, rocas: readonly TransformacionRoca[], nombre = "Rocks_Basalt"): THREE.InstancedMesh {
  return instanciar(geometriaBase("roca-basalto",geometriaRoca), materiales, rocas, nombre);
}

/** Rocas altas y angulosas de primer plano en UN `InstancedMesh` (ver `geometriaRocaAlta`). */
export function instanciarRocasAltas(materiales: Materiales, rocas: readonly TransformacionRoca[], nombre = "Rocks_Basalt_Tall"): THREE.InstancedMesh {
  return instanciar(geometriaBase("roca-basalto-alta", geometriaRocaAlta), materiales, rocas, nombre);
}

/**
 * Gravilla: `GRAVILLA.n` piedritas (~0,1–0,3 m) en UN `InstancedMesh` de 8 caras cada una, con
 * semilla fija, sobre `terreno` y fuera de `radioMin`. `excluir(x, z)` descarta las que caerían en
 * caminos o edificios (pueden quedar menos de `n`). Sin sombras (APLICACION §8): 1 draw call.
 */
export function crearGravilla(materiales: Materiales, terreno: Terreno3D, opciones: OpcionesRocas & { n?: number; semilla?: number } = {}): THREE.InstancedMesh {
  const o = { ...GRAVILLA, ...opciones };
  const piedras = rocasBasalticas(o.semilla, o.n, terreno.rejilla, terreno.opciones, o);
  const malla = instanciar(geometriaBase("gravilla", geometriaGravilla), materiales, piedras, "Rocks_Gravel");
  malla.castShadow = false;
  malla.receiveShadow = true;
  return malla;
}

function instanciar(geo: THREE.BufferGeometry, materiales: Materiales, rocas: readonly TransformacionRoca[], nombre: string): THREE.InstancedMesh {
  const malla = new THREE.InstancedMesh(geo, materiales.Rock, rocas.length);
  malla.name = nombre;
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

// ---------------------------------------------------------------------------------------------
// Horizonte: cordillera lejana low poly
// ---------------------------------------------------------------------------------------------

export interface OpcionesMontanas {
  /** Radio del pie de la cordillera (más allá del borde útil del terreno). */
  radio: number;
  /** Altura máxima de los picos sobre y = 0. */
  alto: number;
  /** Picos por vuelta. */
  picos: number;
  semilla: number;
}

/**
 * Valores de partida (MARTE §6: "borde del cráter bajo y lejano"): la capa cercana empieza en
 * `radio` (fuera del terreno útil) y las otras dos van detrás, más altas para asomar. [E]
 */
export const MONTANAS: OpcionesMontanas = { radio: 215, alto: 36, picos: 56, semilla: 7 };

/**
 * Capas de la cordillera (lámina `mundo/01`): la cercana más oscura y saturada (`montana-lejana`
 * con `roca-basalto`), la media `montana-lejana` y la lejana aclarada hacia `lila`; la niebla del
 * cielo las aclara más con la distancia (perspectiva atmosférica, MARTE §3). Factores de `radio`,
 * `alto` y `picos`; `tono` = mezcla hacia `roca-basalto` (> 0) o hacia `lila` (< 0). [E]
 */
export const CAPAS_MONTANA = [
  { radio: 1, alto: 0.75, picos: 1.3, tono: 0.5 },
  { radio: 1.17, alto: 1, picos: 1.1, tono: 0 },
  { radio: 1.36, alto: 1.3, picos: 0.9, tono: -0.4 },
] as const;

/**
 * Cordillera en capas: una sola malla (1 draw call, sin sombra, < 1000 triángulos) con tres anillos
 * de crestas irregulares facetadas que cierran el horizonte. Cada tramo de cresta son 4 caras
 * vueltas hacia la base (pie, hombro y cima), así se leen facetas grandes y no pirámides sueltas.
 * Comparte el material `Rock` (color de vértice) y recibe la niebla del cielo.
 */
export function crearMontanas(materiales: Materiales, o: OpcionesMontanas = MONTANAS): THREE.Mesh {
  const azar = aleatorio(o.semilla);
  const pos: number[] = [];
  const col: number[] = [];
  const tri = (a: number[], b: number[], c: number[], ca: THREE.Color, cc: THREE.Color) => {
    pos.push(a[0]!, a[1]!, a[2]!, b[0]!, b[1]!, b[2]!, c[0]!, c[1]!, c[2]!);
    col.push(ca.r, ca.g, ca.b, ca.r, ca.g, ca.b, cc.r, cc.g, cc.b);
  };
  const basalto = colorToken("roca-basalto");
  const lila = colorToken("lila");
  for (const capa of CAPAS_MONTANA) {
    const radio = o.radio * capa.radio;
    const alto = o.alto * capa.alto;
    const n = Math.round(o.picos * capa.picos);
    const cresta = colorToken("montana-lejana").lerp(capa.tono >= 0 ? basalto : lila, Math.abs(capa.tono));
    const pie = cresta.clone().lerp(basalto, 0.3);
    const desfase = azar() * Math.PI * 2;
    const fase = azar() * Math.PI * 2;
    const puntos: number[][] = [];
    for (let i = 0; i < n; i++) {
      const a = desfase + (i / n) * Math.PI * 2;
      // Macizos (onda baja) con picos sueltos encima y valles alternos: silueta quebrada.
      const macizo = 0.5 + 0.5 * Math.sin(a * 3 + fase) * Math.sin(a * 5 + fase * 0.7);
      const h = alto * (0.3 + 0.7 * (0.55 * macizo + 0.45 * azar())) * (i % 2 === 0 ? 1 : 0.6 + azar() * 0.25);
      const r = radio * (0.96 + azar() * 0.08);
      puntos.push([Math.cos(a) * r, h, Math.sin(a) * r, a]);
    }
    for (let i = 0; i < n; i++) {
      const p = puntos[i]!, q = puntos[(i + 1) % n]!;
      const pa = p[3]!, qa = q[3]! < pa ? q[3]! + Math.PI * 2 : q[3]!;
      // Pie delante (hacia el centro) y bajo el suelo; hombro a media altura entre dos cimas.
      const r0 = radio * 0.9;
      const pie1 = [Math.cos(pa) * r0, -40, Math.sin(pa) * r0];
      const pie2 = [Math.cos(qa) * r0, -40, Math.sin(qa) * r0];
      const rh = radio * (0.92 + azar() * 0.04);
      const medio = [Math.cos((pa + qa) / 2) * rh, (p[1]! + q[1]!) * (0.2 + azar() * 0.2), Math.sin((pa + qa) / 2) * rh];
      const c1 = cresta.clone().lerp(pie, 0.35 + azar() * 0.4);
      const c2 = cresta.clone().lerp(lila, azar() * 0.15);
      tri(pie1, medio, [p[0]!, p[1]!, p[2]!], pie, i % 2 === 0 ? c2 : c1);
      tri(medio, pie2, [q[0]!, q[1]!, q[2]!], pie, i % 2 === 1 ? c2 : c1);
      tri([p[0]!, p[1]!, p[2]!], medio, [q[0]!, q[1]!, q[2]!], c1, c2);
      tri(pie1, pie2, medio, pie, pie);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, materiales.Rock);
  malla.name = "Mountains_Far";
  malla.castShadow = false;
  malla.receiveShadow = false;
  return malla;
}

// ---------------------------------------------------------------------------------------------
// Lomas: montículos facetados (antena parabólica y base de montaña, lámina `mundo/01`)
// ---------------------------------------------------------------------------------------------

/** Loma: centro en planta, radio en el suelo, altura de la cima sobre y = 0 y semilla de su forma. */
export interface Loma {
  readonly x: number;
  readonly z: number;
  readonly radio: number;
  readonly alto: number;
  readonly semilla: number;
  /** Mezcla hacia `regolito-claro` (0 a 1): más claro se lee mejor contra el suelo. */
  readonly tono?: number;
}

/** Lados de cada anillo de una loma. */
const LADOS_LOMA = 10;
/** Cuánto se hunde el pie de la loma bajo y = 0: así no queda hueco con el terreno. */
const PIE_LOMA = -4;

/**
 * Lomas en UNA malla (1 draw call + su sombra): cada una son cuatro anillos irregulares
 * (pie hundido, base, hombro, cima plana) unidos en caras planas, pintadas por normal como las rocas.
 */
export function crearLomas(materiales: Materiales, lomas: readonly Loma[]): THREE.Mesh {
  const pos: number[] = [];
  const claro = colorToken("regolito-claro");
  const pálido = colorToken("regolito-claro").lerp(colorToken("marfil"), 0.55);
  const tramos: [number, number, number][] = []; // [primer vértice, último, tono]
  for (const l of lomas) {
    const desde = pos.length / 3;
    const azar = aleatorio(l.semilla);
    // [radio relativo, altura relativa] de cada anillo, del pie a la cima.
    const perfil: [number, number][] = [[1.12, PIE_LOMA / l.alto], [1, 0], [0.62, 0.62], [0.3, 1]];
    const anillos = perfil.map(([r, h]) => {
      const pts: number[][] = [];
      for (let i = 0; i < LADOS_LOMA; i++) {
        const a = (i / LADOS_LOMA) * Math.PI * 2;
        const rr = l.radio * r * (0.85 + azar() * 0.3);
        pts.push([l.x + Math.cos(a) * rr, h * l.alto + (h > 0 && h < 1 ? (azar() - 0.5) * 0.12 * l.alto : 0), l.z + Math.sin(a) * rr]);
      }
      return pts;
    });
    const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
    for (let k = 0; k < anillos.length - 1; k++)
      for (let i = 0; i < LADOS_LOMA; i++) {
        const j = (i + 1) % LADOS_LOMA;
        const a = anillos[k]!, b = anillos[k + 1]!;
        tri(a[i]!, b[i]!, b[j]!);
        tri(a[i]!, b[j]!, a[j]!);
      }
    const cima = anillos[anillos.length - 1]!;
    const centro = [l.x, l.alto, l.z];
    for (let i = 0; i < LADOS_LOMA; i++) tri(centro, cima[i]!, cima[(i + 1) % LADOS_LOMA]!);
    tramos.push([desde, pos.length / 3, l.tono ?? 0]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  pintarPorNormal(geo, colorToken("regolito-medio").lerp(claro, 0.5), colorToken("roca-basalto").lerp(claro, 0.35), colorToken("roca-basalto"), 77, 0.25);
  const color = geo.getAttribute("color");
  const c = new THREE.Color();
  for (const [a, b, t] of tramos)
    for (let v = a; v < b; v++) {
      c.setRGB(color.getX(v), color.getY(v), color.getZ(v)).lerp(pálido, t);
      color.setXYZ(v, c.r, c.g, c.b);
    }
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, materiales.Rock);
  malla.name = "Mounds";
  malla.castShadow = true;
  malla.receiveShadow = true;
  return malla;
}
