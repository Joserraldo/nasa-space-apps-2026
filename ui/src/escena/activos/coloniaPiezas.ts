/**
 * Piezas originales de la colonia (Etapas D2 y D3): lo que ni el kit Craftpix ni los modelos CC BY traen. Comparten el
 * material del kit (UV a una banda de su paleta y color por vértice para el acento por función), el de regolito o el
 * de luces, así quedan en el mismo lenguaje visual y en la misma malla fusionada.
 * Cada pieza es un `Group` apoyado en y = 0 con el frente hacia +z. Medidas en metros. [E]
 *
 * Referencias (`clasificacion-objetos.md`): siluetas de Low Poly Sci-Fi Station (poste de aterrizaje a rayas, franja de
 * peligro, barril, carrete de cable, contenedor, generador) y la foto del HDU de NASA en Desert RATS 2011 (porche,
 * franja amarilla y negra sobre la puerta, barriles, manguera). Sin insignias ni texto.
 */
import * as THREE from "three";
import { ACENTOS, V_BANDA, colorSobreCuerpo, type Acento, type Banda } from "./polvoKit";

export interface MaterialesColonia {
  kit: THREE.MeshStandardMaterial;
  regolito: THREE.MeshStandardMaterial;
  /** Luces chicas de cualquier color (sin iluminación, color por vértice). */
  luz: THREE.Material;
  /** Vidrio de los domos (transparente, color por vértice). */
  vidrio: THREE.Material;
  /** Marco blanco de los domos (misma paleta, poco polvo). */
  marco: THREE.MeshStandardMaterial;
}

type V3 = readonly [number, number, number];

/** Pinta toda la geometría de un color (atributo `color`, lineal). */
export function pintar<T extends THREE.BufferGeometry>(g: T, c: THREE.Color): T {
  const n = g.getAttribute("position").count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

/** Geometría con toda la UV en el centro de una banda de la paleta. */
function enBanda<T extends THREE.BufferGeometry>(g: T, banda: Banda): T {
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, V_BANDA[banda]);
  return g;
}

/** Color de pieza: una banda de la paleta tal cual o un acento por función sobre la banda clara. */
export type Tono = Banda | Acento;
const BANDAS: readonly string[] = ["negro", "rojo", "oscuro", "cuerpo"];
export function tonear<T extends THREE.BufferGeometry>(g: T, t: Tono): T {
  if (BANDAS.includes(t)) return pintar(enBanda(g, t as Banda), new THREE.Color(1, 1, 1));
  return pintar(enBanda(g, "cuerpo"), colorSobreCuerpo(t as Acento));
}

/** Color de una luz: el acento (o un hex) en lineal por un brillo (sobre 1 brilla). */
export function colorLuz(t: Acento | string, brillo = 1.6): THREE.Color {
  const hex = (ACENTOS as Record<string, string>)[t] ?? t;
  return new THREE.Color(hex).multiplyScalar(brillo);
}

function malla(g: THREE.BufferGeometry, m: THREE.Material, pos: V3, rot: V3 = [0, 0, 0]): THREE.Mesh {
  const x = new THREE.Mesh(g, m);
  x.position.set(...pos);
  x.rotation.set(...rot);
  x.castShadow = true;
  x.receiveShadow = true;
  return x;
}

export const caja = (w: number, h: number, d: number, t: Tono) => tonear(new THREE.BoxGeometry(w, h, d), t);
export const cilindro = (r0: number, r1: number, h: number, lados: number, t: Tono) => tonear(new THREE.CylinderGeometry(r0, r1, h, lados), t);
/** Piezas de luz (material de luces). */
export const luzCaja = (w: number, h: number, d: number, t: Acento | string, brillo?: number) => pintar(new THREE.BoxGeometry(w, h, d), colorLuz(t, brillo));
export const luzCil = (r: number, h: number, lados: number, t: Acento | string, brillo?: number) => pintar(new THREE.CylinderGeometry(r, r, h, lados), colorLuz(t, brillo));

export function grupo(nombre: string, ...hijos: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.name = nombre;
  if (hijos.length) g.add(...hijos);
  return g;
}

/** Aleatorio determinista (mismo armado en cada carga, sin `Math.random`). */
export function semilla(s: number): () => number {
  let x = s >>> 0 || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Pieza del kit en una posición (para armar piezas compuestas desde otros archivos). */
export function parteKit(g: THREE.BufferGeometry, m: MaterialesColonia, pos: V3, rot?: V3): THREE.Mesh {
  return malla(g, m.kit, pos, rot);
}
/** Pieza del marco blanco (domos) en una posición. */
export function parteMarco(g: THREE.BufferGeometry, m: MaterialesColonia, pos: V3, rot?: V3): THREE.Mesh {
  return malla(g, m.marco, pos, rot);
}
/** Pieza de luz en una posición. */
export function parteLuz(g: THREE.BufferGeometry, m: MaterialesColonia, pos: V3, rot?: V3): THREE.Mesh {
  const x = malla(g, m.luz, pos, rot);
  x.castShadow = false;
  return x;
}

// ---------------------------------------------------------------------------------------------
// Sacos de regolito (tarjeta `escudo_regolito`): bermas, escudo y refugio
// ---------------------------------------------------------------------------------------------

/**
 * Saco lleno: almohada baja y redondeada (elipsoide de 6 × 3 caras con la base aplastada), de tela con polvo. Los
 * sacos de D2 eran cajas en hileras trabadas y se leían como ladrillos; estos se apoyan, se solapan y se hunden. [E]
 */
function geometriaSaco(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(0.5, 6, 3);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setXYZ(i, p.getX(i) * 0.68, y < 0 ? y * 0.45 : y, p.getZ(i) * 0.4);
  }
  g.scale(1, 0.46, 1);
  g.computeVertexNormals();
  return tonear(g, "tela");
}

/** Un saco con variación de tamaño, giro y caída (determinista). */
function saco(m: MaterialesColonia, geo: THREE.BufferGeometry, x: number, y: number, z: number, giro: number, azar: () => number): THREE.Mesh {
  const s = malla(geo, m.kit, [x, y, z], [(azar() - 0.5) * 0.12, giro + (azar() - 0.5) * 0.3, (azar() - 0.5) * 0.14]);
  s.scale.set(0.92 + azar() * 0.2, 0.85 + azar() * 0.3, 0.92 + azar() * 0.18);
  return s;
}

/** Alto de una hilera de sacos, paso a lo largo (se solapan un 20 %) y retiro de cada hilera (talud). [E] */
const SACO = { alto: 0.19, paso: 0.54, adentro: 0.13 } as const;

/**
 * Berma de sacos a lo largo de un arco (centro en el origen, radio `r`, de `a0` a `a1` rad, 0 = +z) con `filas` hileras,
 * cada una un poco más adentro (talud) y corrida medio saco. Una geometría compartida por todos los sacos.
 */
export function berma(m: MaterialesColonia, r: number, a0: number, a1: number, filas: number, s = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_Berm";
  const geo = geometriaSaco();
  const azar = semilla(s * 7919 + Math.round(r * 100));
  for (let f = 0; f < filas; f++) {
    const rf = r - f * SACO.adentro;
    const n = Math.max(2, Math.round((Math.abs(a1 - a0) * rf) / SACO.paso)) - (f > 0 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5 + (f % 2 ? 0.5 : 0)) / (n + (f % 2 ? 1 : 0));
      const a = a0 + (a1 - a0) * t;
      g.add(saco(m, geo, Math.sin(a) * rf, 0.08 + f * SACO.alto, Math.cos(a) * rf, a + Math.PI / 2, azar));
    }
  }
  return g;
}

/** Puntos (en el marco de la berma) que ocupa una berma de arco: para su colisión. */
export function puntosBerma(r: number, a0: number, a1: number, paso = 0.7): { x: number; z: number }[] {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / paso));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return { x: Math.sin(a) * (r - 0.1), z: Math.cos(a) * (r - 0.1) };
  });
}

/** Berma recta de `largo` m centrada en el origen, a lo largo de x. */
export function bermaRecta(m: MaterialesColonia, largo: number, filas: number, s = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_BermStraight";
  const geo = geometriaSaco();
  const azar = semilla(s * 104729);
  const n0 = Math.max(2, Math.round(largo / SACO.paso));
  for (let f = 0; f < filas; f++) {
    const n = n0 - (f % 2);
    for (let i = 0; i < n; i++) {
      const x0 = -largo / 2 + (i + 0.5 + (f % 2) * 0.5) * (largo / n0);
      g.add(saco(m, geo, x0, 0.08 + f * SACO.alto, -f * SACO.adentro, 0, azar));
    }
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// Módulos originales
// ---------------------------------------------------------------------------------------------

/**
 * Escudo (`escudo`, huella 2,2 × 4,0): muro de sacos de regolito de cuatro hileras a lo largo de z (el regolito apilado
 * frena la radiación, tarjeta `escudo_regolito`) y el generador con acento amarillo de energía (< 2.000 triángulos).
 */
export function crearEscudoColonia(m: MaterialesColonia): THREE.Group {
  const muro = bermaRecta(m, 3.8, 4, 3);
  muro.rotation.y = Math.PI / 2;
  muro.position.x = -0.45;
  const gen = grupo(
    "Shield_Generator",
    malla(caja(1.0, 0.75, 1.1, "oscuro"), m.kit, [0, 0.375, 0]),
    malla(caja(1.04, 0.12, 1.14, "amarillo"), m.kit, [0, 0.62, 0]),
    malla(caja(0.9, 0.08, 1.0, "cuerpo"), m.kit, [0, 0.79, 0]),
    malla(cilindro(0.22, 0.26, 0.5, 8, "cuerpo"), m.kit, [0, 1.08, 0]),
    parteLuz(luzCil(0.16, 0.06, 8, "amarillo", 1.8), m, [0, 1.36, 0]),
  );
  for (let i = 0; i < 5; i++) gen.add(malla(caja(0.04, 0.55, 0.9, "negro"), m.kit, [-0.28 + i * 0.14, 0.4, -0.62]));
  gen.position.set(0.3, 0, 1.3);
  return grupo("Shape_ShieldColony", muro, gen);
}

/**
 * Tuberías del reciclador (agua usada que entra y agua limpia que sale, tarjeta `agua_reciclada`): dos caños paralelos
 * sobre soportes, de `desde` a `hasta` por +z local, con bandas azules de agua y bridas donde entran al hábitat.
 */
export function crearTuberias(m: MaterialesColonia, desde: number, hasta: number): THREE.Group {
  const g = new THREE.Group();
  g.name = "Recycler_Pipes";
  const largo = hasta - desde;
  for (const [x, y] of [[-0.22, 0.42], [0.22, 0.62]] as const) {
    g.add(malla(cilindro(0.075, 0.075, largo, 6, "blanco"), m.kit, [x, y, desde + largo / 2], [Math.PI / 2, 0, 0]));
    for (let t = 0.35; t < largo - 0.1; t += 0.6) g.add(malla(cilindro(0.085, 0.085, 0.08, 6, "azul"), m.kit, [x, y, desde + t], [Math.PI / 2, 0, 0]));
    g.add(malla(cilindro(0.13, 0.13, 0.06, 8, "azul"), m.kit, [x, y, hasta - 0.05], [Math.PI / 2, 0, 0]));
  }
  for (let t = 0.3; t < largo; t += 0.9) {
    g.add(malla(caja(0.7, 0.05, 0.06, "oscuro"), m.kit, [0, 0.66, desde + t]));
    for (const x of [-0.32, 0.32]) g.add(malla(caja(0.05, 0.66, 0.05, "oscuro"), m.kit, [x, 0.33, desde + t]));
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// Entrada obvia (kit repetible para todo módulo habitable, `clasificacion-objetos.md`)
// ---------------------------------------------------------------------------------------------

/** Poste de aterrizaje a rayas amarillas y negras con luz del acento arriba (silueta de `SM_Landing_Light`). */
export function crearPosteLuz(m: MaterialesColonia, acento: Acento, alto = 1.15): THREE.Group {
  const g = grupo("Colony_LightPost", malla(cilindro(0.13, 0.16, 0.08, 8, "oscuro"), m.kit, [0, 0.04, 0]));
  const n = 4;
  for (let i = 0; i < n; i++) g.add(malla(cilindro(0.045, 0.045, alto / n, 6, i % 2 ? "negro" : "amarillo"), m.kit, [0, 0.08 + (i + 0.5) * (alto / n), 0]));
  g.add(malla(cilindro(0.09, 0.07, 0.05, 8, "oscuro"), m.kit, [0, alto + 0.1, 0]));
  g.add(parteLuz(luzCil(0.08, 0.12, 8, acento, 1.9), m, [0, alto + 0.19, 0]));
  return g;
}

/** Franja de peligro amarilla y negra (`SM_Floor_Hazard_Edge`): `n` bandas a lo largo de x. */
export function franjaPeligro(m: MaterialesColonia, ancho: number, alto: number, fondo: number, n: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(malla(caja(ancho / n, alto, fondo, i % 2 ? "negro" : "amarillo"), m.kit, [-ancho / 2 + (i + 0.5) * (ancho / n), 0, 0]));
  return g;
}

/** Barril (silueta de `SM_Fuel_Barrel`) del color del acento, con dos aros. */
export function crearBarril(m: MaterialesColonia, acento: Acento): THREE.Group {
  return grupo(
    "Colony_Barrel",
    malla(cilindro(0.26, 0.26, 0.82, 10, acento), m.kit, [0, 0.41, 0]),
    malla(cilindro(0.27, 0.27, 0.05, 10, "oscuro"), m.kit, [0, 0.24, 0]),
    malla(cilindro(0.27, 0.27, 0.05, 10, "oscuro"), m.kit, [0, 0.6, 0]),
    malla(cilindro(0.22, 0.22, 0.03, 10, "oscuro"), m.kit, [0, 0.83, 0]),
  );
}

/** Carrete de cable (silueta de `SM_Cable_Spool`). */
export function crearCarrete(m: MaterialesColonia): THREE.Group {
  const rot: V3 = [0, 0, Math.PI / 2];
  return grupo(
    "Colony_CableSpool",
    malla(cilindro(0.36, 0.36, 0.05, 8, "aluminio"), m.kit, [-0.24, 0.36, 0], rot),
    malla(cilindro(0.36, 0.36, 0.05, 8, "aluminio"), m.kit, [0.24, 0.36, 0], rot),
    malla(cilindro(0.22, 0.22, 0.44, 8, "negro"), m.kit, [0, 0.36, 0], rot),
  );
}

/** Manguera de fuelle (foto del HDU): tubo curvo de `a` a `b` que se apoya en el suelo a mitad de camino. */
export function crearManguera(m: MaterialesColonia, a: V3, b: V3): THREE.Mesh {
  const medio = new THREE.Vector3((a[0] + b[0]) / 2, 0.08, (a[2] + b[2]) / 2);
  const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), medio, new THREE.Vector3(...b)]);
  return malla(tonear(new THREE.TubeGeometry(curva, 10, 0.06, 5, false), "oscuro"), m.kit, [0, 0, 0]);
}

/**
 * Entrada de un módulo habitable, con la puerta en el origen mirando a +z: porche de regolito sinterizado con franja de
 * peligro al borde, dos postes de luz del acento, barra de luz sobre la puerta (`altoPuerta`) y franja amarilla y negra
 * encima, como sobre la puerta del HDU.
 */
export function crearEntrada(m: MaterialesColonia, acento: Acento, ancho = 2.0, altoPuerta = 2.0): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_Entrance";
  g.add(malla(caja(ancho, 0.06, 1.3, "oscuro"), m.regolito, [0, 0.03, 0.65]));
  const borde = franjaPeligro(m, ancho, 0.02, 0.16, 8);
  borde.position.set(0, 0.07, 1.2);
  g.add(borde);
  const arriba = franjaPeligro(m, ancho * 0.6, 0.12, 0.05, 6);
  arriba.position.set(0, altoPuerta + 0.22, 0.04);
  g.add(arriba);
  g.add(parteLuz(luzCaja(ancho * 0.5, 0.07, 0.05, acento, 1.8), m, [0, altoPuerta + 0.06, 0.06]));
  for (const s of [-1, 1]) {
    const p = crearPosteLuz(m, acento);
    p.position.set(s * (ancho / 2 + 0.25), 0, 1.15);
    g.add(p);
  }
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
    parteLuz(luzCaja(0.52, 0.32, 0.02, "#7fe3ef", 1.3), m, [0, 0, 0.06]),
    malla(caja(0.66, 0.05, 0.16, "cian"), m.kit, [0, 0.24, 0]),
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
    malla(caja(0.36, 0.42, 0.24, "blanco"), m.kit, [0, 0.62, 0.1]),
    malla(caja(0.3, 0.06, 0.2, "cian"), m.kit, [0, 0.86, 0.1]),
    malla(caja(0.8, 0.03, 0.03, "oscuro"), m.kit, [0, h * 0.72, 0]),
    malla(caja(0.1, 0.14, 0.1, "negro"), m.kit, [0.4, h * 0.72 - 0.08, 0]),
    malla(caja(0.1, 0.14, 0.1, "negro"), m.kit, [-0.4, h * 0.72 - 0.08, 0]),
    malla(cilindro(0.02, 0.02, 0.5, 4, "oscuro"), m.kit, [0, h + 0.02, 0], [0, 0, Math.PI / 2]),
    malla(caja(0.04, 0.16, 0.2, "cian"), m.kit, [0.25, h + 0.02, 0]),
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(malla(cilindro(0.012, 0.012, 0.3, 4, "oscuro"), m.kit, [Math.sin(a) * 0.15, h + 0.22, Math.cos(a) * 0.15], [0, a, Math.PI / 2]));
    g.add(malla(tonear(new THREE.SphereGeometry(0.05, 6, 4), "blanco"), m.kit, [Math.sin(a) * 0.3, h + 0.22, Math.cos(a) * 0.3]));
  }
  // Panel solar propio del mástil.
  g.add(malla(caja(0.5, 0.03, 0.36, "negro"), m.kit, [0, 1.4, 0.18], [-0.6, 0, 0]));
  return g;
}

/** Sismómetro automático: cúpula protectora contra el viento sobre una losa, con cable (como el de InSight). */
export function crearSismometro(m: MaterialesColonia): THREE.Group {
  const domo = tonear(new THREE.SphereGeometry(0.42, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), "blanco");
  return grupo(
    "Colony_Seismometer",
    malla(cilindro(0.55, 0.6, 0.06, 10, "oscuro"), m.regolito, [0, 0.03, 0]),
    malla(domo, m.kit, [0, 0.06, 0]),
    malla(cilindro(0.44, 0.44, 0.06, 10, "cian"), m.kit, [0, 0.09, 0]),
    malla(cilindro(0.025, 0.025, 1.6, 4, "negro"), m.kit, [0.9, 0.025, 0.4], [0, 0.4, Math.PI / 2]),
  );
}

/** Baliza de camino: poste bajo a rayas amarillas y negras con luz ámbar pequeña (silueta de `SM_Landing_Light`). */
export function crearBalizaColonia(m: MaterialesColonia): THREE.Group {
  return grupo(
    "Colony_Beacon",
    malla(cilindro(0.09, 0.12, 0.06, 6, "oscuro"), m.kit, [0, 0.03, 0]),
    malla(cilindro(0.045, 0.045, 0.14, 6, "amarillo"), m.kit, [0, 0.13, 0]),
    malla(cilindro(0.045, 0.045, 0.14, 6, "negro"), m.kit, [0, 0.27, 0]),
    malla(cilindro(0.045, 0.045, 0.12, 6, "amarillo"), m.kit, [0, 0.4, 0]),
    parteLuz(luzCaja(0.07, 0.05, 0.07, "#ffa040", 1.7), m, [0, 0.48, 0]),
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

/** Contenedor de carga (silueta de `SM_Cargo_Container`): cuerpo naranja de depósito con marco oscuro. */
export function crearContenedor(m: MaterialesColonia): THREE.Group {
  return grupo(
    "Colony_Crate",
    malla(caja(1.2, 0.8, 0.8, "naranja"), m.kit, [0, 0.4, 0]),
    malla(caja(1.24, 0.08, 0.84, "oscuro"), m.kit, [0, 0.8, 0]),
    malla(caja(0.08, 0.82, 0.84, "oscuro"), m.kit, [-0.58, 0.41, 0]),
    malla(caja(0.08, 0.82, 0.84, "oscuro"), m.kit, [0.58, 0.41, 0]),
    malla(caja(0.4, 0.2, 0.02, "blanco"), m.kit, [0, 0.5, 0.41]),
  );
}
