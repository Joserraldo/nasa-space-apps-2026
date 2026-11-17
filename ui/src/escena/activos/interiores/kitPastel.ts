import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Shared base of the pastel interiors (corridor and rooms) built from "Corridor Level Kit" by dueddel
 * (KitJam 2021-08, free for any use, see `public/kits/pasillo/LICENSE.txt`): 20 pieces in one 150 KB GLB
 * (prune, quantize and meshopt).
 *
 * Look: the kit's pastel interior seen from inside: pale pink shell and lilac trims, glossy mauve floor
 * panels with ochre cables showing through, white ceiling panels, warm white wall strips (lit like diffuser
 * panels, not flat stickers) and a soft pink haze. The kit samples its colours from a palette strip; ours
 * (`paleta.png`, 1 x 19 px) is our own file (the palette the kit ships with belongs to a third party and is
 * not included).
 *
 * Tiles are 5 x 5 x 3 m as authored, scaled to the kid. Authored openings: straight runs along x; a dead
 * end closes toward +x; a T crossing has its wall toward -z; a sharp bend has its walls toward +x and -z.
 * Each quarter turn (rotation.y = q * PI/2) moves a wall from -z to -x, from -x to +z, from +z to +x.
 */

const KIT = `${import.meta.env.BASE_URL}kits/pasillo/`;
export const ESCALA = 0.8;
export const TRAMO = 5 * ESCALA;
/** Top of the kit's floor panels and rims (0.2 m as authored): where feet stand, not y = 0. */
export const ALTURA_PISO = 0.2 * ESCALA;
/** Distance from a tile centre to a wall that closes it (dead end, T, bend). */
export const PARED = 2 * ESCALA;

export type PiezaKit =
  | "Corridor-01 Straight" | "Corridor-01 Dead End" | "Corridor-01 T-Crossing" | "Corridor-01 Bend Sharp"
  | "Floor Glas-01 Straight" | "Floor Glas-01 Dead End" | "Floor Glas-01 T-Crossing" | "Floor Glas-01 Bend Sharp"
  | "Conduit-01 Straight" | "Conduit-01 Dead End" | "Conduit-02 T-Crossing" | "Conduit-01 Bend"
  | "Frame-01 Straight" | "Lamp-01 Straight" | "Lamp-01 T-Crossing" | "Lamp-01 Bend"
  | "Light Strip-02 Straight" | "Light Strip-02 Dead End" | "Light Strip-02 T-Crossing" | "Light Strip-02 Bend Sharp";

/** [x, z (in tiles), quarter turns, pieces]. */
export type Tramo = readonly [number, number, number, readonly PiezaKit[]];

export const RECTO: readonly PiezaKit[] = ["Corridor-01 Straight", "Floor Glas-01 Straight", "Conduit-01 Straight", "Frame-01 Straight", "Lamp-01 Straight", "Light Strip-02 Straight"];
export const FIN: readonly PiezaKit[] = ["Corridor-01 Dead End", "Floor Glas-01 Dead End", "Conduit-01 Dead End", "Light Strip-02 Dead End"];
export const CRUCE_T: readonly PiezaKit[] = ["Corridor-01 T-Crossing", "Floor Glas-01 T-Crossing", "Conduit-02 T-Crossing", "Lamp-01 T-Crossing", "Light Strip-02 T-Crossing"];
export const CURVA: readonly PiezaKit[] = ["Corridor-01 Bend Sharp", "Floor Glas-01 Bend Sharp", "Conduit-01 Bend", "Lamp-01 Bend", "Light Strip-02 Bend Sharp"];

/** Glow strip on each door: the expert's colour, cyan for the airlock and the corridor. */
const COLOR_PUERTA: Record<string, string> = { taller: "#F2B531", habitat: "#47AAB5", esclusa: "#73D4E1", base: "#73D4E1", pasillo: "#73D4E1" };

/** A hatch against a wall, in the kit's lilac with a glowing strip. `giro` faces it into the room. */
export function puertaVisible(destino: string, x: number, z: number, giro: number): THREE.Group {
  const g = new THREE.Group();
  g.name = `Kit_Door_${destino}`;
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.1), new THREE.MeshStandardMaterial({ color: "#C9B6C6", roughness: 0.7 }));
  marco.position.y = 1.05;
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.85, 0.06), new THREE.MeshStandardMaterial({ color: "#EFE2EA", roughness: 0.6 }));
  hoja.position.set(0, 0.95, 0.06);
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: COLOR_PUERTA[destino] ?? "#73D4E1" }));
  franja.position.set(0, 1.55, 0.1);
  g.add(marco, hoja, franja);
  g.position.set(x, 0, z);
  g.rotation.y = giro;
  return g;
}

/** Soft light under a ceiling panel (no shadows: cheap, and the closed shell would block a sun anyway). */
export function luzTecho(x: number, z: number, intensidad = 4): THREE.PointLight {
  const luz = new THREE.PointLight("#FFF4EA", intensidad, 7, 2);
  luz.position.set(x, 1.5, z);
  return luz;
}

/**
 * Adds the tiles to `raiz` when the GLB arrives. The shell faces inward, so single-sided materials are right
 * from the inside camera.
 */
export function colocarTramos(raiz: THREE.Group, tramos: readonly Tramo[]): void {
  const paleta = new THREE.TextureLoader().load(`${KIT}paleta.png`);
  paleta.flipY = false; // glTF convention
  paleta.colorSpace = THREE.SRGBColorSpace;
  paleta.magFilter = THREE.NearestFilter;
  paleta.minFilter = THREE.NearestFilter;
  paleta.generateMipmaps = false;
  const materiales: Record<string, THREE.Material> = {
    rough: new THREE.MeshStandardMaterial({ name: "Kit_Shell", map: paleta, roughness: 0.8, metalness: 0 }),
    // Ceiling panels glow, unlit.
    emissive: new THREE.MeshBasicMaterial({ name: "Kit_Ceiling_Light", color: "#FFFDF8", fog: false }),
    // Glossy mauve floor panels, see-through enough for the cables underneath to read.
    glas: new THREE.MeshStandardMaterial({ name: "Kit_Floor", color: "#2B2C38", roughness: 0.3, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false }),
  };
  // Wall strips: warm white diffusers that still take the room light, so they read as lamps, not stickers.
  const tira = new THREE.MeshStandardMaterial({ name: "Kit_Wall_Strip", color: "#DDEEFF", emissive: "#5AB4FF", emissiveIntensity: 0.7, roughness: 0.5, metalness: 0 });

  const cargador = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  void cargador.loadAsync(`${KIT}pasillo.glb`).then((gltf) => {
    for (const [tx, tz, cuartos, piezas] of tramos) {
      for (const nombre of piezas) {
        // GLTFLoader sanitizes node names (spaces become underscores).
        const original = gltf.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(nombre));
        if (!original) continue;
        const copia = original.clone();
        copia.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            const propio = (o.material as THREE.Material).name;
            o.material = propio === "emissive" && nombre.startsWith("Light Strip") ? tira : (materiales[propio] ?? materiales.rough!);
            o.receiveShadow = true;
          }
        });
        // The node keeps its own transform (quantize stores the dequantization scale there); place a holder.
        const tramo = new THREE.Group();
        tramo.add(copia);
        tramo.scale.setScalar(ESCALA);
        tramo.position.set(tx * TRAMO, 0, tz * TRAMO);
        tramo.rotation.y = (cuartos * Math.PI) / 2;
        raiz.add(tramo);
      }
    }
  });
}

/** Inside a closed shell: a light cool haze, white fill from above and a soft lilac bounce, like the station rooms. */
export const AMBIENTE_KIT = {
  fondoEscena: "#9C9AAE",
  niebla: { color: "#9C9AAE", cerca: 7, lejos: 28 },
  luz: { color: "#FFF4EA", intensidad: 0.2, hemiCielo: "#ECEAF4", hemiSuelo: "#4A4660", hemi: 1.0 },
} as const;
