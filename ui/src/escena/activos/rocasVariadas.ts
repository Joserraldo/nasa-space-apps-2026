import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { colorToken, geometriaBase } from "../materiales";
import { pintarPorNormal, TONO_ROCA, trozoFacetado } from "./terrenoVisual";

/**
 * On by default (`?texturas=0` turns it off): more varied and more finished rocks.
 *
 * Every rock keeps its position, rotation and scale (paths and collisions do not change); only its shape
 * changes, and no new shape is wider than the original rock. Families, all with the original palette
 * coloring (dusty top, darker sides):
 * - the current faceted rock (dodecahedron);
 * - `laja`: beveled 7-sided plates stacked in steps, like layered sedimentary rock (the kind
 *   Perseverance studies in the Jezero delta), with loose chips at its foot;
 * - `partida`: an angular block with a broken piece leaning next to it;
 * - `racimo`: three rounded boulders of different sizes, finer facets, plus chips.
 * Shapes are designed in code from reference images of low-poly rock packs; no external mesh is used.
 * Cost: +3 draw calls (one InstancedMesh per new family, all rocks together).
 */

const SEMILLA = { laja: 2111, partida: 2207, racimo: 2309, astillas: 2411 } as const;

function pintarRoca(geo: THREE.BufferGeometry, semilla: number): THREE.BufferGeometry {
  const claro = colorToken("regolito-claro");
  const lados = colorToken("roca-basalto").lerp(claro, TONO_ROCA.lados);
  const arriba = colorToken("regolito-medio").lerp(claro, TONO_ROCA.arriba);
  pintarPorNormal(geo, arriba, lados, colorToken("roca-basalto"), semilla, TONO_ROCA.variacion);
  geo.computeBoundingSphere();
  return geo;
}

/** A roughened piece without color or uv, ready to be merged and painted once. */
function pieza(base: THREE.BufferGeometry, semilla: number, dMin: number, dMax: number, cima: number, hundir: number): THREE.BufferGeometry {
  if (base.index) base = base.toNonIndexed();
  base.deleteAttribute("uv");
  const g = trozoFacetado(base, semilla, dMin, dMax, cima, hundir);
  g.deleteAttribute("color");
  return g;
}

/** Small loose stones around the foot of a rock: they make it sit in the ground instead of on it. */
function astillas(semilla: number, puntos: readonly [number, number, number][]): THREE.BufferGeometry[] {
  return puntos.map(([x, z, s], i) => {
    const g = pieza(new THREE.OctahedronGeometry(1, 0), semilla + i, 0.75, 1.15, 0.4, 0.1);
    g.scale(s, s * 0.7, s);
    g.rotateY(i * 1.3);
    g.translate(x, 0, z);
    return g;
  });
}

function unir(piezas: THREE.BufferGeometry[], semilla: number): THREE.BufferGeometry {
  const geo = mergeGeometries(piezas)!;
  geo.computeVertexNormals();
  return pintarRoca(geo, semilla);
}

/** Beveled plates (narrower top than bottom) stacked and turned, with chips. */
function geometriaLaja(): THREE.BufferGeometry {
  const capas = [
    { radio: 0.8, alto: 0.3, y: -0.08, giro: 0, dx: 0, dz: 0 },
    { radio: 0.62, alto: 0.27, y: 0.2, giro: 0.5, dx: 0.12, dz: -0.07 },
    { radio: 0.42, alto: 0.24, y: 0.45, giro: 1.1, dx: 0.04, dz: 0.1 },
  ];
  const placas = capas.map((c, i) => {
    const g = pieza(new THREE.CylinderGeometry(c.radio * 0.86, c.radio, c.alto, 7, 1), SEMILLA.laja + i, 0.86, 1.1, 10, 0);
    g.scale(1.25, 1, 1);
    g.rotateY(c.giro);
    g.translate(c.dx, c.y, c.dz);
    return g;
  });
  return unir([...placas, ...astillas(SEMILLA.astillas, [[0.95, 0.35, 0.16], [-0.7, -0.55, 0.12]])], SEMILLA.laja);
}

/** Angular block split in two: the main body and a broken piece leaning on its side, with chips. */
function geometriaPartida(): THREE.BufferGeometry {
  const cuerpo = new THREE.IcosahedronGeometry(1, 0);
  cuerpo.scale(0.95, 0.8, 0.85);
  const principal = pieza(cuerpo, SEMILLA.partida, 0.8, 1.12, 0.42, 0.16);
  const trozo = pieza(new THREE.IcosahedronGeometry(0.5, 0), SEMILLA.partida + 1, 0.8, 1.15, 0.3, 0.05);
  trozo.rotateZ(0.5);
  trozo.translate(0.85, -0.05, 0.3);
  return unir([principal, trozo, ...astillas(SEMILLA.astillas + 5, [[-0.75, 0.6, 0.14], [0.2, -0.85, 0.11]])], SEMILLA.partida);
}

/** Three rounded boulders (finer facets) of different sizes, leaning together, with chips. */
function geometriaRacimo(): THREE.BufferGeometry {
  const cantos = [
    { r: 0.62, x: 0, z: 0, y: 0.05 },
    { r: 0.42, x: 0.62, z: 0.28, y: -0.08 },
    { r: 0.3, x: -0.5, z: 0.45, y: -0.1 },
  ].map((c, i) => {
    const g = pieza(new THREE.IcosahedronGeometry(c.r, 1), SEMILLA.racimo + i, 0.88, 1.08, c.r * 0.7, c.r * 0.25);
    g.scale(1.1, 0.85, 1);
    g.translate(c.x, c.y, c.z);
    return g;
  });
  return unir([...cantos, ...astillas(SEMILLA.astillas + 9, [[0.15, -0.75, 0.13]])], SEMILLA.racimo);
}

/** Largest distance from the vertical axis (plan radius) of a geometry. */
function radioEnPlanta(geo: THREE.BufferGeometry): number {
  const pos = geo.getAttribute("position");
  let r = 0;
  for (let i = 0; i < pos.count; i++) r = Math.max(r, Math.hypot(pos.getX(i), pos.getZ(i)));
  return r;
}

/** Scales `geo` in plan so it is never wider than `limite` (keeps paths and collisions as they were). */
function noMasAncha(geo: THREE.BufferGeometry, limite: number): THREE.BufferGeometry {
  const r = radioEnPlanta(geo);
  if (r > limite) {
    geo.scale(limite / r, 1, limite / r);
    geo.computeBoundingSphere();
  }
  return geo;
}

type Familia = 0 | 1 | 2 | 3;
/** Family of the i-th rock: 0 keeps the original shape (fixed pattern, not random). */
function familia(i: number): Familia {
  const k = (i * 7 + 3) % 10;
  return k < 3 ? 0 : k < 5 ? 1 : k < 7 ? 2 : 3;
}

const FAMILIAS = [
  { clave: "roca-laja", fabrica: geometriaLaja, nombre: "Rocks_Slab" },
  { clave: "roca-partida", fabrica: geometriaPartida, nombre: "Rocks_Split" },
  { clave: "roca-racimo", fabrica: geometriaRacimo, nombre: "Rocks_Cluster" },
] as const;

function geometriasNuevas(original: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const limite = radioEnPlanta(original);
  return FAMILIAS.map((f) => geometriaBase(f.clave, () => noMasAncha(f.fabrica(), limite)));
}

/**
 * Moves part of the instances of `fuentes` to new InstancedMeshes (one per family) and returns them.
 * The source meshes keep only their family-0 instances (their `count` shrinks).
 */
export function variarRocas(fuentes: readonly THREE.InstancedMesh[]): THREE.InstancedMesh[] {
  const primera = fuentes[0];
  if (!primera) return [];
  const destino: THREE.Matrix4[][] = FAMILIAS.map(() => []);
  for (const fuente of fuentes) {
    const quedan: THREE.Matrix4[] = [];
    for (let i = 0; i < fuente.count; i++) {
      const m = new THREE.Matrix4();
      fuente.getMatrixAt(i, m);
      const f = familia(i);
      if (f === 0) quedan.push(m);
      else destino[f - 1]!.push(m);
    }
    quedan.forEach((m, i) => fuente.setMatrixAt(i, m));
    fuente.count = quedan.length;
    fuente.instanceMatrix.needsUpdate = true;
    fuente.computeBoundingSphere();
  }
  const geos = geometriasNuevas(primera.geometry);
  return destino
    .map((matrices, k) => {
      const malla = new THREE.InstancedMesh(geos[k]!, primera.material, matrices.length);
      malla.name = FAMILIAS[k]!.nombre;
      matrices.forEach((m, i) => malla.setMatrixAt(i, m));
      malla.instanceMatrix.needsUpdate = true;
      malla.computeBoundingSphere();
      malla.castShadow = true;
      malla.receiveShadow = true;
      return malla;
    })
    .filter((m) => m.count > 0);
}

/**
 * Dev-only review row (`?rocas=muestra`): the original rock and the three new families side by side, at
 * the first free spot found by `libre(x, z)` (off paths and buildings), so they can be compared.
 */
export function muestraRocas(material: THREE.Material | THREE.Material[], deRoca: THREE.BufferGeometry, libre: (x: number, z: number) => boolean): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = "Rocks_Review_Row";
  const geos = [deRoca, ...geometriasNuevas(deRoca)];
  const paso = 1.9;
  const ancho = paso * (geos.length - 1);
  // Search in front of the start view, from near to far, for a row where every rock is free.
  let origen: [number, number] | null = null;
  for (let z = 1; z <= 6 && !origen; z += 0.5) {
    for (let x = -10; x <= 10 - ancho && !origen; x += 0.5) {
      if (geos.every((_, i) => libre(x + i * paso, z))) origen = [x, z];
    }
  }
  if (!origen) return grupo;
  geos.forEach((g, i) => {
    const m = new THREE.Mesh(g, material);
    m.position.set(origen![0] + i * paso, 0, origen![1]);
    m.scale.setScalar(0.65);
    m.castShadow = true;
    m.receiveShadow = true;
    grupo.add(m);
  });
  return grupo;
}
