/** Mallas Three.js del terreno de Jezero, rocas y cordillera. */
import * as THREE from "three";
import { colorToken, geometriaBase, type Materiales } from "../materiales";
import { MEZCLA_SUELO, aleatorio, mallaTerreno, rocasBasalticas, type OpcionesMalla, type OpcionesRocas, type Rejilla } from "./terrenoDatos";

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

/** Pinta el suelo cara a cara: terracota rosada en lo llano, `regolito-medio` en laderas. */
function pintarSuelo(geo: THREE.BufferGeometry): void {
  const normal = geo.getAttribute("normal");
  const colores = new Float32Array(normal.count * 3);
  const llano = colorToken("regolito-claro").lerp(colorToken("sombra-suelo"), MEZCLA_SUELO.rosado);
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
export function crearRocas(
  materiales: Materiales,
  terreno: Terreno3D,
  n: number,
  semilla: number,
  opciones: OpcionesRocas = {},
): THREE.InstancedMesh {
  const geo = geometriaBase("roca-basalto", geometriaRoca);
  const rocas = rocasBasalticas(semilla, n, terreno.rejilla, terreno.opciones, opciones);
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

/** Valores de partida: bajas y lejanas (MARTE §6: "borde del cráter bajo y lejano"). [E] */
export const MONTANAS: OpcionesMontanas = { radio: 230, alto: 24, picos: 52, semilla: 7 };

/**
 * Anillo de picos facetados (`montana-lejana`, crestas mezcladas con `lila`): una sola malla con
 * dos filas de picos (la de atrás más alta y más lila), pocos triángulos, sin sombra.
 * Comparte el material `Rock` (color de vértice) y recibe la niebla del cielo.
 */
export function crearMontanas(materiales: Materiales, o: OpcionesMontanas = MONTANAS): THREE.Mesh {
  const azar = aleatorio(o.semilla);
  const pos: number[] = [];
  const col: number[] = [];
  const pie = colorToken("montana-lejana").lerp(colorToken("regolito-medio"), 0.35);
  const cresta = colorToken("montana-lejana");
  const fondo = colorToken("montana-lejana").lerp(colorToken("lila"), 0.3);
  const tri = (a: number[], b: number[], c: number[], ca: THREE.Color, cc: THREE.Color) => {
    pos.push(...a, ...b, ...c);
    col.push(ca.r, ca.g, ca.b, ca.r, ca.g, ca.b, cc.r, cc.g, cc.b);
  };
  for (const [fila, radio, alto, color] of [[1, o.radio * 1.18, o.alto * 1.35, fondo], [0, o.radio, o.alto, cresta]] as const) {
    const n = o.picos + fila * 7;
    const desfase = azar() * Math.PI * 2;
    const puntos: number[][] = [];
    for (let i = 0; i < n; i++) {
      const a = desfase + (i / n) * Math.PI * 2;
      // Picos alternos con valles: silueta baja y quebrada.
      const h = i % 2 === 0 ? alto * (0.35 + azar() * 0.65) : alto * (0.2 + azar() * 0.3);
      const r = radio * (0.97 + azar() * 0.06);
      puntos.push([Math.cos(a) * r, h, Math.sin(a) * r, a]);
    }
    for (let i = 0; i < n; i++) {
      const p = puntos[i]!, q = puntos[(i + 1) % n]!;
      const pa = p[3]!, qa = q[3]! < pa ? q[3]! + Math.PI * 2 : q[3]!;
      // Pie delante (hacia el centro) y detrás, bajo el suelo: cada tramo son 2 caras al frente.
      const r0 = radio * 0.9;
      const pie1 = [Math.cos(pa) * r0, -40, Math.sin(pa) * r0];
      const pie2 = [Math.cos(qa) * r0, -40, Math.sin(qa) * r0];
      const medio = [Math.cos((pa + qa) / 2) * radio * 0.94, (p[1]! + q[1]!) * 0.25, Math.sin((pa + qa) / 2) * radio * 0.94];
      const c1 = color.clone().lerp(pie, 0.5 + azar() * 0.3);
      tri(pie1, medio, [p[0]!, p[1]!, p[2]!], pie, i % 2 === 0 ? color : c1);
      tri(medio, pie2, [q[0]!, q[1]!, q[2]!], pie, i % 2 === 1 ? color : c1);
      tri([p[0]!, p[1]!, p[2]!], medio, [q[0]!, q[1]!, q[2]!], c1, color);
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
