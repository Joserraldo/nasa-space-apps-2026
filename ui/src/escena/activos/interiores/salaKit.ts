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

interface Plano {
  /** Pieces of the back wall, left to right (x from -4 to 4). */
  fondo: readonly Pieza[];
  kit: readonly Puesto[];
  propios: readonly Propio[];
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
      ["crate_ss", -2.6, 1.9, 0], ["crate_ss", -1.3, 2.2, 0.25],
    ],
    propios: [
      [estanteBaterias, -2.7, -2.5],
      [banco, 1.3, -2.4],
      [dock, 3.1, 1.2],
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
      ["crate_ss", -3.1, 2.1, 0],
    ],
    propios: [
      [litera, -3.0, -2.2],
      [comedor, 0.3, 0.2],
      [camilla, 2.5, 1.9],
      [botiquin, 3.85, 0.3, -Math.PI / 2],
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
      ["crate_ss", 2.6, 1.4, 0], ["crate_ss", 0.8, 2.2, 0.25],
    ],
    propios: [],
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
