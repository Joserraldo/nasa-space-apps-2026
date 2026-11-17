import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Experimental: the corridor that joins the workshop and the habitat, with a side branch to the airlock.
 *
 * Pieces from "Corridor Level Kit" by dueddel (KitJam 2021-08; the author released it for any use and asked
 * to treat it as CC0, see `public/kits/pasillo/LICENSE.txt`). 12 pieces in one 115 KB GLB (prune, quantize
 * and meshopt). The kit colours come from a palette strip; ours (`paleta.png`, 1 x 19 px) keeps the cells
 * the kit samples but paints them with the game tokens: lilac walls, indigo frames, amber floor cables,
 * cyan light strips.
 *
 * Layout along x, one tile every `TRAMO` m: workshop end, straight, T crossing (branch to -z, the airlock),
 * straight, habitat end. The kit is built for 5 m tiles; it is scaled to the kid.
 */

const KIT = `${import.meta.env.BASE_URL}kits/pasillo/`;
const ESCALA = 0.7;
export const TRAMO = 5 * ESCALA;

type PiezaPasillo =
  | "Corridor-01 Straight" | "Corridor-01 Dead End" | "Corridor-01 T-Crossing"
  | "Floor Glas+Grid-01 Straight" | "Floor Glas+Grid-01 Dead End" | "Floor Glas+Grid-01 T-Crossing"
  | "Conduit-01 Straight" | "Frame-01 Straight" | "Lamp-01 Straight"
  | "Light Strip-02 Straight" | "Light Strip-02 Dead End" | "Light Strip-02 T-Crossing";

/** [tile x, tile z, quarter turns, pieces]. Dead ends close toward +x as authored. */
const TRAMOS: readonly (readonly [number, number, number, readonly PiezaPasillo[]])[] = [
  [-2, 0, 2, ["Corridor-01 Dead End", "Floor Glas+Grid-01 Dead End", "Light Strip-02 Dead End"]],
  [-1, 0, 0, ["Corridor-01 Straight", "Floor Glas+Grid-01 Straight", "Conduit-01 Straight", "Frame-01 Straight", "Lamp-01 Straight", "Light Strip-02 Straight"]],
  [0, 0, 2, ["Corridor-01 T-Crossing", "Floor Glas+Grid-01 T-Crossing", "Light Strip-02 T-Crossing"]],
  [1, 0, 0, ["Corridor-01 Straight", "Floor Glas+Grid-01 Straight", "Conduit-01 Straight", "Frame-01 Straight", "Lamp-01 Straight", "Light Strip-02 Straight"]],
  [2, 0, 0, ["Corridor-01 Dead End", "Floor Glas+Grid-01 Dead End", "Light Strip-02 Dead End"]],
  [0, -1, 1, ["Corridor-01 Dead End", "Floor Glas+Grid-01 Dead End", "Light Strip-02 Dead End"]],
];

/** Walkable boxes: the main run and the branch. A position is valid inside any of them. */
export const ZONAS_PASILLO = [
  { xMin: -2 * TRAMO - 1.1, xMax: 2 * TRAMO + 1.1, zMin: -1.0, zMax: 1.0 },
  { xMin: -0.95, xMax: 0.95, zMin: -TRAMO - 1.1, zMax: 0 },
] as const;

/** Doors at the three ends: where they lead, the marker spot and where the kid appears coming from there. */
export const PUERTAS_PASILLO = [
  { destino: "taller", x: -2 * TRAMO - 1.2, z: 0, entrada: { x: -2 * TRAMO - 0.6, z: 0, giro: Math.PI / 2 } },
  { destino: "habitat", x: 2 * TRAMO + 1.2, z: 0, entrada: { x: 2 * TRAMO + 0.6, z: 0, giro: -Math.PI / 2 } },
  { destino: "base", x: 0, z: -TRAMO - 1.2, entrada: { x: 0, z: -TRAMO - 0.6, giro: 0 } },
] as const;

/** Door slab colour by destination: the expert's colour, cyan for the airlock. */
const COLOR_PUERTA: Record<string, string> = { taller: "#F2B531", habitat: "#47AAB5", base: "#73D4E1" };

function puertaVisible(destino: string, x: number, z: number, giro: number): THREE.Group {
  const g = new THREE.Group();
  g.name = `Corridor_Door_${destino}`;
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 0.08), new THREE.MeshStandardMaterial({ color: "#D9CFE1", roughness: 0.7 }));
  hoja.position.y = 0.95;
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: COLOR_PUERTA[destino] }));
  marco.position.y = 1.96;
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.1), new THREE.MeshBasicMaterial({ color: COLOR_PUERTA[destino] }));
  franja.position.set(0.45, 1.0, 0.01);
  g.add(hoja, marco, franja);
  g.position.set(x, 0, z);
  g.rotation.y = giro;
  return g;
}

/**
 * Builds the corridor. Returns the group at once and adds the kit pieces when they arrive. Materials are
 * single-sided on purpose: the kit shell faces inward, so from the cut-away camera the near wall and the
 * ceiling drop out and the inside shows, like the rooms.
 */
export function crearPasillo(): THREE.Group {
  const raiz = new THREE.Group();
  raiz.name = "Corridor_Kit";

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: "#8F5E50", roughness: 1 }));
  suelo.name = "Corridor_Outside_Ground";
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = -0.02;
  suelo.receiveShadow = true;
  raiz.add(suelo);

  for (const p of PUERTAS_PASILLO) raiz.add(puertaVisible(p.destino, p.x + Math.sign(p.x) * 0.15, p.z - (p.z ? 0.15 : 0), p.entrada.giro));

  const paleta = new THREE.TextureLoader().load(`${KIT}paleta.png`);
  paleta.flipY = false; // glTF convention
  paleta.colorSpace = THREE.SRGBColorSpace;
  paleta.magFilter = THREE.NearestFilter;
  paleta.minFilter = THREE.NearestFilter;
  paleta.generateMipmaps = false;
  const materiales: Record<string, THREE.Material> = {
    rough: new THREE.MeshStandardMaterial({ name: "Corridor_Shell", map: paleta, roughness: 0.85, metalness: 0 }),
    emissive: new THREE.MeshBasicMaterial({ name: "Corridor_Light", map: paleta }),
    // Light, see-through floor glass so the amber cables underneath read.
    glas: new THREE.MeshStandardMaterial({ name: "Corridor_Glass", color: "#C9BCE8", roughness: 0.15, transparent: true, opacity: 0.3, depthWrite: false }),
  };

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
            const nombreMat = (o.material as THREE.Material).name;
            o.material = materiales[nombreMat] ?? materiales.rough!;
            o.castShadow = nombreMat === "rough";
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

/** Preview settings: Mars outside, cool fill inside. */
export const AMBIENTE_PASILLO = {
  fondoEscena: "#F2CDB0",
  luz: { color: "#FFE9D2", intensidad: 2.2, hemiCielo: "#FFF6EC", hemiSuelo: "#C9BCE8", hemi: 2.4 },
} as const;
