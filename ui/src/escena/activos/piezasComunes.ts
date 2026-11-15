/**
 * Kit de piezas comunes (APLICACION.md §4, láminas docs/referenciapau/referencias/piezas/).
 *
 * Cada fábrica devuelve un `THREE.Group` apoyado en y = 0 (1 u = 1 m), con geometrías de la caché
 * (`geometriaBase`, compartidas) y los materiales por slot de `crearMateriales()`. Dos piezas del
 * mismo tipo comparten geometrías y materiales; solo se crean las mallas.
 *
 * Mapa de colores (DISEÑO §2 no define un token de "material de estructura"; se usan los slots):
 * - SuitBase (`traje-marfil`): cuerpo rosa-melocotón de las láminas.
 * - Accent (`teal`): bandas, teclas, fluido.
 * - Boots (`indigo-botas`): superficies oscuras (pantalla de la consola, celdas solares,
 *   columna de la antena). PROVISIONAL, aprobar María Paula: las láminas usan un teal/índigo
 *   más oscuro que no está en §2.
 * - Glass (`lila`): vidrio del depósito. Emissive (`cian`): tiras, pantallas, luces de estado.
 * - Rock + color de vértice `camino` (`#BDAFC4`): tramos de camino.
 * Presupuesto: < 300 triángulos por pieza (los tests lo comprueban).
 */
import * as THREE from "three";
import { colorToken, geometriaBase, type Materiales } from "../materiales";

type Slot = keyof Materiales;
type V3 = [number, number, number];

// ------------------------------------------------------------------------------------------
// Geometrías base (todas por clave en la caché).
// ------------------------------------------------------------------------------------------

/** Prisma con las 4 esquinas recortadas a 45° (octógono en x–y) extruido `d` en z, centrado. */
function prismaChaflanado(w: number, h: number, d: number, c: number): THREE.BufferGeometry {
  const x = w / 2, y = h / 2;
  const v = (a: number, b: number) => new THREE.Vector2(a, b);
  const forma = new THREE.Shape([
    v(-x + c, -y), v(x - c, -y), v(x, -y + c), v(x, y - c), v(x - c, y), v(-x + c, y), v(-x, y - c), v(-x, -y + c),
  ]);
  const g = new THREE.ExtrudeGeometry(forma, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}

/** Caja de la caché, centrada. */
export const caja = (w: number, h: number, d: number) =>
  geometriaBase(`kit-caja-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));
/** Prisma octogonal (esquinas a 45°, firma de la familia) de la caché, extruido en z y centrado. */
export const chaflan = (w: number, h: number, d: number, c: number) =>
  geometriaBase(`kit-chaflan-${w}-${h}-${d}-${c}`, () => prismaChaflanado(w, h, d, c));
/** Cilindro/tronco de `n` lados con una cara plana al frente (rotado media faceta). */
export const tronco = (rArriba: number, rAbajo: number, h: number, n: number) =>
  geometriaBase(`kit-tronco-${rArriba}-${rAbajo}-${h}-${n}`, () => {
    const g = new THREE.CylinderGeometry(rArriba, rAbajo, h, n, 1);
    g.rotateY(Math.PI / n);
    return g;
  });

/** Malla con geometría de caché y material de slot, ya colocada. */
export function parte(m: Materiales, slot: Slot, g: THREE.BufferGeometry, pos: V3, nombre: string): THREE.Mesh {
  const malla = new THREE.Mesh(g, m[slot]);
  malla.name = nombre;
  malla.position.set(...pos);
  malla.castShadow = slot !== "Emissive" && slot !== "Glass";
  malla.receiveShadow = true;
  return malla;
}

export function grupo(nombre: string, ...hijos: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.name = nombre;
  g.add(...hijos);
  return g;
}

// ------------------------------------------------------------------------------------------
// Piezas
// ------------------------------------------------------------------------------------------

/** Lámina 01 (puerta y marco): arco octogonal con 3 tiras cian y dos zócalos. Hueco de 1,3 m. */
export function crearPuerta(m: Materiales): THREE.Group {
  const arco = geometriaBase("kit-puerta-arco", () => {
    // Perfil en U (exterior con hombros a 45°, interior abierto), extruido 0,4 en z.
    const p = [
      [-1, 0], [-0.65, 0], [-0.65, 1.75], [-0.4, 2.1], [0.4, 2.1], [0.65, 1.75], [0.65, 0],
      [1, 0], [1, 1.9], [0.5, 2.4], [-0.5, 2.4], [-1, 1.9],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(p), { depth: 0.4, bevelEnabled: false });
    g.translate(0, 0, -0.2);
    return g;
  });
  return grupo(
    "Kit_Door",
    parte(m, "SuitBase", arco, [0, 0.15, 0], "Door_Frame"),
    parte(m, "SuitBase", tronco(0.3, 0.4, 0.3, 8), [-0.82, 0.15, 0], "Door_PlinthL"),
    parte(m, "SuitBase", tronco(0.3, 0.4, 0.3, 8), [0.82, 0.15, 0], "Door_PlinthR"),
    parte(m, "Emissive", caja(0.6, 0.12, 0.02), [0, 2.4, 0.21], "Door_StripTop"),
    parte(m, "Emissive", caja(0.1, 0.5, 0.02), [-0.82, 1.1, 0.21], "Door_StripL"),
    parte(m, "Emissive", caja(0.1, 0.5, 0.02), [0.82, 1.1, 0.21], "Door_StripR"),
  );
}

/** Lámina 02 (consola): pantalla alta chaflanada, encimera, 6 teclas, pantalla táctil y 2 tiras cian. */
export function crearConsola(m: Materiales): THREE.Group {
  const pantalla = geometriaBase("kit-pantalla-petroleo", () => {
    const g = chaflan(1.35, 0.6, 0.02, 0.12).clone();
    const c = colorToken("teal").multiplyScalar(0.22);
    const colores = new Float32Array(g.getAttribute("position").count * 3);
    for (let i = 0; i < colores.length; i += 3) colores.set([c.r, c.g, c.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(colores, 3));
    return g;
  });
  const teclas: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) {
    for (const [dx, dz] of [[0, 0], [0.22, 0], [0.11, 0.14]] as const) {
      teclas.push(parte(m, "Accent", caja(0.16, 0.03, 0.1), [sx * (0.45 + dx), 0.93, dz - 0.05], `Console_Key${teclas.length}`));
    }
  }
  return grupo(
    "Kit_Console",
    parte(m, "SuitBase", chaflan(1.7, 0.95, 0.18, 0.22), [0, 1.4, -0.2], "Console_ScreenFrame"),
    // Pantalla oscura, malla propia (la pantalla dibuja datos reales; sin texto horneado).
    parte(m, "Rock", pantalla, [0, 1.42, -0.095], "Console_Screen"),
    parte(m, "SuitBase", chaflan(1.9, 0.28, 0.6, 0.1), [0, 0.78, 0], "Console_Desk"),
    parte(m, "SuitBase", caja(0.3, 0.64, 0.5), [-0.8, 0.32, 0], "Console_LegL"),
    parte(m, "SuitBase", caja(0.3, 0.64, 0.5), [0.8, 0.32, 0], "Console_LegR"),
    parte(m, "SuitBase", caja(1.0, 0.5, 0.06), [0, 0.35, -0.12], "Console_BackPanel"),
    parte(m, "Emissive", caja(0.4, 0.03, 0.2), [0, 0.93, 0.02], "Console_Touch"),
    parte(m, "Emissive", caja(0.03, 0.05, 0.4), [-0.96, 0.7, 0.05], "Console_StripL"),
    parte(m, "Emissive", caja(0.03, 0.05, 0.4), [0.96, 0.7, 0.05], "Console_StripR"),
    // Símbolo de señal del equipo, sin cifras ni texto de telemetría inventados.
    ...[0.12, 0.22, 0.32].map((h, i) => parte(m, "Emissive", caja(0.08, h, 0.012), [-0.18 + i * 0.18, 1.25 + h / 2, -0.076], `Console_Signal${i}`)),
    ...teclas,
  );
}

/** Lámina 03 (caja): cuerpo chaflanado, tapa más ancha y banda teal que cruza tapa y laterales. */
export function crearCaja(m: Materiales): THREE.Group {
  return grupo(
    "Kit_Crate",
    parte(m, "SuitBase", chaflan(1, 0.5, 0.75, 0.08), [0, 0.25, 0], "Crate_Body"),
    parte(m, "SuitBase", chaflan(1.1, 0.22, 0.85, 0.07), [0, 0.61, 0], "Crate_Lid"),
    parte(m, "Accent", caja(0.2, 0.02, 0.87), [0, 0.73, 0], "Crate_BandTop"),
    parte(m, "Accent", caja(0.2, 0.7, 0.02), [0, 0.36, 0.43], "Crate_BandFront"),
    parte(m, "Accent", caja(0.2, 0.7, 0.02), [0, 0.36, -0.43], "Crate_BandBack"),
    parte(m, "Boots", caja(0.2, 0.05, 0.02), [-0.3, 0.38, 0.385], "Crate_HandleL"),
    parte(m, "Boots", caja(0.2, 0.05, 0.02), [0.3, 0.38, 0.385], "Crate_HandleR"),
  );
}

/**
 * Lámina 04 (panel solar): base octogonal, poste con luz cian y placa inclinada 25° con rejilla
 * 3×3. Pivote en la base; el grupo hijo `Solar_Head` es el eje de cabeza (gira con el sol).
 */
export function crearPanelSolar(m: Materiales): THREE.Group {
  const cabeza = new THREE.Group();
  cabeza.name = "Solar_Head";
  cabeza.position.set(0, 0.8, 0);
  cabeza.rotation.z = THREE.MathUtils.degToRad(-25);
  cabeza.add(parte(m, "SuitBase", chaflan(1.6, 1.2, 0.06, 0.1), [0, 0.45, 0], "Solar_Plate"));
  const celda = geometriaBase("kit-celda", () => new THREE.PlaneGeometry(0.44, 0.33));
  for (let f = 0; f < 3; f++) {
    for (let c = 0; c < 3; c++) {
      cabeza.add(parte(m, "Boots", celda, [(c - 1) * 0.5, 0.45 + (1 - f) * 0.38, 0.031], `Solar_Cell${f}${c}`));
    }
  }
  return grupo(
    "Kit_SolarPanel",
    parte(m, "SuitBase", tronco(0.3, 0.5, 0.2, 8), [0, 0.1, 0], "Solar_Base"),
    parte(m, "SuitBase", caja(0.2, 0.55, 0.2), [0, 0.475, 0], "Solar_Post"),
    parte(m, "Emissive", tronco(0.04, 0.04, 0.02, 8), [0, 0.45, 0.11], "Solar_Light"),
    cabeza,
  );
}

/** Lámina 06 (depósito): base y tapa de 10 lados, vidrio lila, fluido teal y gota cian. */
export function crearDeposito(m: Materiales): THREE.Group {
  const gota = geometriaBase("kit-gota", () => {
    const f = new THREE.Shape();
    f.moveTo(0, 0.14);
    f.lineTo(0.08, 0.02);
    f.lineTo(0.08, -0.04);
    f.lineTo(0.03, -0.09);
    f.lineTo(-0.03, -0.09);
    f.lineTo(-0.08, -0.04);
    f.lineTo(-0.08, 0.02);
    return new THREE.ShapeGeometry(f);
  });
  return grupo(
    "Kit_Tank",
    parte(m, "SuitBase", tronco(0.5, 0.6, 0.3, 10), [0, 0.15, 0], "Tank_Base"),
    parte(m, "Accent", tronco(0.46, 0.46, 1.0, 10), [0, 0.8, 0], "Tank_Fluid"),
    parte(m, "Glass", tronco(0.52, 0.52, 1.4, 10), [0, 1.0, 0], "Tank_Glass"),
    parte(m, "SuitBase", tronco(0.6, 0.5, 0.3, 10), [0, 1.85, 0], "Tank_Cap"),
    parte(m, "SuitBase", tronco(0.2, 0.22, 0.2, 8), [0, 2.1, 0], "Tank_Nozzle"),
    parte(m, "Emissive", gota, [0, 1.0, 0.54], "Tank_Drop"),
  );
}

/** Lámina 08 (antena): base de 12 lados, columna oscura con luz cian, plato facetado y esfera de alimentación. */
export function crearAntena(m: Materiales): THREE.Group {
  const plato = geometriaBase("kit-plato", () => {
    // Cuenco de 10 lados y 2 anillos; la cara interior (cóncava) mira a +z.
    // Puntos del borde al centro: invierte el bobinado para que la cara interior sea la frontal.
    const pts = [new THREE.Vector2(0.55, 0.2), new THREE.Vector2(0.28, 0.04), new THREE.Vector2(0, 0)];
    const g = new THREE.LatheGeometry(pts, 10);
    g.rotateX(Math.PI / 2); // eje del cuenco a z
    return g;
  });
  const brazo = parte(m, "Boots", tronco(0.025, 0.025, 0.4, 6), [0, 0, 0.2], "Antenna_Arm");
  brazo.rotation.x = Math.PI / 2; // el cilindro corre a lo largo de z
  const cabeza = new THREE.Group();
  cabeza.name = "Antenna_Head";
  cabeza.position.set(0, 1.05, 0);
  cabeza.rotation.x = THREE.MathUtils.degToRad(-35);
  cabeza.add(
    parte(m, "SuitBase", plato, [0, 0, 0], "Antenna_Dish"),
    brazo,
    parte(m, "SuitBase", geometriaBase("kit-alimentador", () => new THREE.IcosahedronGeometry(0.07, 0)), [0, 0, 0.42], "Antenna_Feed"),
  );
  return grupo(
    "Kit_Antenna",
    parte(m, "SuitBase", tronco(0.4, 0.5, 0.2, 12), [0, 0.1, 0], "Antenna_Base"),
    parte(m, "Boots", tronco(0.1, 0.2, 0.75, 4), [0, 0.575, 0], "Antenna_Column"),
    parte(m, "Emissive", tronco(0.035, 0.035, 0.02, 8), [0, 0.35, 0.16], "Antenna_Light"),
    cabeza,
  );
}

/**
 * Baliza de camino. Referencia: bolardo de la lámina 10 (kit exterior); no hay lámina propia.
 * Poste octogonal con zócalo y cabeza cian: la única luz emisiva del camino (DISEÑO §3.2).
 */
export function crearBaliza(m: Materiales): THREE.Group {
  return grupo(
    "Kit_Beacon",
    parte(m, "SuitBase", tronco(0.2, 0.24, 0.08, 8), [0, 0.04, 0], "Beacon_Foot"),
    parte(m, "SuitBase", tronco(0.12, 0.15, 0.6, 8), [0, 0.38, 0], "Beacon_Post"),
    parte(m, "Emissive", tronco(0.1, 0.1, 0.12, 8), [0, 0.74, 0], "Beacon_Light"),
  );
}

/**
 * Tramo de camino de 1 × 1 u y 4 cm de alto (sin lámina; color `camino` de DISEÑO §2.3).
 * Slot Rock con color de vértice, como el terreno. Escala y gira por instancia.
 */
export function crearCamino(m: Materiales): THREE.Group {
  const g = geometriaBase("kit-camino", () => {
    const b = new THREE.BoxGeometry(1, 0.04, 1);
    const n = b.getAttribute("position").count;
    const c = colorToken("camino");
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    b.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return b;
  });
  const t = parte(m, "Rock", g, [0, 0.02, 0], "Path_Tile");
  t.castShadow = false;
  return grupo("Kit_Path", t);
}
