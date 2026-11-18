/**
 * Piezas originales de la colonia (Etapa D2): lo que el kit Craftpix no trae. Comparten el material del kit (UV a una
 * banda de su paleta) o el de regolito, así quedan en el mismo lenguaje visual y en la misma malla fusionada.
 * Cada pieza es un `Group` apoyado en y = 0 con el frente hacia +z. Medidas en metros. [E]
 */
import * as THREE from "three";
import { V_BANDA, type Banda } from "./polvoKit";

export interface MaterialesColonia {
  kit: THREE.MeshStandardMaterial;
  regolito: THREE.MeshStandardMaterial;
  /** Pantallas y luces pequeñas (cian de los terminales). */
  luz: THREE.MeshStandardMaterial;
  /** Luz ámbar baja de las balizas. */
  ambar: THREE.MeshStandardMaterial;
}

type V3 = readonly [number, number, number];

/** Geometría con toda la UV en el centro de una banda de la paleta. */
function enBanda<T extends THREE.BufferGeometry>(g: T, banda: Banda): T {
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, V_BANDA[banda]);
  return g;
}

function malla(g: THREE.BufferGeometry, m: THREE.Material, pos: V3, rot: V3 = [0, 0, 0]): THREE.Mesh {
  const x = new THREE.Mesh(g, m);
  x.position.set(...pos);
  x.rotation.set(...rot);
  x.castShadow = true;
  x.receiveShadow = true;
  return x;
}

const caja = (w: number, h: number, d: number, b: Banda) => enBanda(new THREE.BoxGeometry(w, h, d), b);
const cilindro = (r0: number, r1: number, h: number, lados: number, b: Banda) => enBanda(new THREE.CylinderGeometry(r0, r1, h, lados), b);

function grupo(nombre: string, ...hijos: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.name = nombre;
  g.add(...hijos);
  return g;
}

/** Aleatorio determinista (mismo armado en cada carga, sin `Math.random`). */
function semilla(s: number): () => number {
  let x = s >>> 0 || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------------------------------------
// Sacos de regolito (tarjeta `escudo_regolito`): bermas, escudo y refugio
// ---------------------------------------------------------------------------------------------

/** Saco: caja achatada con las aristas superiores caídas (8 vértices, se lee blando con la luz rasante). */
function geometriaSaco(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(0.62, 0.24, 0.36);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setXYZ(i, p.getX(i) * 0.86, p.getY(i), p.getZ(i) * 0.8);
  g.computeVertexNormals();
  return g;
}

/**
 * Berma de sacos a lo largo de un arco (centro en el origen, radio `r`, de `a0` a `a1` rad, 0 = +z) con `filas` hileras
 * trabadas, cada una un poco más adentro (talud). Una geometría compartida por todos los sacos.
 */
export function berma(m: MaterialesColonia, r: number, a0: number, a1: number, filas: number, s = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_Berm";
  const saco = geometriaSaco();
  const azar = semilla(s * 7919 + Math.round(r * 100));
  for (let f = 0; f < filas; f++) {
    const rf = r - f * 0.12;
    const n = Math.max(2, Math.round((Math.abs(a1 - a0) * rf) / 0.6));
    for (let i = 0; i < n; i++) {
      const t = (i + (f % 2 ? 0.5 : 0)) / n;
      if (t > 1) continue;
      const a = a0 + (a1 - a0) * t;
      const x = malla(saco, m.regolito, [Math.sin(a) * rf, 0.12 + f * 0.22, Math.cos(a) * rf], [0, a + Math.PI / 2 + (azar() - 0.5) * 0.25, (azar() - 0.5) * 0.08]);
      x.scale.set(0.9 + azar() * 0.25, 0.9 + azar() * 0.2, 1);
      g.add(x);
    }
  }
  return g;
}

/** Berma recta de `largo` m centrada en el origen, a lo largo de x. */
export function bermaRecta(m: MaterialesColonia, largo: number, filas: number, s = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_BermStraight";
  const saco = geometriaSaco();
  const azar = semilla(s * 104729);
  for (let f = 0; f < filas; f++) {
    const n = Math.max(2, Math.round(largo / 0.6));
    for (let i = 0; i < n; i++) {
      const x0 = -largo / 2 + (i + (f % 2 ? 0.5 : 0.25)) * (largo / n);
      if (x0 > largo / 2) continue;
      const x = malla(saco, m.regolito, [x0, 0.12 + f * 0.22, f * -0.1], [0, (azar() - 0.5) * 0.2, (azar() - 0.5) * 0.08]);
      x.scale.set(0.9 + azar() * 0.25, 0.9 + azar() * 0.2, 1);
      g.add(x);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// Módulos originales
// ---------------------------------------------------------------------------------------------

/**
 * Escudo (`escudo`, huella 2,2 × 4,0): muro de sacos de regolito de tres hileras a lo largo de z y un generador del
 * campo con aletas de disipación y acentos rojos del kit (< 2.000 triángulos).
 */
export function crearEscudoColonia(m: MaterialesColonia): THREE.Group {
  const muro = bermaRecta(m, 3.8, 4, 3);
  muro.rotation.y = Math.PI / 2;
  muro.position.x = -0.55;
  const gen = grupo(
    "Shield_Generator",
    malla(caja(1.0, 0.75, 1.1, "oscuro"), m.kit, [0, 0.375, 0]),
    malla(caja(0.9, 0.08, 1.0, "cuerpo"), m.kit, [0, 0.79, 0]),
    malla(cilindro(0.22, 0.26, 0.5, 8, "cuerpo"), m.kit, [0, 1.08, 0]),
    malla(cilindro(0.3, 0.3, 0.07, 8, "rojo"), m.kit, [0, 1.36, 0]),
    malla(caja(0.06, 0.5, 0.9, "rojo"), m.kit, [0.52, 0.38, 0]),
  );
  for (let i = 0; i < 5; i++) gen.add(malla(caja(0.04, 0.55, 0.9, "negro"), m.kit, [-0.28 + i * 0.14, 0.4, -0.62]));
  gen.position.set(0.15, 0, 1.4);
  return grupo("Shape_ShieldColony", muro, gen);
}

/**
 * Reciclador (`reciclador_agua`, huella 2,3 × 1,5): dos tanques horizontales sobre cunas y la tubería que sale hacia el
 * hábitat (módulos #2), < 2.000 triángulos.
 */
export function crearRecicladorColonia(m: MaterialesColonia): THREE.Group {
  const g = new THREE.Group();
  g.name = "Shape_RecyclerColony";
  for (const z of [-0.36, 0.36]) {
    g.add(malla(cilindro(0.32, 0.32, 1.9, 12, "cuerpo"), m.kit, [0, 0.55, z], [0, 0, Math.PI / 2]));
    for (const x of [-0.95, 0.95]) g.add(malla(cilindro(0.33, 0.33, 0.08, 12, "rojo"), m.kit, [x, 0.55, z], [0, 0, Math.PI / 2]));
    for (const x of [-0.55, 0.55]) g.add(malla(caja(0.16, 0.28, 0.5, "oscuro"), m.kit, [x, 0.14, z]));
  }
  // Colector entre tanques y tubería que baja y entra al hábitat por +z local (el anclaje gira -90°: +z mira al hábitat).
  g.add(malla(cilindro(0.07, 0.07, 0.9, 6, "oscuro"), m.kit, [-0.7, 0.95, 0], [Math.PI / 2, 0, 0]));
  g.add(malla(cilindro(0.07, 0.07, 0.75, 6, "oscuro"), m.kit, [-0.7, 0.6, 0.45]));
  g.add(malla(cilindro(0.07, 0.07, 1.1, 6, "oscuro"), m.kit, [-0.7, 0.25, 0.95], [Math.PI / 2, 0, 0]));
  g.add(malla(caja(0.24, 0.24, 0.12, "rojo"), m.kit, [-0.7, 0.25, 1.5]));
  g.add(malla(caja(0.36, 0.5, 0.3, "oscuro"), m.kit, [1.2, 0.25, 0.55]));
  return g;
}

// ---------------------------------------------------------------------------------------------
// Exterior chico
// ---------------------------------------------------------------------------------------------

/** Terminal exterior en poste (mesa y taller): no tapa nada detrás; conserva el punto de uso. */
export function crearTerminal(m: MaterialesColonia, alto = 1.15): THREE.Group {
  const cabeza = grupo(
    "Terminal_Head",
    malla(caja(0.62, 0.42, 0.1, "oscuro"), m.kit, [0, 0, 0]),
    malla(caja(0.52, 0.32, 0.02, "negro"), m.luz, [0, 0, 0.06]),
    malla(caja(0.66, 0.05, 0.16, "rojo"), m.kit, [0, 0.24, 0]),
  );
  cabeza.position.set(0, alto, 0.05);
  cabeza.rotation.x = -0.45;
  return grupo(
    "Colony_Terminal",
    malla(cilindro(0.26, 0.32, 0.1, 8, "oscuro"), m.kit, [0, 0.05, 0]),
    malla(cilindro(0.05, 0.065, alto, 6, "cuerpo"), m.kit, [0, alto / 2, 0]),
    malla(caja(0.22, 0.3, 0.12, "oscuro"), m.kit, [0, 0.45, -0.05]),
    cabeza,
  );
}

/**
 * Estación meteorológica automática (lugar `sensor`, Meteoróloga): mástil con anemómetro de cazoletas, veleta y caja de
 * sensores, como la MEDA de Perseverance; nada de laboratorio afuera (restricción del 17 nov, línea 7).
 */
export function crearEstacionMeteo(m: MaterialesColonia): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_WeatherMast";
  const h = 2.6;
  g.add(
    malla(cilindro(0.35, 0.42, 0.12, 8, "oscuro"), m.kit, [0, 0.06, 0]),
    malla(cilindro(0.04, 0.05, h, 6, "cuerpo"), m.kit, [0, h / 2, 0]),
    malla(caja(0.36, 0.42, 0.24, "cuerpo"), m.kit, [0, 0.62, 0.1]),
    malla(caja(0.3, 0.06, 0.2, "rojo"), m.kit, [0, 0.86, 0.1]),
    malla(caja(0.8, 0.03, 0.03, "oscuro"), m.kit, [0, h * 0.72, 0]),
    malla(caja(0.1, 0.14, 0.1, "negro"), m.kit, [0.4, h * 0.72 - 0.08, 0]),
    malla(caja(0.1, 0.14, 0.1, "negro"), m.kit, [-0.4, h * 0.72 - 0.08, 0]),
    malla(cilindro(0.02, 0.02, 0.5, 4, "oscuro"), m.kit, [0, h + 0.02, 0], [0, 0, Math.PI / 2]),
    malla(caja(0.04, 0.16, 0.2, "rojo"), m.kit, [0.25, h + 0.02, 0]),
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(malla(cilindro(0.012, 0.012, 0.3, 4, "oscuro"), m.kit, [Math.sin(a) * 0.15, h + 0.22, Math.cos(a) * 0.15], [0, a, Math.PI / 2]));
    g.add(malla(enBanda(new THREE.SphereGeometry(0.05, 6, 4), "cuerpo"), m.kit, [Math.sin(a) * 0.3, h + 0.22, Math.cos(a) * 0.3]));
  }
  // Panel solar propio del mástil.
  g.add(malla(caja(0.5, 0.03, 0.36, "negro"), m.kit, [0, 1.4, 0.18], [-0.6, 0, 0]));
  return g;
}

/** Sismómetro automático: cúpula protectora contra el viento sobre una losa, con cable (como el de InSight). */
export function crearSismometro(m: MaterialesColonia): THREE.Group {
  const domo = enBanda(new THREE.SphereGeometry(0.42, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), "cuerpo");
  return grupo(
    "Colony_Seismometer",
    malla(cilindro(0.55, 0.6, 0.06, 10, "oscuro"), m.regolito, [0, 0.03, 0]),
    malla(domo, m.kit, [0, 0.06, 0]),
    malla(cilindro(0.44, 0.44, 0.06, 10, "rojo"), m.kit, [0, 0.09, 0]),
    malla(cilindro(0.025, 0.025, 1.6, 4, "negro"), m.kit, [0.9, 0.025, 0.4], [0, 0.4, Math.PI / 2]),
  );
}

/** Baliza de camino: poste bajo oscuro, con polvo y una luz ámbar pequeña (sin tapa cian). */
export function crearBalizaColonia(m: MaterialesColonia): THREE.Group {
  return grupo(
    "Colony_Beacon",
    malla(cilindro(0.09, 0.12, 0.08, 6, "oscuro"), m.kit, [0, 0.04, 0]),
    malla(cilindro(0.045, 0.055, 0.42, 6, "oscuro"), m.kit, [0, 0.25, 0]),
    malla(caja(0.07, 0.05, 0.07, "negro"), m.ambar, [0, 0.48, 0]),
  );
}

/** Losa de regolito sinterizado a ras del suelo (anclaje de módulo): octógono de `ancho` × `fondo`. */
export function crearLosa(m: MaterialesColonia, ancho: number, fondo: number): THREE.Mesh {
  const g = new THREE.CylinderGeometry(0.5, 0.52, 0.05, 8);
  const x = malla(g, m.regolito, [0, 0.025, 0]);
  x.scale.set(ancho, 1, fondo);
  x.castShadow = false;
  x.name = "Colony_Slab";
  return x;
}

/** Contenedor de carga: caja con nervios y franja roja del kit. */
export function crearContenedor(m: MaterialesColonia): THREE.Group {
  return grupo(
    "Colony_Crate",
    malla(caja(1.2, 0.8, 0.8, "cuerpo"), m.kit, [0, 0.4, 0]),
    malla(caja(1.24, 0.1, 0.84, "rojo"), m.kit, [0, 0.62, 0]),
    malla(caja(0.08, 0.82, 0.84, "oscuro"), m.kit, [-0.45, 0.41, 0]),
    malla(caja(0.08, 0.82, 0.84, "oscuro"), m.kit, [0.45, 0.41, 0]),
  );
}
