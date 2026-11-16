/**
 * Interior: hábitat (D5, estaciones 06 y 07), como `estaciones/07-descanso-comedor.png` y
 * `estaciones/06-enfermeria.png`. En el juego el hábitat es una sola sala (`SalaId` `habitat`): descanso a
 * la izquierda (litera y casillero), comedor a la derecha (mesa, banquetas, dispensador y armario) y
 * enfermería adelante a la derecha (camilla y botiquín con escudo). Gestos tranquilos: ni lesiones ni barras
 * de salud; sentarse o acostarse no recupera nada (ESCENAS §4, MECANICAS §5). Geometría, zona caminable,
 * obstáculos y puntos de uso; la escena y las puertas las conecta el frente A (A8).
 *
 * Ejes: x a lo ancho (-4,5 a 4,5), z hacia la cámara (-3 fondo, +3 frente), piso en y = 0.
 */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../../materiales";
import { caja, chaflan, grupo, parte, tronco } from "../piezasComunes";
import { salaEnCorte, tinte } from "./comun";

/** Medidas de la sala (m). [E] proporciones de las láminas 06 y 07. */
export const HABITAT_SALA = { ancho: 9, fondo: 6, alto: 3, puertaX: -0.2 } as const;

export function zonaHabitat() {
  return {
    caminable: { x0: -4.1, x1: 4.1, z0: -2.3, z1: 2.7 },
    entrada: { x: HABITAT_SALA.puertaX, z: -2.2, rumbo: 0 },
    puntos: {
      litera: { x: -3.4, z: -1.0 },
      mesa: { x: 0.8, z: -0.4 },
      camilla: { x: 3.0, z: 0.6 },
      botiquin: { x: 3.4, z: 0.3 },
    },
    obstaculos: [
      { x: -3.4, z: -2.35, r: 1.2 }, // litera
      { x: -1.6, z: -2.7, r: 0.5 }, // casillero
      { x: 2.2, z: -0.4, r: 1.1 }, // mesa y banquetas
      { x: 2.0, z: -2.8, r: 0.4 }, // dispensador
      { x: 3.4, z: -2.75, r: 0.7 }, // armario
      { x: 3.0, z: 1.9, r: 1.0 }, // camilla
      { x: 4.15, z: 0.3, r: 0.5 }, // mueble del botiquín
    ],
  } as const;
}

/** Litera de dos camas con mantas teal, almohadas, escalera y lámpara cálida en cada cama. */
function litera(m: Materiales): THREE.Group {
  // Marco abierto: fondo, costado, techo y postes al frente, para que se vean las dos camas.
  const x = grupo(
    "Habitat_Bunk",
    parte(m, "Rock", tinte("hueco-litera", caja(2.2, 2.3, 0.08), "lila", "indigo-botas", 0.2), [0, 1.15, -0.55], "Bunk_Back"),
    parte(m, "SuitBase", caja(0.12, 2.3, 1.1), [-1.1, 1.15, 0], "Bunk_Side"),
    parte(m, "SuitBase", chaflan(2.32, 0.18, 1.1, 0.06), [0, 2.35, 0], "Bunk_Top"),
    parte(m, "SuitBase", caja(0.12, 2.3, 0.12), [1.1, 1.15, 0.5], "Bunk_Post"),
    parte(m, "SuitBase", caja(2.2, 0.16, 0.1), [0, 1.27, 0.5], "Bunk_Rail"),
  );
  for (const y of [0.45, 1.4]) {
    x.add(
      parte(m, "SuitBase", caja(2.0, 0.22, 0.95), [0, y, 0], "Bunk_Mattress"),
      parte(m, "Accent", caja(1.4, 0.08, 0.97), [0.25, y + 0.14, 0], "Bunk_Blanket"),
      parte(m, "SuitBase", caja(0.45, 0.14, 0.7), [-0.7, y + 0.18, 0], "Bunk_Pillow"),
      parte(m, "Rock", tinte("lampara", caja(0.35, 0.14, 0.12), "ambar", "marfil", 0.3), [-0.6, y + 0.65, -0.45], "Bunk_Lamp"),
    );
  }
  // Escalera al costado.
  x.add(parte(m, "SuitBase", caja(0.06, 1.7, 0.06), [1.05, 0.85, 0.5], "Bunk_LadderRail"), parte(m, "SuitBase", caja(0.06, 1.7, 0.06), [0.75, 0.85, 0.5], "Bunk_LadderRail"));
  for (const y of [0.4, 0.8, 1.2]) x.add(parte(m, "SuitBase", caja(0.32, 0.05, 0.05), [0.9, y, 0.5], "Bunk_LadderStep"));
  return x;
}

/** Mesa con borde cian y dos banquetas índigo. */
function comedor(m: Materiales): THREE.Group {
  const x = grupo(
    "Habitat_MessTable",
    parte(m, "SuitBase", chaflan(2.0, 0.12, 0.95, 0.06), [0, 0.78, 0], "Mess_Top"),
    parte(m, "Emissive", caja(2.0, 0.04, 0.03), [0, 0.7, 0.49], "Mess_Edge"),
    parte(m, "SuitBase", caja(0.25, 0.72, 0.7), [-0.75, 0.36, 0], "Mess_Leg"),
    parte(m, "SuitBase", caja(0.25, 0.72, 0.7), [0.75, 0.36, 0], "Mess_Leg"),
  );
  for (const z of [-0.8, 0.8]) {
    x.add(parte(m, "Boots", tronco(0.28, 0.28, 0.12, 8), [0, 0.52, z], "Mess_StoolSeat"), parte(m, "SuitBase", tronco(0.06, 0.06, 0.46, 6), [0, 0.23, z], "Mess_StoolPost"), parte(m, "SuitBase", tronco(0.2, 0.24, 0.05, 8), [0, 0.025, z], "Mess_StoolFoot"));
  }
  return x;
}

/** Camilla teal (enfermería): base, colchón y respaldo inclinado, con una tira cian. */
function camilla(m: Materiales): THREE.Group {
  const respaldo = parte(m, "Accent", caja(0.7, 0.14, 0.8), [-0.85, 0.85, 0], "Bed_Backrest");
  respaldo.rotation.z = -0.45;
  return grupo(
    "Habitat_MedBed",
    parte(m, "SuitBase", chaflan(2.1, 0.55, 0.85, 0.12), [0, 0.28, 0], "Bed_Base"),
    parte(m, "Accent", caja(1.6, 0.14, 0.8), [0.2, 0.62, 0], "Bed_Mattress"),
    respaldo,
    parte(m, "Emissive", caja(1.4, 0.05, 0.02), [0.1, 0.3, 0.44], "Bed_Strip"),
  );
}

/** Mueble bajo con el botiquín teal y su escudo cian (el símbolo de la base). */
function botiquin(m: Materiales): THREE.Group {
  const escudo = geometriaBase("int-escudo-botiquin", () => {
    const f = new THREE.Shape([[0, 0.13], [0.1, 0.09], [0.09, -0.02], [0, -0.12], [-0.09, -0.02], [-0.1, 0.09]].map(([a, b]) => new THREE.Vector2(a!, b!)));
    return new THREE.ExtrudeGeometry(f, { depth: 0.02, bevelEnabled: false });
  });
  return grupo(
    "Habitat_MedKit",
    parte(m, "SuitBase", chaflan(0.9, 0.85, 0.6, 0.08), [0, 0.43, 0], "MedKit_Cabinet"),
    parte(m, "Accent", chaflan(0.6, 0.36, 0.4, 0.08), [0, 1.04, 0], "MedKit_Case"),
    parte(m, "Accent", caja(0.25, 0.06, 0.06), [0, 1.26, 0], "MedKit_Handle"),
    parte(m, "Emissive", escudo, [0, 1.04, 0.2], "MedKit_Shield"),
  );
}

/** Hábitat completo (sin fusionar: la vista de la sala lo fusiona por material). */
export function crearHabitatInterior(m: Materiales): THREE.Group {
  const raiz = salaEnCorte(m, HABITAT_SALA, "Interior_Habitat");
  const colocar = (o: THREE.Object3D, x: number, z: number, giro = 0) => {
    o.position.set(x, 0, z);
    o.rotation.y = giro;
    raiz.add(o);
  };
  colocar(litera(m), -3.4, -2.35);
  // Casillero junto a la litera.
  colocar(grupo("Habitat_Locker", parte(m, "SuitBase", chaflan(0.7, 2.1, 0.55, 0.1), [0, 1.05, 0], "Locker_Body"), parte(m, "Emissive", caja(0.05, 0.4, 0.02), [0.22, 1.1, 0.29], "Locker_Light"), parte(m, "Rock", tinte("ranura", caja(0.35, 0.03, 0.01), "traje-marfil", "regolito-medio", 0.4), [0, 1.75, 0.285], "Locker_Vent")), -1.6, -2.7);
  colocar(comedor(m), 2.2, -0.4);
  // Dispensador de agua en la pared y armario con raciones.
  colocar(grupo("Habitat_Dispenser", parte(m, "SuitBase", chaflan(0.5, 0.8, 0.3, 0.08), [0, 1.5, 0], "Dispenser_Body"), parte(m, "Glass", caja(0.36, 0.4, 0.05), [0, 1.6, 0.16], "Dispenser_Tank"), parte(m, "Boots", caja(0.08, 0.1, 0.1), [0, 1.12, 0.16], "Dispenser_Tap")), 2.0, -2.85);
  const armario = grupo("Habitat_Cabinet", parte(m, "SuitBase", chaflan(1.3, 1.1, 0.5, 0.12), [0, 1.55, 0], "Cabinet_Body"), parte(m, "Rock", tinte("hueco-armario", caja(1.1, 0.9, 0.04), "lila", "indigo-botas", 0.2), [0, 1.55, 0.24], "Cabinet_Back"));
  for (const [dx, dy] of [[-0.28, 0.2], [0.28, 0.2], [-0.28, -0.22], [0.28, -0.22]] as const) armario.add(parte(m, "SuitBase", caja(0.36, 0.22, 0.2), [dx, 1.55 + dy, 0.3], "Cabinet_Ration"), parte(m, "Accent", caja(0.06, 0.23, 0.21), [dx, 1.55 + dy, 0.3], "Cabinet_RationBand"));
  colocar(armario, 3.4, -2.8);
  colocar(camilla(m), 3.0, 1.9);
  colocar(botiquin(m), 4.15, 0.3, -Math.PI / 2);
  // Persiana en la pared izquierda (ventana cerrada, lámina 06 y 07).
  colocar(grupo("Habitat_Shutter", parte(m, "SuitBase", chaflan(1.3, 0.9, 0.12, 0.15), [0, 1.6, 0], "Shutter_Frame"), ...[1.4, 1.55, 1.7, 1.85].map((y) => parte(m, "Boots", caja(1.0, 0.07, 0.02), [0, y - 0.05, 0.07], "Shutter_Slat"))), -4.45, 0.9, Math.PI / 2);
  // Rejilla de piso con borde cian y luces cálidas desde la puerta.
  const rejilla = grupo("Habitat_FloorGrate", parte(m, "Rock", tinte("rejilla", caja(1.8, 0.03, 0.9), "lila", "indigo-botas", 0.35), [0, 0.015, 0], "Grate_Base"));
  for (const x of [-0.6, -0.3, 0, 0.3, 0.6]) rejilla.add(parte(m, "Boots", caja(0.12, 0.02, 0.7), [x, 0.035, 0], "Grate_Slat"));
  rejilla.add(parte(m, "Emissive", caja(1.9, 0.02, 0.05), [0, 0.03, 0.47], "Grate_Edge"), parte(m, "Emissive", caja(1.9, 0.02, 0.05), [0, 0.03, -0.47], "Grate_Edge"));
  colocar(rejilla, -0.6, 0.9);
  const luz = tinte("luz-piso", caja(0.45, 0.02, 0.3), "marfil", "ambar", 0.35);
  for (const [x, z] of [[-0.2, -1.5], [-0.6, -0.9], [-2.4, -0.9], [-3.0, -0.9]] as const) raiz.add(parte(m, "Rock", luz, [x, 0.01, z], "Habitat_FloorLight"));
  return raiz;
}
