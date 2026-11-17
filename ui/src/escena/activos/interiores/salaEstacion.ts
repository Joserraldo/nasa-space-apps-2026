import * as THREE from "three";
import type { Materiales } from "../../materiales";
import { fusionar } from "../fusionar";
import { camilla, litera } from "./habitat";
import { ESCALA_ESTACION as E, cargarKitEstacion, pieza, type PiezaEstacion } from "./kitEstacion";
import type { PuntoSala } from "./salaKit";
import { cultivoVeggie, terminal } from "./salaPastel";
import { dock, estanteBaterias } from "./taller";
import { caja, chaflan, grupo } from "../piezasComunes";
import { crearMontanas } from "../terrenoVisual";
import { colorToken } from "../../materiales";

const NEGRO_MESA = new THREE.MeshStandardMaterial({ name: "Desk_Top", color: "#1D1E2A", roughness: 0.55 });
const GRIS_MESA = new THREE.MeshStandardMaterial({ name: "Desk_Body", color: "#8F8E9C", roughness: 0.7 });
const LAMA = new THREE.MeshStandardMaterial({ name: "Desk_Slat", color: "#ECEBEF", roughness: 0.6 });
const PANTALLA = new THREE.MeshBasicMaterial({ name: "Desk_Screen", color: "#5AB4FF" });

/**
 * Control desk, our own build after the desk reference María Paula chose: long dark top, grey body with
 * white vent slats at both ends, a knee cut-out in the middle and a raised monitor with a cyan screen.
 */
export function mesaControl(m: Materiales): THREE.Group {
  const malla = (g: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], nombre: string) => {
    const o = new THREE.Mesh(g, mat);
    o.name = nombre;
    o.position.set(...pos);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  };
  const lamas = [-1, 1].flatMap((lado) => [0.25, 0.4, 0.55, 0.7].map((y, i) =>
    malla(caja(0.04, 0.08, 0.36), LAMA, [lado * 1.27, y, 0], `Desk_Slat_${lado}_${i}`)));
  return grupo(
    "Station_ControlDesk",
    malla(chaflan(2.6, 0.06, 0.8, 0.12), NEGRO_MESA, [0, 0.86, 0], "Desk_Top"),
    malla(caja(0.6, 0.83, 0.7), GRIS_MESA, [-1.0, 0.415, 0], "Desk_Leg_L"),
    malla(caja(0.6, 0.83, 0.7), GRIS_MESA, [1.0, 0.415, 0], "Desk_Leg_R"),
    malla(caja(1.4, 0.5, 0.08), GRIS_MESA, [0, 0.58, -0.3], "Desk_Back"),
    ...lamas,
    malla(caja(0.06, 0.4, 0.06), NEGRO_MESA, [0.3, 1.08, -0.2], "Desk_Stand"),
    malla(caja(0.9, 0.52, 0.04), NEGRO_MESA, [0.3, 1.45, -0.2], "Desk_Monitor"),
    malla(caja(0.84, 0.46, 0.01), PANTALLA, [0.3, 1.45, -0.175], "Desk_Screen"),
    malla(caja(0.45, 0.02, 0.16), m.Boots, [-0.2, 0.9, 0.12], "Desk_Keyboard"),
  );
}

/**
 * Experimental: the base rooms built with the Likh0i kit (`kitEstacion.ts`), following the interior sheets
 * (airlock, engineering, habitat): open-top rooms seen from above, walls on the camera side hidden.
 *
 * A room is a plan in kit units: `ancho` x `fondo` (multiples of 4, the floor tile), gates on the north
 * (z = 0) or south (z = fondo) wall, an optional window on the east wall, and props. Walls, floor and gates
 * come out of the plan; props are kit pieces or the game's own furniture (in metres).
 */

export type SalaEstacion = "esclusa" | "taller" | "habitat";

/** [piece, x, z (kit units, grid corner), quarter turns, collision radius in m (0 = none), y]. */
type Prop = readonly [PiezaEstacion, number, number, number, number, number?];
/** [builder, x, z (metres from the room centre), turn in radians, collision radius in m]. */
type Propio = readonly [(m: Materiales) => THREE.Object3D, number, number, number, number];
type Lado = "norte" | "sur";

interface PlanoSala {
  ancho: number;
  fondo: number;
  /** Gates: wall side, x of the gate's left edge (kit units), where it leads. */
  puertas: readonly (readonly [Lado, number, string])[];
  ventanaEste: boolean;
  kit: readonly Prop[];
  propios: readonly Propio[];
}

const PLANOS: Readonly<Record<SalaEstacion, PlanoSala>> = {
  // Airlock: suits and helmets on the west wall, the pressure terminal on the north one, crates by the
  // outer door, the floor pad in the middle. North gate to the corridor, south gate out to Mars.
  esclusa: {
    ancho: 12, fondo: 8, ventanaEste: false,
    puertas: [["norte", 4, "pasillo"], ["sur", 4, "base"]],
    kit: [
      ["Spacesuite_full_4", 1.0, 1.2, 1, 0.5], ["Spacesuite_full_4", 1.0, 2.6, 1, 0.5],
      ["Hanging_Shelf_43", 0.6, 4.4, 1, 0, 1.6], ["Helm_1_7", 1.0, 4.4, 1, 0, 2.05], ["Helm_1_7", 1.0, 5.1, 1, 0, 2.05],
      ["Backpack_1_5", 1.0, 6.2, 1, 0.4],
      // The pad in the middle: the kit's octagon floor tile, a touch above the floor.
      ["Floor_M_2_100", 4.5, 2.5, 0, 0, 0.02],
      ["Cube_1_26", 9.5, 6.0, 0, 0.6], ["Cube_2_27", 10.6, 6.2, 0, 0.6],
    ],
    propios: [[mesaControl, 3.0, -2.55, 0, 1.0]],
  },
  // Engineering: batteries and the solar console on the north wall, the workbench with its drill, the rover
  // dock on the east wall, gas tanks and the robot arm on the west wall.
  taller: {
    ancho: 12, fondo: 8, ventanaEste: false,
    puertas: [["sur", 4, "pasillo"]],
    kit: [
      ["Table_44", 9.3, 1.6, 0, 1.0], ["Drill_13", 9.0, 1.4, 0, 0, 1.03],
      ["Tank_O2_46", 1.2, 3.6, 1, 0.8], ["Tank_H2_48", 1.2, 6.2, 1, 0.8],
      ["Arm_Base_16", 2.6, 1.6, 0, 0.5], ["Arm_17", 2.6, 1.6, 0, 0, 0.3],
      ["Cube_4_29", 9.6, 6.6, 0, 0.6],
    ],
    propios: [
      [estanteBaterias, -3.6, -2.7, 0, 0.9],
      [mesaControl, -0.2, -2.55, 0, 1.1],
      [dock, 3.9, 0.7, Math.PI / 2, 0.9],
    ],
  },
  // Habitat: bunk on the west wall, meals in the middle with kit chairs, the crew terminal and the Veggie
  // garden on the north wall, the infirmary (bed and first aid) by the east wall.
  habitat: {
    ancho: 12, fondo: 8, ventanaEste: false,
    puertas: [["sur", 4, "pasillo"]],
    kit: [
      // The table (its origin is its centre) sits off the door's lane, chairs at its ends.
      ["Table_44", 3.6, 4.4, 0, 1.2],
      ["Chair_Blue_37", 1.9, 4.4, 1, 0], ["Chair_Blue_37", 5.3, 4.4, 3, 0],
      ["First_Aid_11", 11.4, 1.4, 2, 0, 1.4],
    ],
    propios: [
      [litera, -3.4, -2.2, 0, 1.2],
      [terminal, -0.6, -2.85, 0, 0.6],
      [cultivoVeggie, 1.2, -2.85, 0, 0.7],
      [camilla, 3.2, -1.6, 0, 1.0],
    ],
  },
};

/** A wall run and the way it faces out of the room, so the camera can hide the ones in front of it. */
export interface MuroSala {
  grupo: THREE.Group;
  normal: readonly [number, number];
}

export interface Sala3D {
  raiz: THREE.Group;
  muros: MuroSala[];
}

/** Half sizes in metres. */
const medio = (p: PlanoSala) => ({ x: (p.ancho * E) / 2, z: (p.fondo * E) / 2 });

/**
 * The game furniture (bunk, battery shelf, dock, terminal...) is built with the game materials, ivory and
 * teal; inside the station it gets the kit's colours instead, so it does not read as pasted in.
 */
function materialesEstacion(m: Materiales): Materiales {
  const copia = (k: keyof Materiales, color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const c = m[k].clone();
    c.color.set(color);
    Object.assign(c, extra);
    return c;
  };
  return {
    ...m,
    SuitBase: copia("SuitBase", "#F2F0EC"),
    Accent: copia("Accent", "#2F8EEA"),
    Boots: copia("Boots", "#2B2C38"),
    Emissive: copia("Emissive", "#5AB4FF", { emissive: new THREE.Color("#5AB4FF") }),
  };
}

/**
 * What the open top shows around the room: the same Mars as outdoors, in cheap pieces. Regolith in the
 * outdoor ground tone, the outdoor crater rim (`crearMontanas`, one mesh, < 1000 triangles) pulled in close,
 * and a ring of instanced rocks; the caramel haze of the outdoor horizon (`AMBIENTE_ESTACION.niebla`) melts
 * them into the sky. About 3 draw calls; nothing out here casts shadows.
 */
function entornoMarte(materiales: Materiales): THREE.Group {
  const g = new THREE.Group();
  g.name = "Station_Mars_Around";
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(120, 24), new THREE.MeshStandardMaterial({ name: "Station_Regolith", color: colorToken("regolito-claro"), roughness: 1 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = -0.05;
  suelo.receiveShadow = true;
  const montes = crearMontanas(materiales, { radio: 46, alto: 10, picos: 44, semilla: 7 });
  montes.position.y = -0.5;
  // Rocks: a seeded ring between the room and the rim.
  const roca = new THREE.IcosahedronGeometry(1, 0);
  const rocas = new THREE.InstancedMesh(roca, new THREE.MeshStandardMaterial({ name: "Station_Rock", color: colorToken("roca-basalto"), roughness: 0.95, flatShading: true }), 48);
  let semilla = 11;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < rocas.count; i++) {
    const ang = azar() * Math.PI * 2, r = 10 + azar() * 28, t = 0.3 + azar() * azar() * 1.6;
    rocas.setMatrixAt(i, m.compose(v.set(Math.cos(ang) * r, t * 0.3, Math.sin(ang) * r), q.setFromEuler(e.set(azar() * 3, azar() * 3, azar() * 3)), sc.set(t, t * 0.7, t * 1.1)));
  }
  rocas.receiveShadow = true;
  g.add(suelo, montes, rocas);
  return g;
}

export function crearSalaEstacion(sala: SalaEstacion, materialesJuego: Materiales): Sala3D {
  const materiales = materialesEstacion(materialesJuego);
  const plano = PLANOS[sala];
  const raiz = new THREE.Group();
  raiz.name = `Station_Room_${sala}`;
  const m = medio(plano);

  // Own furniture, fused by material.
  if (plano.propios.length) {
    const g = new THREE.Group();
    for (const [f, x, z, giro] of plano.propios) {
      const o = f(materiales);
      o.position.set(x, 0, z);
      o.rotation.y = giro;
      g.add(o);
    }
    raiz.add(fusionar(g, `Station_Own_Furniture_${sala}`));
  }

  // Wall runs in metres, filled when the kit arrives; the camera reads `muros` from the first frame.
  const muros: MuroSala[] = (["norte", "sur", "oeste", "este"] as const).map((lado) => {
    const grupo = new THREE.Group();
    grupo.name = `Station_Wall_${lado}`;
    raiz.add(grupo);
    const normal: readonly [number, number] = lado === "norte" ? [0, -1] : lado === "sur" ? [0, 1] : lado === "oeste" ? [-1, 0] : [1, 0];
    return { grupo, normal };
  });

  void cargarKitEstacion().then((kit) => {
    // Kit-unit content lives in one scaled group whose origin is the room's north-west inner corner.
    const enKit = (o: THREE.Object3D, destino: THREE.Group) => {
      o.position.multiplyScalar(E);
      o.position.x -= m.x;
      o.position.z -= m.z;
      o.scale.multiplyScalar(E);
      destino.add(o);
    };
    const suelo = new THREE.Group();
    suelo.name = "Station_Floor";
    raiz.add(entornoMarte(materiales));
    raiz.add(suelo);
    // A mid grey floor under white walls and furniture: the room gets a base tone and the shadows read.
    const piso = new THREE.MeshStandardMaterial({ name: "Station_Floor", color: "#C2C0CC", roughness: 0.75, metalness: 0 });
    for (let x = 0; x < plano.ancho; x += 4) for (let z = 0; z < plano.fondo; z += 4) enKit(pieza(kit, "Floor_L_98", x, z), suelo);
    suelo.traverse((o) => { if (o instanceof THREE.Mesh) { o.material = piso; o.castShadow = false; } });

    const [norte, sur, oeste, este] = muros.map((mu) => mu.grupo) as [THREE.Group, THREE.Group, THREE.Group, THREE.Group];
    const hueco = (lado: Lado, x: number) => plano.puertas.some(([l, px]) => l === lado && x >= px && x < px + 4);
    for (let x = 0; x < plano.ancho; x += 2) {
      if (!hueco("norte", x)) enKit(pieza(kit, "Wall_L_66", x, 0, 1), norte);
      if (!hueco("sur", x)) enKit(pieza(kit, "Wall_L_66", x + 2, plano.fondo, 3), sur);
    }
    for (let z = 0; z < plano.fondo; z += 2) {
      enKit(pieza(kit, "Wall_L_66", 0, z + 2, 2), oeste);
      const ventana = plano.ventanaEste && z >= 2 && z < 6;
      if (!ventana) enKit(pieza(kit, "Wall_L_66", plano.ancho, z, 0), este);
    }
    if (plano.ventanaEste) {
      enKit(pieza(kit, "Wall_L_long_frame_92", plano.ancho, 1, 0), este);
      enKit(pieza(kit, "Wall_L_long_window_93", plano.ancho, 1, 0), este);
    }
    // Gates straddle the wall line (2 deep, the wall is 0.5), and behind each one a short lit stretch of
    // corridor (floor, side walls, end wall) shows where it leads instead of a black hole.
    for (const [lado, x] of plano.puertas) {
      const g = lado === "norte" ? norte : sur;
      const n = lado === "norte";
      enKit(pieza(kit, "Gate_L_127", x, n ? -1.25 : plano.fondo - 0.75), g);
      const z0 = n ? -5.25 : plano.fondo + 0.75; // stub floor tile corner
      // The stub floor belongs to its wall run, so it hides with it when it is on the camera side.
      const pisoTramo = pieza(kit, "Floor_L_98", x, z0);
      pisoTramo.traverse((o) => { if (o instanceof THREE.Mesh) o.material = piso; });
      enKit(pisoTramo, g);
      for (const dz of [0, 2]) {
        enKit(pieza(kit, "Wall_L_66", x, z0 + dz + 2, 2), g);
        enKit(pieza(kit, "Wall_L_66", x + 4, z0 + dz, 0), g);
      }
      const zFin = n ? z0 : z0 + 4;
      for (const dx of [0, 2]) enKit(n ? pieza(kit, "Wall_L_66", x + dx, zFin, 1) : pieza(kit, "Wall_L_66", x + dx + 2, zFin, 3), g);
      const luz = new THREE.PointLight("#9CCBFF", 3, 5, 2);
      luz.position.set((x + 2) * E - m.x, 1.8, (z0 + 2) * E - m.z);
      raiz.add(luz);
    }

    const props = new THREE.Group();
    props.name = "Station_Props";
    raiz.add(props);
    for (const [nombre, x, z, cuartos, , y = 0] of plano.kit) enKit(pieza(kit, nombre, x, z, cuartos, y), props);
  });

  return { raiz, muros };
}

/** Walkable box (metres), a little inside the walls. */
export function zonaSalaEstacion(sala: SalaEstacion) {
  const m = medio(PLANOS[sala]);
  return { xMin: -m.x + 0.45, xMax: m.x - 0.45, zMin: -m.z + 0.45, zMax: m.z - 0.45 };
}

/** Doors: where they lead, the marker inside the gate and where the kid appears coming from there. */
export function puertasSalaEstacion(sala: SalaEstacion) {
  const p = PLANOS[sala], m = medio(p);
  return p.puertas.map(([lado, x, destino]) => {
    const cx = (x + 2) * E - m.x;
    const z = lado === "norte" ? -m.z + 0.5 : m.z - 0.5;
    const adentro = lado === "norte" ? 1.6 : -1.6;
    return { destino, x: cx, z, entrada: { x: cx, z: z + adentro, giro: lado === "norte" ? 0 : Math.PI } };
  });
}

/** Props to bump into and use. Kit props sit by their grid corner: their centre is about a metre in. */
export function puntosSalaEstacion(sala: SalaEstacion): PuntoSala[] {
  const p = PLANOS[sala], m = medio(p);
  const kit = p.kit.filter(([, , , , r]) => r > 0).map(([nombre, x, z, , radio], i) => ({
    id: `${nombre.replace(/_\d+$/, "")}_${i}`, x: x * E - m.x + 0.4, z: z * E - m.z + 0.4, radio, interactivo: true,
  }));
  const propios = p.propios.map(([f, x, z, , radio]) => ({ id: f.name, x, z, radio, interactivo: true }));
  return [...kit, ...propios];
}

/** Lights of an open-top room: a low fill and one warm key from the side, so walls and props cast shadows. */
export const AMBIENTE_ESTACION = {
  // Martian daytime sky and the outdoor horizon haze, so the rim and the rocks fade like outside.
  fondoEscena: "#F2CDB0",
  niebla: { color: "#F2CDB0", cerca: 22, lejos: 75 },
  luz: { color: "#FFE9D2", intensidad: 2.1, hemiCielo: "#EEF0FA", hemiSuelo: "#6E6985", hemi: 1.15 },
} as const;
