import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Experimental: the corridor that joins the workshop and the habitat, with a side branch to the airlock.
 *
 * Pieces from "Corridor Level Kit" by dueddel (KitJam 2021-08, free for any use, see
 * `public/kits/pasillo/LICENSE.txt`). 12 pieces in one 115 KB GLB (prune, quantize and meshopt).
 *
 * Look: the kit's pastel interior, seen from inside (closed ceiling, chase camera): pale pink shell and lilac
 * trims, plain mauve floor panels with ochre cables on top, white ceiling panels, pink wall strips and a soft
 * pink haze (fog) that melts the far end. The kit samples its colours from a palette strip; ours
 * (`paleta.png`, 1 x 19 px) is our own file (the palette the kit ships with belongs to a third party and is
 * not included).
 *
 * Layout along x, one tile every `TRAMO` m: workshop end, straight, T crossing (branch to -z, the airlock),
 * straight, habitat end. The kit is built for 5 x 4 x 3 m tiles; it is scaled to the kid.
 */

const KIT = `${import.meta.env.BASE_URL}kits/pasillo/`;
const ESCALA = 0.8;
export const TRAMO = 5 * ESCALA;
/** Distance from a dead-end tile centre to its closed end. */
const FONDO = 2 * ESCALA;

type PiezaPasillo =
  | "Corridor-01 Straight" | "Corridor-01 Dead End" | "Corridor-01 T-Crossing"
  | "Floor Glas-01 Straight" | "Floor Glas-01 Dead End" | "Floor Glas-01 T-Crossing"
  | "Conduit-01 Straight" | "Conduit-01 Dead End" | "Conduit-02 T-Crossing"
  | "Frame-01 Straight" | "Lamp-01 Straight" | "Lamp-01 T-Crossing"
  | "Light Strip-02 Straight" | "Light Strip-02 Dead End" | "Light Strip-02 T-Crossing";

const RECTO: readonly PiezaPasillo[] = ["Corridor-01 Straight", "Floor Glas-01 Straight", "Conduit-01 Straight", "Frame-01 Straight", "Lamp-01 Straight", "Light Strip-02 Straight"];
const FIN: readonly PiezaPasillo[] = ["Corridor-01 Dead End", "Floor Glas-01 Dead End", "Conduit-01 Dead End", "Light Strip-02 Dead End"];

/** [tile x, tile z, quarter turns, pieces]. Dead ends close toward +x as authored. */
const TRAMOS: readonly (readonly [number, number, number, readonly PiezaPasillo[]])[] = [
  [-2, 0, 2, FIN],
  [-1, 0, 0, RECTO],
  [0, 0, 2, ["Corridor-01 T-Crossing", "Floor Glas-01 T-Crossing", "Conduit-02 T-Crossing", "Lamp-01 T-Crossing", "Light Strip-02 T-Crossing"]],
  [1, 0, 0, RECTO],
  [2, 0, 0, FIN],
  [0, -1, 1, FIN],
];

/** Walkable boxes: the main run and the branch. A position is valid inside any of them. */
export const ZONAS_PASILLO = [
  { xMin: -2 * TRAMO - FONDO + 0.35, xMax: 2 * TRAMO + FONDO - 0.35, zMin: -1.15, zMax: 1.15 },
  { xMin: -1.1, xMax: 1.1, zMin: -TRAMO - FONDO + 0.35, zMax: 0 },
] as const;

const MARCA = 2 * TRAMO + FONDO - 0.45;
/** Doors at the three ends: where they lead, the marker spot and where the kid appears coming from there. */
export const PUERTAS_PASILLO = [
  { destino: "taller", x: -MARCA, z: 0, entrada: { x: -MARCA + 1.8, z: 0, giro: Math.PI / 2 } },
  { destino: "habitat", x: MARCA, z: 0, entrada: { x: MARCA - 1.8, z: 0, giro: -Math.PI / 2 } },
  { destino: "base", x: 0, z: -(TRAMO + FONDO - 0.45), entrada: { x: 0, z: -(TRAMO + FONDO - 0.45) + 1.8, giro: 0 } },
] as const;

/** Glow strip on each door: the expert's colour, cyan for the airlock. */
const COLOR_PUERTA: Record<string, string> = { taller: "#F2B531", habitat: "#47AAB5", base: "#73D4E1" };

/** A hatch at a dead end, in the kit's grey with a glowing strip. */
function puertaVisible(destino: string, x: number, z: number, giro: number): THREE.Group {
  const g = new THREE.Group();
  g.name = `Corridor_Door_${destino}`;
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.1), new THREE.MeshStandardMaterial({ color: "#C9B6C6", roughness: 0.7 }));
  marco.position.y = 1.05;
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.85, 0.06), new THREE.MeshStandardMaterial({ color: "#EFE2EA", roughness: 0.6 }));
  hoja.position.set(0, 0.95, 0.06);
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: COLOR_PUERTA[destino] }));
  franja.position.set(0, 1.55, 0.1);
  g.add(marco, hoja, franja);
  g.position.set(x, 0, z);
  g.rotation.y = giro;
  return g;
}

/**
 * Builds the corridor. Returns the group at once and adds the kit pieces when they arrive. The shell faces
 * inward, so single-sided materials are right from the inside camera.
 */
export function crearPasillo(): THREE.Group {
  const raiz = new THREE.Group();
  raiz.name = "Corridor_Kit";

  for (const p of PUERTAS_PASILLO) {
    const fondo = p.z === 0 ? { x: Math.sign(p.x) * (2 * TRAMO + FONDO - 0.08), z: 0 } : { x: 0, z: -(TRAMO + FONDO - 0.08) };
    raiz.add(puertaVisible(p.destino, fondo.x, fondo.z, p.entrada.giro));
  }

  // Soft pink-white light under each ceiling panel (no shadows: cheap, and the shell would block a sun anyway).
  for (const x of [-TRAMO, TRAMO, -2 * TRAMO, 2 * TRAMO, 0]) {
    const luz = new THREE.PointLight("#FFE3EA", 3, 7, 2);
    luz.position.set(x, 1.5, 0);
    raiz.add(luz);
  }
  const ramal = new THREE.PointLight("#FFE3EA", 2.5, 6, 2);
  ramal.position.set(0, 1.5, -TRAMO);
  raiz.add(ramal);

  const paleta = new THREE.TextureLoader().load(`${KIT}paleta.png`);
  paleta.flipY = false; // glTF convention
  paleta.colorSpace = THREE.SRGBColorSpace;
  paleta.magFilter = THREE.NearestFilter;
  paleta.minFilter = THREE.NearestFilter;
  paleta.generateMipmaps = false;
  const materiales: Record<string, THREE.Material> = {
    rough: new THREE.MeshStandardMaterial({ name: "Corridor_Shell", map: paleta, roughness: 0.8, metalness: 0 }),
    // Ceiling panels glow white, unlit (the wall strips get their own pink below).
    emissive: new THREE.MeshBasicMaterial({ name: "Corridor_Light", color: "#FFFFFF", fog: false }),
    // Glossy mauve floor panels, see-through enough for the cables underneath to read.
    glas: new THREE.MeshStandardMaterial({ name: "Corridor_Floor", color: "#7E6A78", roughness: 0.3, metalness: 0, transparent: true, opacity: 0.45, depthWrite: false }),
  };
  const tira = new THREE.MeshBasicMaterial({ name: "Corridor_Strip", color: "#FF9FB8" });

  const cargador = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  void cargador.loadAsync(`${KIT}pasillo.glb`).then((gltf) => {
    for (const [tx, tz, cuartos, piezas] of TRAMOS) {
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
  return raiz;
}

/** Inside a closed tube: pink haze and a soft pink fill from above and from the floor bounce. */
export const AMBIENTE_PASILLO = {
  fondoEscena: "#E9CBD1",
  niebla: { color: "#E9CBD1", cerca: 5, lejos: 24 },
  luz: { color: "#FFE3EA", intensidad: 0.3, hemiCielo: "#FFE6EC", hemiSuelo: "#E8C4CE", hemi: 2.4 },
} as const;
