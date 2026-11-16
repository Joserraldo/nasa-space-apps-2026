/**
 * Los 5 módulos de la base: qué partes se ven en cada estado (issue #180) y su forma low poly.
 * La regla visual (funciones puras) va arriba, para que la escena la reconcilie siempre desde
 * `VistaEscena` (APLICACION.md §1 `ModeloModulo`, §8 tiempos; ESCENAS.md §3.2).
 * Ninguna malla toca recursos: el motor manda (MECANICAS.md §5).
 */
import * as THREE from "three";
import type { Equipment } from "@solar-shield/contracts";
import { colorToken, geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, crearDeposito, crearPuerta, parte, tronco } from "./piezasComunes";
import type { EstadoModulo } from "../vista";

/** Los cinco anclajes que siempre existen en la base (ESCENAS.md §3.2). La batería y la IA no son anclajes. */
export const MODULOS_BASE = ["panel_solar", "reciclador_agua", "escudo", "invernadero", "antena"] as const satisfies readonly Equipment[];
export type ModuloBase = (typeof MODULOS_BASE)[number];

/** Partes de `ModeloModulo` (APLICACION.md §1) que se muestran en cada estado. */
export interface PartesVisibles {
  /** Base del anclaje vacío: siempre visible, también como "propuesta" marcada en el suelo. */
  anclaje: true;
  solido: boolean;
  andamio: boolean;
  /** Piezas animadas (luces, giros): solo cuando funciona. */
  vivos: boolean;
  /** Piezas en reposo del módulo construido. */
  reposo: boolean;
}

export function partesVisibles(estado: EstadoModulo): PartesVisibles {
  switch (estado) {
    case "ausente":
      return { anclaje: true, solido: false, andamio: false, vivos: false, reposo: false };
    case "instalando":
      return { anclaje: true, solido: false, andamio: true, vivos: false, reposo: false };
    case "funcionando":
      return { anclaje: true, solido: true, andamio: false, vivos: true, reposo: true };
    case "averiado":
      // Construido pero apagado: se ve el módulo, sin luces ni giros.
      return { anclaje: true, solido: true, andamio: false, vivos: false, reposo: true };
  }
}

/** Tiempos de transición (APLICACION.md §8): instalando 400 ms; luz o check de operativo 240 ms. */
export const TIEMPOS_MODULO_MS = { instalando: 400, operativo: 240 } as const;

/** Módulos que se ven construidos (sólido o andamio). */
export function construidos(modulos: Readonly<Record<Equipment, EstadoModulo>>): ModuloBase[] {
  return MODULOS_BASE.filter((m) => modulos[m] !== "ausente");
}

/**
 * Regla de la misión: solo los módulos que el jugador construyó se ven construidos, como máximo 2
 * en la ruta dorada (ESCENAS.md §3.2). Devuelve false si la vista pide más de `maximo`: la escena no
 * lo corrige (el motor manda), pero un test o un aviso de desarrollo lo detectan.
 */
export function respetaMaximoConstruidos(modulos: Readonly<Record<Equipment, EstadoModulo>>, maximo = 2): boolean {
  return construidos(modulos).length <= maximo;
}

// ---------------------------------------------------------------------------------------------
// Formas low poly de los cinco módulos (lámina `mundo/01`, `exterior/03`, piezas/04, 06 y 08).
// Cada forma es un `Group` apoyado en y = 0, con el frente hacia +z; `armado.ts` la fusiona por
// material. Las huellas respetan los círculos de colisión de `TERRENO` (mundo.ts).
// ---------------------------------------------------------------------------------------------

export interface FormaModulo {
  /** Ancho (x) y fondo (z) de la huella, en metros. */
  huella: [number, number];
  alto: number;
  /** Giro fijo; si falta, el módulo mira al punto donde se para el jugador. */
  giro?: number;
}

const ESCALA_RECICLADOR = 0.8;
const ESCALA_INVERNADERO = 0.72;

/** Huellas a partir de los círculos de colisión de `TERRENO` (mundo.ts). [E] */
export const FORMA_MODULO: Readonly<Record<ModuloBase, FormaModulo>> = {
  panel_solar: { huella: [6.8, 2.4], alto: 2.1, giro: 0 },
  escudo: { huella: [2.2, 4.0], alto: 2.4, giro: 0 },
  reciclador_agua: { huella: [2.9 * ESCALA_RECICLADOR, 1.9 * ESCALA_RECICLADOR], alto: 2.5 * ESCALA_RECICLADOR, giro: -Math.PI / 2 },
  invernadero: { huella: [7.8 * ESCALA_INVERNADERO, 7.8 * ESCALA_INVERNADERO], alto: 4 * ESCALA_INVERNADERO, giro: 0 },
  antena: { huella: [2.2, 2.2], alto: 3.6 },
};

type V3 = [number, number, number];

function grupo(nombre: string, ...hijos: THREE.Object3D[]): THREE.Group {
  const x = new THREE.Group();
  x.name = nombre;
  if (hijos.length) x.add(...hijos);
  return x;
}

/** Coloca, gira y escala un objeto (devuelve el mismo objeto). */
export function colocar<T extends THREE.Object3D>(o: T, pos: V3, rot: V3 = [0, 0, 0], esc: number | V3 = 1): T {
  o.position.set(...pos);
  o.rotation.set(...rot);
  if (typeof esc === "number") o.scale.setScalar(esc);
  else o.scale.set(...esc);
  return o;
}

/** Plataforma solar: losa chaflanada, una fila de 2 paneles separados sobre su base y controlador. */
function panelSolar(m: Materiales): THREE.Group {
  const x = grupo("Shape_SolarPanel");
  x.add(colocar(parte(m, "SuitBase", chaflan(6.8, 2.4, 0.22, 0.6), [0, 0, 0], "Solar_Slab"), [0, 0.11, 0], [-Math.PI / 2, 0, 0]));
  const celda = geometriaBase("mod-celda", () => new THREE.PlaneGeometry(0.56, 0.62));
  for (const dz of [0]) {
    x.add(parte(m, "SuitBase", chaflan(5.8, 0.3, 0.8, 0.1), [0, 0.37, dz], "Solar_Rail"));
    for (const dx of [-1.38, 1.38]) {
      x.add(parte(m, "SuitBase", caja(0.24, 0.7, 0.24), [dx, 0.85, dz], "Solar_Post"));
      const cabeza = colocar(grupo("Solar_Head"), [dx, 1.25, dz], [-1.1, 0, 0]);
      cabeza.add(parte(m, "SuitBase", chaflan(2.6, 1.5, 0.07, 0.12), [0, 0, 0], "Solar_Plate"));
      for (let f = 0; f < 2; f++)
        for (let c = 0; c < 4; c++) cabeza.add(parte(m, "Boots", celda, [(c - 1.5) * 0.6, (f - 0.5) * 0.66, 0.04], "Solar_Cell"));
      x.add(cabeza);
    }
  }
  // Controlador al frente (la pantalla se dibuja aparte cuando haya datos reales).
  x.add(parte(m, "SuitBase", chaflan(0.7, 0.9, 0.45, 0.1), [-2.9, 0.67, 0.75], "Solar_Controller"));
  x.add(parte(m, "Emissive", caja(0.4, 0.22, 0.02), [-2.9, 0.85, 0.98], "Solar_ControllerLight"));
  return x;
}

/** Montículo de regolito facetado (color de vértice, slot Rock): bóveda del refugio. */
export function geometriaMonticulo(): THREE.BufferGeometry {
  const s = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  const p = s.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // Desplazamiento determinista por posición (mismo vértice, mismo valor: malla cerrada).
    const k = y > 0.05 ? 1 + 0.08 * Math.sin(p.getX(i) * 7.1 + p.getZ(i) * 5.3) : 1;
    p.setXYZ(i, p.getX(i) * 1.1 * k, y * 2.2 * k, p.getZ(i) * 1.75 * k);
  }
  s.computeVertexNormals();
  const n = s.getAttribute("normal");
  const claro = colorToken("regolito-claro").lerp(colorToken("sombra-suelo"), 0.3);
  const medio = colorToken("regolito-medio");
  const c = new THREE.Color();
  const col = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i += 3) {
    c.copy(medio).lerp(claro, Math.min(1, Math.max(0, n.getY(i))));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  s.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return s;
}

/**
 * Silueta del icono `escudo` del HUD (componentes/base/Iconos.tsx, viewBox 24): hombros
 * achaflanados, lados rectos y punta roma abajo. Normalizada a ancho 1 y alto 1, centrada en su caja.
 */
const SILUETA_ESCUDO: readonly [number, number][] = (
  [[12, 2.5], [20, 5.2], [19.6, 12.5], [16.8, 17.6], [12, 21.2], [7.2, 17.6], [4.4, 12.5], [4, 5.2]] as const
).map(([x, y]) => [(x - 12) / 16, (11.85 - y) / 18.7]);

/** Placa con la silueta del escudo, `ancho`×`alto`, extruida `grosor` en z y centrada. */
function placaEscudo(ancho: number, alto: number, grosor: number): THREE.BufferGeometry {
  return geometriaBase(`mod-escudo-placa-${ancho}-${alto}-${grosor}`, () => {
    const forma = new THREE.Shape(SILUETA_ESCUDO.map(([x, y]) => new THREE.Vector2(x * ancho, y * alto)));
    const g = new THREE.ExtrudeGeometry(forma, { depth: grosor, bevelEnabled: false });
    g.translate(0, 0, -grosor / 2);
    return g;
  });
}

/** Banda fina que sigue el borde superior (hombros y cresta) de una placa de escudo. */
function bandaEscudo(ancho: number, alto: number, grosor: number, banda: number): THREE.BufferGeometry {
  return geometriaBase(`mod-escudo-banda-${ancho}-${alto}-${grosor}-${banda}`, () => {
    const [cresta, hombro] = [SILUETA_ESCUDO[0]!, SILUETA_ESCUDO[1]!];
    const x = hombro[0] * ancho + 0.01, yh = hombro[1] * alto, yc = cresta[1] * alto;
    const p = [[-x, yh], [0, yc], [x, yh], [x, yh - banda], [0, yc - banda], [-x, yh - banda]];
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(p.map(([a, b]) => new THREE.Vector2(a, b))), { depth: grosor, bevelEnabled: false });
    g.translate(0, 0, -grosor / 2);
    return g;
  });
}

/** Inclinación hacia atrás de las placas del escudo (rad). [E] */
const INCLINACION_ESCUDO = THREE.MathUtils.degToRad(8);
/** Altura del apoyo de las placas: justo sobre el zócalo. [E] */
const APOYO_ESCUDO = 0.24;

/**
 * Escudo (ESCENAS.md §3.2: carcasa de refuerzo con señal de estado; no es un refugio): placa
 * frontal con la silueta del icono del HUD y emblema de escudos anidados, y tres placas de blindaje
 * más bajas escalonadas hacia atrás, unidas por dos largueros. Todo dentro de la huella 2,2 × 4,0.
 */
function escudo(m: Materiales): THREE.Group {
  const G = 0.22;
  // Placa frontal: el pivote está en la punta inferior; la placa se recuesta hacia -z.
  const frente = colocar(grupo("Shield_Front"), [0, APOYO_ESCUDO, 1.5], [-INCLINACION_ESCUDO, 0, 0]);
  frente.add(
    parte(m, "SuitBase", placaEscudo(1.9, 2.0, G), [0, 1.0, 0], "Shield_Face"),
    parte(m, "Boots", placaEscudo(1.22, 1.28, 0.06), [0, 1.06, G / 2 + 0.03], "Shield_Emblem_Outer"),
    parte(m, "Accent", placaEscudo(0.62, 0.66, 0.06), [0, 1.1, G / 2 + 0.06], "Shield_Emblem_Inner"),
  );
  const x = grupo(
    "Shape_Shield",
    colocar(parte(m, "SuitBase", chaflan(2.1, 3.9, 0.22, 0.4), [0, 0, 0], "Shield_Plinth"), [0, 0.11, 0], [-Math.PI / 2, 0, 0]),
    parte(m, "Boots", caja(0.2, 0.42, 0.34), [-0.42, 0.43, 1.5], "Shield_FootL"),
    parte(m, "Boots", caja(0.2, 0.42, 0.34), [0.42, 0.43, 1.5], "Shield_FootR"),
    frente,
  );
  // Placas de blindaje: cada una más baja que la de delante (escamas superpuestas).
  const placas: [number, number, number][] = [[0.45, 1.85, 1.55], [-0.55, 1.75, 1.15], [-1.5, 1.6, 0.8]];
  placas.forEach(([z, ancho, alto], i) => {
    const p = colocar(grupo(`Shield_Armor${i}`), [0, APOYO_ESCUDO, z], [-INCLINACION_ESCUDO, 0, 0]);
    p.add(
      parte(m, "SuitBase", placaEscudo(ancho, alto, 0.2), [0, alto / 2, 0], `Shield_ArmorPlate${i}`),
      parte(m, "Accent", bandaEscudo(ancho, alto, 0.23, 0.08), [0, alto / 2, 0], `Shield_ArmorBand${i}`),
    );
    x.add(p);
  });
  // Largueros laterales índigo que unen las placas desde la última hasta la frontal.
  for (const sx of [-0.62, 0.62]) x.add(parte(m, "Boots", caja(0.12, 0.14, 3.0), [sx, 0.85, -0.1], sx < 0 ? "Shield_StrutL" : "Shield_StrutR"));
  return x;
}

/** Reciclador: losa, dos depósitos y tuberías que los unen y bajan hacia el hábitat. */
function reciclador(m: Materiales): THREE.Group {
  const tubo = (len: number) => tronco(0.07, 0.07, len, 6);
  return grupo(
    "Shape_Recycler",
    colocar(parte(m, "SuitBase", chaflan(2.9, 1.9, 0.18, 0.3), [0, 0, 0], "Recycler_Slab"), [0, 0.09, 0], [-Math.PI / 2, 0, 0]),
    colocar(crearDeposito(m), [-0.65, 0.18, 0]),
    colocar(crearDeposito(m), [0.65, 0.18, 0], [0, 0, 0], 0.86),
    colocar(parte(m, "SuitBase", tubo(1.3), [0, 0, 0], "Recycler_PipeTop"), [0, 1.75, -0.3], [0, 0, Math.PI / 2]),
    parte(m, "SuitBase", tubo(1.6), [-1.25, 0.95, -0.3], "Recycler_PipeDown"),
    colocar(parte(m, "SuitBase", tubo(0.6), [0, 0, 0], "Recycler_PipeElbow"), [-0.95, 1.75, -0.3], [0, 0, Math.PI / 2]),
    parte(m, "Accent", caja(0.3, 0.3, 0.3), [-1.25, 0.32, -0.3], "Recycler_Valve"),
  );
}

/** Caras de la media icosfera del invernadero (y >= 0), radio `r`. */
function carasCupula(r: number): THREE.Vector3[][] {
  const ico = new THREE.IcosahedronGeometry(r, 1);
  const p = ico.getAttribute("position");
  const caras: THREE.Vector3[][] = [];
  for (let i = 0; i < p.count; i += 3) {
    const t = [0, 1, 2].map((k) => new THREE.Vector3(p.getX(i + k), p.getY(i + k), p.getZ(i + k)));
    if ((t[0]!.y + t[1]!.y + t[2]!.y) / 3 > -0.05) caras.push(t.map((v) => new THREE.Vector3(v.x, Math.max(0, v.y), v.z)));
  }
  ico.dispose();
  return caras;
}

/** Cúpula geodésica: media icosfera de vidrio facetado, costillas, zócalo, vestíbulo y cultivos dentro. */
function invernadero(m: Materiales): THREE.Group {
  const R = 3.5, Y0 = 0.4;
  const caras = carasCupula(R);
  const vidrio = geometriaBase("mod-inv-vidrio", () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(caras.flatMap((t) => t.flatMap((v) => [v.x, v.y + Y0, v.z])), 3));
    geo.computeVertexNormals();
    return geo;
  });
  const x = grupo(
    "Shape_Greenhouse",
    parte(m, "SuitBase", tronco(R + 0.15, R + 0.3, Y0, 10), [0, Y0 / 2, 0], "Greenhouse_Plinth"),
    parte(m, "Glass", vidrio, [0, 0, 0], "Greenhouse_Glass"),
  );
  // Costillas: una barra por arista única de las caras conservadas.
  const barra = geometriaBase("mod-inv-barra", () => new THREE.BoxGeometry(0.09, 0.09, 1));
  const vistas = new Set<string>();
  const clave = (v: THREE.Vector3) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
  const destino = new THREE.Vector3();
  for (const t of caras)
    for (let k = 0; k < 3; k++) {
      const a = t[k]!, b = t[(k + 1) % 3]!;
      const id = [clave(a), clave(b)].sort().join("|");
      if (vistas.has(id) || (a.y < 0.01 && b.y < 0.01)) continue;
      vistas.add(id);
      const s = parte(m, "SuitBase", barra, [(a.x + b.x) / 2, (a.y + b.y) / 2 + Y0, (a.z + b.z) / 2], "Greenhouse_Strut");
      s.scale.set(1, 1, a.distanceTo(b));
      s.lookAt(destino.set(b.x, b.y + Y0, b.z));
      s.castShadow = false;
      x.add(s);
    }
  // Vestíbulo con puerta hacia +z (hacia el punto del jugador).
  x.add(
    parte(m, "SuitBase", chaflan(1.6, 2.1, 1.0, 0.4), [0, 1.05, R], "Greenhouse_Vestibule"),
    colocar(crearPuerta(m), [0, 0, R + 0.45], [0, 0, 0], 0.66),
    parte(m, "Boots", caja(0.8, 1.3, 0.05), [0, 0.8, R + 0.42], "Greenhouse_DoorLeaf"),
  );
  // Cultivos SOLO dentro: tres bandejas con plantas facetadas.
  const hoja = geometriaBase("mod-inv-planta", () => new THREE.IcosahedronGeometry(0.42, 0));
  for (const bx of [-1.3, 0, 1.3]) {
    x.add(parte(m, "SuitBase", chaflan(0.9, 0.5, 3.0, 0.1), [bx, Y0 + 0.25, -0.2], "Greenhouse_Tray"));
    for (const bz of [-1.2, -0.2, 0.8]) {
      const h = parte(m, "Plant", hoja, [bx, Y0 + 0.78, bz], "Greenhouse_Plant");
      h.scale.set(1, 1.25, 1);
      h.castShadow = false;
      x.add(h);
    }
  }
  return x;
}

/** Antena parabólica grande: base, mástil, horquilla, plato de doble cara y alimentador. */
function antena(m: Materiales): THREE.Group {
  const plato = (dentro: boolean) =>
    geometriaBase(`mod-antena-plato-${dentro ? "in" : "out"}`, () => {
      const pts = [new THREE.Vector2(1.3, 0.42), new THREE.Vector2(0.75, 0.13), new THREE.Vector2(0, 0)];
      if (!dentro) pts.reverse();
      const geo = new THREE.LatheGeometry(pts, 12);
      geo.rotateX(Math.PI / 2);
      if (!dentro) geo.translate(0, 0, -0.03);
      return geo;
    });
  const cabeza = colocar(grupo("Antenna_Head"), [0, 2.4, 0], [-0.6, 0, 0]);
  cabeza.add(
    parte(m, "SuitBase", plato(true), [0, 0, 0], "Antenna_Dish"),
    parte(m, "SuitBase", plato(false), [0, 0, 0], "Antenna_DishBack"),
    // Aro grueso en el borde del plato, como en la lámina (abierto: no tapa la cara del plato).
    parte(m, "SuitBase", geometriaBase("mod-antena-aro", () => new THREE.TorusGeometry(1.31, 0.07, 4, 12)), [0, 0, 0.42], "Antenna_DishRim"),
    colocar(parte(m, "SuitBase", tronco(0.04, 0.04, 0.95, 6), [0, 0, 0], "Antenna_Arm"), [0, 0, 0.48], [Math.PI / 2, 0, 0]),
    parte(m, "SuitBase", geometriaBase("mod-antena-alim", () => new THREE.IcosahedronGeometry(0.16, 0)), [0, 0, 0.98], "Antenna_Feed"),
  );
  // Losa chaflanada vista desde arriba (esquinas verticales recortadas), apoyada en `y`.
  const piso = (lado: number, alto: number, y: number, nombre: string) =>
    colocar(parte(m, "SuitBase", chaflan(lado, lado, alto, lado * 0.2), [0, 0, 0], nombre), [0, y + alto / 2, 0], [-Math.PI / 2, 0, 0]);
  // Pedestal escalonado de dos pisos y caseta (lámina `mundo/01`), en lugar de un mástil fino.
  return grupo(
    "Shape_Antenna",
    parte(m, "SuitBase", tronco(0.95, 1.05, 0.3, 8), [0, 0.15, 0], "Antenna_Base"),
    piso(1.7, 0.7, 0.3, "Antenna_Tier1"),
    piso(1.2, 0.6, 1.0, "Antenna_Tier2"),
    parte(m, "SuitBase", caja(0.8, 0.5, 0.8), [0, 1.85, 0], "Antenna_Housing"),
    parte(m, "Boots", caja(0.36, 0.22, 0.03), [0, 0.68, 0.86], "Antenna_Vent1"),
    parte(m, "Boots", caja(0.28, 0.2, 0.03), [0, 1.32, 0.61], "Antenna_Vent2"),
    parte(m, "SuitBase", caja(0.7, 0.3, 0.3), [0, 2.25, 0], "Antenna_Yoke"),
    cabeza,
  );
}

/** Forma construida de un módulo (sin fusionar). */
export function crearFormaModulo(m: Materiales, id: ModuloBase): THREE.Group {
  switch (id) {
    case "panel_solar":
      return panelSolar(m);
    case "escudo":
      return escudo(m);
    case "reciclador_agua":
      return grupo("Recycler_Compact", colocar(reciclador(m), [0, 0, 0], [0, 0, 0], ESCALA_RECICLADOR));
    case "invernadero":
      return grupo("Greenhouse_Compact", colocar(invernadero(m), [0, 0, 0], [0, 0, 0], ESCALA_INVERNADERO));
    case "antena":
      return antena(m);
  }
}
