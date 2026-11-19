/**
 * Interior: taller de ingeniería y energía (D5, estación 05), como la lámina
 * `estaciones/05-ingenieria.png`: estante de baterías, consola, banco con panel de herramientas, puerta al
 * corredor, dock de Iris, plataforma con el panel solar en su eje y una caja. Sala en corte: piso, pared
 * del fondo y laterales; el frente queda abierto para la cámara. Cada sala es su propia vista: aquí la
 * geometría, la zona caminable, los obstáculos y los puntos de uso; la escena y las puertas las conecta el
 * frente A (A8). Inspeccionar o usar no da recursos (MECANICAS §5).
 *
 * Ejes: x a lo ancho (-4 a 4), z hacia la cámara (-3 fondo, +3 frente), piso en y = 0.
 */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../../materiales";
import { caja, chaflan, crearCaja, crearConsola, crearPanelSolarInclinado, grupo, parte } from "../piezasComunes";
import { salaEnCorte, tinte } from "./comun";


/** Medidas de la sala (m). [E] proporciones de la lámina. */
export const TALLER = { ancho: 8, fondo: 6, alto: 3, grosor: 0.25 } as const;

/** Puntos de uso (donde se para el niño para usar algo; para A8 y los avisos `[E]`), obstáculos (círculos) y zona caminable. */
export function zonaTaller() {
  return {
    caminable: { x0: -3.6, x1: 3.6, z0: -2.2, z1: 2.7 },
    entrada: { x: 3.0, z: -1.9, rumbo: 0 },
    puntos: {
      dock: { x: 2.2, z: 1.0 },
      banco: { x: 1.2, z: -1.35 },
      consola: { x: -1.0, z: -1.7 },
      panel: { x: 0.2, z: 0.4 },
    },
    obstaculos: [
      { x: -2.7, z: -2.6, r: 1.0 }, // estante de baterías
      { x: -1.0, z: -2.5, r: 0.7 }, // consola
      { x: 1.2, z: -2.55, r: 1.1 }, // banco
      { x: 0.2, z: 1.4, r: 0.8 }, // panel en su eje
      { x: -2.6, z: 1.3, r: 0.5 }, // caja
      { x: 3.4, z: 1.0, r: 0.6 }, // dock de Iris
    ],
  } as const;
}

/** Estante de baterías: marco con 2 filas de 3 baterías, cada una con su tapa cian. */
export function estanteBaterias(m: Materiales): THREE.Group {
  const x = grupo(
    "Workshop_BatteryRack",
    parte(m, "SuitBase", chaflan(2.0, 2.1, 0.6, 0.2), [0, 1.05, 0], "Rack_Frame"),
    parte(m, "Rock", tinte("hueco-estante", caja(1.7, 1.75, 0.05), "lila", "indigo-botas", 0.2), [0, 1.08, 0.28], "Rack_Back"),
    parte(m, "Emissive", caja(0.9, 0.08, 0.03), [0, 2.0, 0.31], "Rack_Light"),
  );
  for (const y of [0.55, 1.35]) for (const dx of [-0.55, 0, 0.55]) {
    x.add(parte(m, "SuitBase", caja(0.46, 0.62, 0.42), [dx, y, 0.3], "Rack_Battery"));
    x.add(parte(m, "Emissive", caja(0.3, 0.06, 0.03), [dx, y + 0.22, 0.52], "Rack_BatteryCap"));
    x.add(parte(m, "Accent", caja(0.08, 0.22, 0.03), [dx, y - 0.04, 0.52], "Rack_BatteryMark"));
  }
  return x;
}

/** Banco de trabajo con cajones, panel de herramientas en la pared y un medidor. */
export function banco(m: Materiales): THREE.Group {
  const x = grupo(
    "Workshop_Bench",
    parte(m, "SuitBase", chaflan(2.0, 0.12, 0.8, 0.04), [0, 0.86, 0], "Bench_Top"),
    parte(m, "SuitBase", caja(0.7, 0.8, 0.7), [0.6, 0.4, 0], "Bench_Drawers"),
    parte(m, "Rock", tinte("ranura", caja(0.5, 0.04, 0.01), "traje-marfil", "regolito-medio", 0.4), [0.6, 0.55, 0.355], "Bench_DrawerSlot"),
    parte(m, "Rock", tinte("ranura", caja(0.5, 0.04, 0.01), "traje-marfil", "regolito-medio", 0.4), [0.6, 0.3, 0.355], "Bench_DrawerSlot"),
    parte(m, "SuitBase", caja(0.12, 0.8, 0.6), [-0.85, 0.4, 0], "Bench_Leg"),
    parte(m, "Accent", caja(2.0, 0.05, 0.03), [0, 0.8, 0.41], "Bench_Band"),
    // Panel de herramientas (lila) en la pared del fondo, con siluetas simples.
    parte(m, "Rock", tinte("panel-herr", caja(1.9, 0.95, 0.05), "lila", "indigo-botas", 0.15), [0, 1.85, -0.38], "Bench_Pegboard"),
    // Medidor sobre el banco.
    parte(m, "SuitBase", chaflan(0.36, 0.3, 0.2, 0.06), [-0.45, 1.07, -0.1], "Bench_Gauge"),
    parte(m, "Emissive", caja(0.22, 0.12, 0.02), [-0.45, 1.09, 0.01], "Bench_GaugeScreen"),
  );
  // Herramientas colgadas: destornilladores (índigo) y llaves (teal), sin filo ni detalle peligroso.
  for (const [dx, alto, slot] of [[-0.7, 0.5, "Boots"], [-0.5, 0.45, "Boots"], [-0.25, 0.55, "Accent"], [0.05, 0.6, "Accent"], [0.35, 0.5, "Boots"], [0.65, 0.4, "Accent"]] as const) {
    x.add(parte(m, slot, caja(0.07, alto, 0.04), [dx, 1.85, -0.33], "Bench_Tool"));
  }
  return x;
}

/** Dock de Iris: nicho con arco, base baja y aro cian en el piso (lámina: el robot se carga ahí). */
export function dock(m: Materiales): THREE.Group {
  const aro = geometriaBase("int-dock-aro", () => new THREE.RingGeometry(0.5, 0.6, 16).rotateX(-Math.PI / 2));
  return grupo(
    "Workshop_IrisDock",
    parte(m, "SuitBase", chaflan(1.5, 0.12, 1.3, 0.3), [0, 0.06, 0], "Dock_Base"),
    parte(m, "Emissive", aro, [0, 0.125, 0], "Dock_Ring"),
    parte(m, "SuitBase", caja(0.2, 1.7, 1.3), [0.75, 0.85, 0], "Dock_Back"),
    parte(m, "SuitBase", caja(1.5, 0.22, 1.3), [0, 1.8, 0], "Dock_Hood"),
    parte(m, "Emissive", caja(0.7, 0.07, 0.03), [-0.2, 1.68, 0.66], "Dock_Light"),
  );
}

/** Taller completo (sin fusionar: la vista de la sala lo fusiona por material). */
export function crearTaller(m: Materiales): THREE.Group {
  // Piso, paredes, puerta al corredor (x = 3) y tramo de pasillo detrás: la caja común de las salas.
  const raiz = salaEnCorte(m, { ancho: TALLER.ancho, fondo: TALLER.fondo, alto: TALLER.alto, puertaX: 3.0 }, "Interior_Workshop");
  // Baldosas de luz cálida en el piso, desde la puerta hacia el centro.
  const luz = tinte("luz-piso", caja(0.45, 0.02, 0.3), "marfil", "ambar", 0.35);
  for (const [x, z] of [[2.6, -1.1], [2.0, -0.6], [1.4, -0.1], [-1.6, -1.2], [-2.2, -1.2]] as const) raiz.add(parte(m, "Rock", luz, [x, 0.01, z], "Workshop_FloorLight"));

  const colocar = (o: THREE.Object3D, x: number, z: number, giro = 0) => {
    o.position.set(x, 0, z);
    o.rotation.y = giro;
    raiz.add(o);
  };
  colocar(estanteBaterias(m), -2.7, -2.65);
  colocar(crearConsola(m), -1.0, -2.45);
  colocar(banco(m), 1.2, -2.55);
  colocar(dock(m), 3.25, 1.0);
  // Plataforma con borde cian y el panel solar en su eje (pivote `SolarTilt_Head`, lo anima A).
  const plataforma = grupo(
    "Workshop_PanelPad",
    parte(m, "Rock", tinte("plataforma", caja(2.4, 0.06, 1.2), "lila", "indigo-botas", 0.3), [0, 0.03, 0], "Pad_Base"),
    parte(m, "Emissive", caja(2.5, 0.03, 0.06), [0, 0.07, 0.62], "Pad_EdgeFront"),
    parte(m, "Emissive", caja(2.5, 0.03, 0.06), [0, 0.07, -0.62], "Pad_EdgeBack"),
    parte(m, "Emissive", caja(0.06, 0.03, 1.2), [1.23, 0.07, 0], "Pad_EdgeR"),
    parte(m, "Emissive", caja(0.06, 0.03, 1.2), [-1.23, 0.07, 0], "Pad_EdgeL"),
  );
  const panel = crearPanelSolarInclinado(m);
  panel.position.y = 0.06;
  plataforma.add(panel);
  colocar(plataforma, 0.2, 1.4);
  colocar(crearCaja(m), -2.6, 1.3, 0.3);
  return raiz;
}
