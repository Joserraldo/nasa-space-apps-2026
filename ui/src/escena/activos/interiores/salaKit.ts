import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Materiales } from "../../materiales";
import { fusionar } from "../fusionar";
import { botiquin, camilla, comedor, litera } from "./habitat";
import { banco, dock, estanteBaterias } from "./taller";

/**
 * Experimental: rooms rebuilt with a kit. Dev preview only: `/escena.html?sala=taller|habitat&kit=1` and
 * `?sala=outpost`.
 *
 * The room shell (floor, walls, door, window) and the technical gear come from "Low Poly Sci-Fi Station
 * Free" by heyheythere (CC BY 4.0; credit and license in `public/kits/estacion/LICENSE.txt`). Each room
 * keeps the game's own furniture that tells its expert's story, and drops what made no sense indoors:
 * - `taller` (Engineer, energy): workbench, battery shelf and charging dock stay; the solar panel on the
 *   floor is gone (panels work outside). Kit: main breaker, server rack, diagnostic console, spare crates.
 * - `habitat` (Doctor, life): bunk, dining table, stretcher and medical kit stay. Kit: a wide window to
 *   the Martian day, supplies, a status screen.
 * - `outpost` (the ship of the "outpost sorpresa" mission, which has no ground): all kit, cold light and
 *   stars outside. The Mars rooms are tinted warm so every mission reads differently.
 *
 * Performance:
 * - One shared material per room. The kit's atlas is 2048x2048 but only uses its top 224 rows, so it
 *   ships cropped to 2048x256 (1/8 of the GPU memory) and the UVs are scaled with `repeat`.
 * - The GLBs point to external atlas files; those requests are answered with a 1x1 image, so the two
 *   atlas textures are downloaded once instead of once per piece.
 * - Floor tiles go in one InstancedMesh.
 */

const BASE = `${import.meta.env.BASE_URL}kits/estacion/`;
/** Fraction of the original 2048 px atlas kept in the cropped file. */
const FRANJA = 256 / 2048;
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export type SalaKit = "taller" | "habitat" | "outpost";

type Pieza =
  | "floor_ss" | "wall_ss" | "wall_ss_doorway" | "wall_ss_window_wide" | "wall_ss_post" | "starfield_ss"
  | "console_ss" | "chair_ss" | "door_ss" | "rack_ss" | "crate_ss" | "screen_ss_map" | "breaker_ss"
  | "card_reader_ss" | "light_ss_emergency";

/** [piece, x, z, quarter turns (0 faces +z, the open front), y]. Walls are 2 m wide and 3 m tall. */
type Puesto = readonly [Pieza, number, number, number, number?];
/** [builder of an own piece, x, z, turn in radians]. */
type Propio = readonly [(m: Materiales) => THREE.Object3D, number, number, number?];

/**
 * Props of "Sci-fi like asset pack" by loafbrr (CC0), shipped as one 99 KB GLB with 10 pieces
 * (`public/kits/base/props.glb`, 2,890 triangles). Textures are the pack's base color multiplied by its
 * ambient occlusion, 256 px WebP (30 KB in total); its normal, roughness and metal maps are left out on
 * purpose: they made the props read photo-real next to the flat game style.
 */
type PiezaBase =
  | "Cont_Barrel" | "Cont_Box" | "Cont_Chest" | "Cont_Locker_Static" | "Cont_LockerGroup_Static"
  | "Furn_Stool" | "Furn_Table_1" | "Cont_DisplayCase_1" | "Furn_Couch" | "Tool_ToolBox";
/** [piece, x, z, turn in radians (0 = as authored), y]. */
type PuestoBase = readonly [PiezaBase, number, number, number?, number?];

interface Plano {
  /** Pieces of the back wall, left to right (x from -4 to 4). */
  fondo: readonly Pieza[];
  kit: readonly Puesto[];
  propios: readonly Propio[];
  /** Props of the CC0 base pack. */
  base: readonly PuestoBase[];
  /** Multiplies the kit colors: warm on Mars, neutral on the ship. */
  tinte: string;
  estrellas: boolean;
  /** Scene background seen through the window and around the cut room. */
  fondoEscena: string;
  luz: { color: string; intensidad: number; hemiCielo: string; hemiSuelo: string; hemi: number };
}

const LATERALES: readonly Puesto[] = [
  ["wall_ss", -4, -2, 1], ["wall_ss", -4, 0, 1], ["wall_ss", -4, 2, 1],
  ["wall_ss", 4, -2, -1], ["wall_ss", 4, 0, -1], ["wall_ss", 4, 2, -1],
  ["wall_ss_post", -4, -3, 0], ["wall_ss_post", 4, -3, 0],
];

const PLANOS: Readonly<Record<SalaKit, Plano>> = {
  taller: {
    fondo: ["wall_ss", "wall_ss", "wall_ss", "wall_ss_doorway"],
    kit: [
      ["door_ss", 3, -3, 0],
      ["console_ss", -0.6, -2.25, 0], ["chair_ss", -0.6, -1.35, 2],
      ["rack_ss", -3.45, -0.6, 1],
      ["breaker_ss", -3.85, 1.2, 1],
      ["screen_ss_map", 3.85, -0.9, -1, 1.5],
      ["card_reader_ss", 1.8, -2.85, 0],
    ],
    propios: [
      [estanteBaterias, -2.7, -2.5],
      [banco, 1.3, -2.4],
      [dock, 3.1, 1.2],
    ],
    // Coolant barrels and spare parts; the toolbox sits on the box.
    base: [
      ["Cont_Barrel", -3.0, 2.2], ["Cont_Barrel", -1.9, 2.45, 0.6],
      ["Cont_Box", -0.7, 2.3, 0.3], ["Tool_ToolBox", -0.7, 2.3, 0.3, 0.8],
    ],
    tinte: "#FFF3E8",
    estrellas: false,
    fondoEscena: "#F0E5F2",
    luz: { color: "#FFE9D2", intensidad: 2.6, hemiCielo: "#FFF6EC", hemiSuelo: "#E8C9BC", hemi: 2.6 },
  },
  habitat: {
    fondo: ["wall_ss", "wall_ss_window_wide", "wall_ss_doorway"],
    kit: [
      ["door_ss", 3, -3, 0],
      ["screen_ss_map", -3.85, 0.6, 1, 1.5],
      ["card_reader_ss", 1.8, -2.85, 0],
      ["light_ss_emergency", 3.85, -1.6, -1],
    ],
    propios: [
      [litera, -3.0, -2.2],
      [comedor, 0.3, 0.2],
      [camilla, 2.5, 1.9],
      [botiquin, 3.85, 0.3, -Math.PI / 2],
    ],
    // Rest corner under the status screen, a suit locker, supplies.
    base: [
      ["Furn_Couch", -1.9, 2.45],
      ["Cont_Locker_Static", 3.5, -1.0, -Math.PI / 2],
      ["Cont_Box", -3.35, 1.1, 0.4],
    ],
    tinte: "#FFF3E8",
    estrellas: false,
    // Martian daytime sky (caramel horizon) behind the window.
    fondoEscena: "#F2CDB0",
    luz: { color: "#FFE9D2", intensidad: 2.6, hemiCielo: "#FFF6EC", hemiSuelo: "#E8C9BC", hemi: 2.6 },
  },
  outpost: {
    fondo: ["wall_ss", "wall_ss_window_wide", "wall_ss_doorway"],
    kit: [
      ["door_ss", 3, -3, 0],
      ["console_ss", 0, -2.2, 0], ["chair_ss", 0, -1.3, 2],
      ["screen_ss_map", -3.85, -0.5, 1, 1.5],
      ["breaker_ss", -3.85, 1.4, 1],
      ["rack_ss", 3.45, 0.2, -1],
      ["card_reader_ss", 1.8, -2.85, 0],
      ["light_ss_emergency", -1.7, -2.85, 0],
    ],
    propios: [],
    // Cargo hold corner and a locker row on the left wall.
    base: [
      ["Cont_Chest", 0.6, 2.4, 0.15], ["Cont_Barrel", 2.7, 1.5], ["Cont_Barrel", 2.8, 2.55, 0.8],
      ["Cont_Locker_Static", -3.5, 2.4, Math.PI / 2],
    ],
    tinte: "#FFFFFF",
    estrellas: true,
    fondoEscena: "#1A1F3D",
    luz: { color: "#DCE6FF", intensidad: 1.8, hemiCielo: "#C8D2F0", hemiSuelo: "#3A4060", hemi: 1.1 },
  },
};

/** Preview settings of a kit room (background and lights). */
export function ambienteSalaKit(sala: SalaKit): Pick<Plano, "fondoEscena" | "luz"> {
  const { fondoEscena, luz } = PLANOS[sala];
  return { fondoEscena, luz };
}

function texturaAtlas(archivo: string): THREE.Texture {
  const t = new THREE.TextureLoader().load(BASE + archivo);
  t.flipY = false; // glTF convention
  t.repeat.set(1, 1 / FRANJA);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sombras(o: THREE.Object3D): void {
  o.traverse((x) => {
    if (x instanceof THREE.Mesh) {
      x.castShadow = true;
      x.receiveShadow = true;
    }
  });
}

const BASE_PACK = `${import.meta.env.BASE_URL}kits/base/`;

/** Texture file of each pack material (lower case folder name). Glass materials get a shared glass. */
const TEXTURA_BASE: Record<string, string> = {
  Barrel_mat: "barrel", Box_mat: "box", Chest_MAT: "chest", Locker_mat: "locker", Chair_mat: "chair",
  Table_1_mat: "table_1", DIsplayCase_1_mat: "displaycase_1", Couch_mat: "couch", ToolBox_mat: "toolbox",
};

/** Loads the CC0 props once and places the room's copies, tinted like the rest of the room. */
async function cargarBase(plano: Plano, raiz: THREE.Group): Promise<void> {
  const gltf = await new GLTFLoader().loadAsync(`${BASE_PACK}props.glb`);
  const cargador = new THREE.TextureLoader();
  const materiales = new Map<string, THREE.Material>();
  const vidrio = new THREE.MeshStandardMaterial({ color: "#CFEFF5", transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
  const material = (nombre: string): THREE.Material => {
    if (/glass/i.test(nombre)) return vidrio;
    let m = materiales.get(nombre);
    if (!m) {
      const archivo = TEXTURA_BASE[nombre];
      const t = archivo ? cargador.load(`${BASE_PACK}${archivo}.webp`) : null;
      if (t) {
        t.flipY = false; // glTF convention
        t.colorSpace = THREE.SRGBColorSpace;
      }
      m = new THREE.MeshStandardMaterial({ color: plano.tinte, map: t, roughness: 0.85, metalness: 0 });
      materiales.set(nombre, m);
    }
    return m;
  };
  for (const [nombre, x, z, giro = 0, y = 0] of plano.base) {
    const original = gltf.scene.getObjectByName(nombre);
    if (!original) continue;
    const copia = original.clone();
    copia.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = material((o.material as THREE.Material).name);
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    copia.position.set(x, y, z);
    copia.rotation.set(0, giro, 0);
    raiz.add(copia);
  }
}

/**
 * Builds the room. Returns the group at once (own furniture included) and adds the kit pieces when they
 * arrive, so the caller can add it to the scene synchronously.
 */
export function crearSalaKit(sala: SalaKit, materiales: Materiales): THREE.Group {
  const plano = PLANOS[sala];
  const raiz = new THREE.Group();
  raiz.name = `Room_Kit_${sala}`;

  // Own furniture, fused by material: a handful of draw calls instead of one per part.
  const propios = new THREE.Group();
  for (const [fabrica, x, z, giro = 0] of plano.propios) {
    const o = fabrica(materiales);
    o.position.set(x, 0, z);
    o.rotation.y = giro;
    propios.add(o);
  }
  if (propios.children.length) {
    const fusionados = fusionar(propios, "Room_Own_Furniture");
    sombras(fusionados);
    raiz.add(fusionados);
  }
  if (!plano.estrellas) {
    // Mars outside the cut room and behind the window: regolith ground to the horizon.
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: "#8F5E50", roughness: 1 }));
    suelo.name = "Room_Outside_Ground";
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.02;
    suelo.receiveShadow = true;
    raiz.add(suelo);
  }

  const material = new THREE.MeshStandardMaterial({
    name: "Kit_Station",
    color: plano.tinte,
    map: texturaAtlas("atlas.webp"),
    emissiveMap: texturaAtlas("atlas_glow.webp"),
    emissive: 0xffffff,
    vertexColors: true, // the kit bakes its occlusion into vertex colors
    roughness: 0.9,
    metalness: 0,
  });
  const gestor = new THREE.LoadingManager();
  gestor.setURLModifier((url) => (/atlas(_glow)?\.png$/.test(url) ? PIXEL : url));
  const cargador = new GLTFLoader(gestor);

  // Back wall: pieces laid left to right by their width (window 4 m, the rest 2 m).
  const puestos: Puesto[] = [...LATERALES, ...plano.kit];
  let x = -4;
  for (const p of plano.fondo) {
    const ancho = p === "wall_ss_window_wide" ? 4 : 2;
    puestos.push([p, x + ancho / 2, -3, 0]);
    x += ancho;
  }
  const nombres = [...new Set<Pieza>(["floor_ss", ...(plano.estrellas ? (["starfield_ss"] as const) : []), ...puestos.map((p) => p[0])])];

  void Promise.all(nombres.map(async (n) => [n, (await cargador.loadAsync(`${BASE}${n}.glb`)).scene] as const)).then((cargadas) => {
    const pieza = new Map<Pieza, THREE.Object3D>(cargadas);
    for (const o of pieza.values()) {
      o.traverse((m) => { if (m instanceof THREE.Mesh) m.material = material; });
      sombras(o);
    }

    // Floor: one InstancedMesh for the 4 x 3 tiles (2 x 2 m each).
    let losa: THREE.Mesh | undefined;
    pieza.get("floor_ss")!.traverse((o) => { if (o instanceof THREE.Mesh) losa ??= o; });
    if (losa) {
      const piso = new THREE.InstancedMesh(losa.geometry, material, 12);
      piso.name = "Kit_Floor";
      piso.receiveShadow = true;
      const m = new THREE.Matrix4();
      let i = 0;
      for (let px = -3; px <= 3; px += 2) for (let pz = -2; pz <= 2; pz += 2) piso.setMatrixAt(i++, m.makeTranslation(px, 0, pz));
      raiz.add(piso);
    }

    for (const [nombre, px, pz, giro, py = 0] of puestos) {
      const copia = pieza.get(nombre)!.clone();
      copia.position.set(px, py, pz);
      copia.rotation.y = (giro * Math.PI) / 2;
      raiz.add(copia);
    }

    if (plano.base.length) void cargarBase(plano, raiz);

    if (plano.estrellas) {
      const estrellas = pieza.get("starfield_ss")!;
      estrellas.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = false;
          o.receiveShadow = false;
          o.frustumCulled = false;
        }
      });
      raiz.add(estrellas);
    }
  });
  return raiz;
}

/** A thing in the room the kid bumps into and may interact with. */
export interface PuntoSala {
  /** Kit piece name or own builder name, with its index: stable id for the game to react to. */
  id: string;
  x: number;
  z: number;
  /** Collision radius in metres (0 = wall-mounted, no collision). */
  radio: number;
  interactivo: boolean;
}

const RADIO_PIEZA: Partial<Record<Pieza, number>> = {
  console_ss: 0.7, chair_ss: 0.35, rack_ss: 0.6, crate_ss: 0.72, breaker_ss: 0.25, screen_ss_map: 0, card_reader_ss: 0, light_ss_emergency: 0,
};
/** Plan radius of the base props (from their measured bounding boxes, long pieces approximated). */
const RADIO_BASE: Record<PiezaBase, number> = {
  Cont_Barrel: 0.57, Cont_Box: 0.46, Cont_Chest: 0.6, Cont_Locker_Static: 0.42, Cont_LockerGroup_Static: 0.9,
  Furn_Stool: 0.24, Furn_Table_1: 0.8, Cont_DisplayCase_1: 1.0, Furn_Couch: 0.7, Tool_ToolBox: 0.3,
};
const INTERACTIVAS: readonly Pieza[] = ["console_ss", "rack_ss", "breaker_ss", "screen_ss_map"];
/** Where the kid appears, just inside the door, and where he leaves. */
export const PUERTA_SALA = { x: 3, z: -2.2, radio: 0.9 } as const;

/** Obstacles and interactive spots of a kit room, derived from its plan. */
export function puntosSalaKit(sala: SalaKit): PuntoSala[] {
  const plano = PLANOS[sala];
  const kit = plano.kit
    .filter(([p]) => p in RADIO_PIEZA)
    .map(([p, x, z], i) => ({ id: `${p}_${i}`, x, z, radio: RADIO_PIEZA[p]!, interactivo: INTERACTIVAS.includes(p) }));
  const propios = plano.propios.map(([f, x, z]) => ({ id: f.name, x, z, radio: 0.95, interactivo: true }));
  const base = plano.base
    .filter(([, , , , y = 0]) => y === 0) // pieces resting on others do not add a second obstacle
    .map(([p, x, z], i) => ({ id: `${p}_${i}`, x, z, radio: RADIO_BASE[p], interactivo: p !== "Furn_Stool" }));
  return [...kit, ...propios, ...base];
}
