import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Pieces of "Low Poly Space Kit" by Likh0i (CC BY 4.0, https://sketchfab.com/3d-models/low-poly-space-kit-7045c47936934d6988a15cb7ce4eb20b;
 * credit in `public/kits/estacion2/LICENSE.txt`): 41 pieces in one 327 KB GLB (prune, quantize, meshopt).
 *
 * The kit is untextured: each material is a flat colour. Kept close to the originals, which read clean and
 * technical (white shell, grey metal, blue lights, dark navy glass), with the orange trims turned purple so
 * they sit with the game's lilac and plum, and the whites warmed a touch toward the game's ivory.
 *
 * Kit units: pieces sit on a grid with their origin at a corner and grow toward +x, +y, +z. A wall is 0.5 thick
 * (x), 2 long (z) and 4 tall; a floor tile is 4 x 4; the large gate is 4 wide (x) and 2 deep (z); a full
 * spacesuit is 2 tall. `ESCALA` turns that into metres for the kid (an adult suit becomes 1.6 m).
 */

const URL_KIT = `${import.meta.env.BASE_URL}kits/estacion2/estacion.glb`;
export const ESCALA_ESTACION = 0.8;

/** Kit material name to game colour. "Glow" and "Blue" are lights: unlit. */
const COLOR: Record<string, string> = {
  Plastic: "#F2F0EC", Aluminium: "#B9B8C2", Orange: "#7C5CC4", Blue: "#2F8EEA", Glow: "#5AB4FF",
  Dark: "#1D1E2A", Metalic: "#2B2C38", Chrome: "#C6D9EE", Gold: "#D69A2A", Green: "#3FBF62",
  Glass: "#123A78", material: "#8C2E3A",
};

export type PiezaEstacion =
  | "Floor_M_97" | "Floor_L_98" | "Floor_M_2_100" | "Wall_M_65" | "Wall_L_66" | "Wall_M_long_67" | "Wall_L_long_69"
  | "Wall_L_long_frame_92" | "Wall_L_long_window_93" | "Wall_M_corner_90_L_74" | "Wall_M_corner_90_R_80"
  | "Wall_L_corner_90_L_77" | "Wall_L_corner_90_R_83" | "Gate_M_126" | "Gate_L_127" | "Gate_M_door_Gate_Pivot_129"
  | "Gate_M_hatch_Gate_Pivot_128" | "Lamp_L_2" | "Lamp_S_3" | "Vent_M_Grille_95" | "Spacesuite_full_4" | "Helm_1_7"
  | "Backpack_1_5" | "Fire_Extinguisher_1" | "Fire_Extinguisher_Base_18" | "First_Aid_11" | "Microscope_12"
  | "Drill_13" | "Arm_17" | "Arm_Base_16" | "Tank_O2_46" | "Tank_N2_47" | "Tank_H2_48" | "Computer_41"
  | "Chair_Blue_37" | "Table_44" | "Hanging_Shelf_43" | "Cube_1_26" | "Cube_2_27" | "Cube_4_29" | "Cube_6_31";

let cargado: Promise<THREE.Group> | null = null;

/** Loads the kit once and repaints it; every caller clones pieces from the same scene and materials. */
export function cargarKitEstacion(): Promise<THREE.Group> {
  cargado ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(URL_KIT).then((gltf) => {
    const materiales = new Map<string, THREE.Material>();
    const material = (nombre: string): THREE.Material => {
      let m = materiales.get(nombre);
      if (!m) {
        const color = COLOR[nombre] ?? COLOR.Plastic!;
        m = nombre === "Glow" || nombre === "Blue"
          ? new THREE.MeshBasicMaterial({ name: `Station_${nombre}`, color })
          : new THREE.MeshStandardMaterial({
            name: `Station_${nombre}`, color, roughness: nombre === "Glass" ? 0.15 : 0.8, metalness: 0,
            transparent: nombre === "Glass", opacity: nombre === "Glass" ? 0.8 : 1, depthWrite: nombre !== "Glass",
          });
        materiales.set(nombre, m);
      }
      return m;
    };
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = material((o.material as THREE.Material).name);
        o.castShadow = (o.material as THREE.Material).name !== "Station_Glass";
        o.receiveShadow = true;
      }
    });
    return gltf.scene;
  });
  return cargado;
}

/**
 * A copy of `nombre` placed by its grid corner at (x, z) kit units, turned `cuartos` quarter turns. Each
 * quarter turn maps the piece's +z to +x, its +x to -z (so a wall's length follows the turn).
 */
export function pieza(kit: THREE.Group, nombre: PiezaEstacion, x: number, z: number, cuartos = 0, y = 0): THREE.Object3D {
  const original = kit.getObjectByName(nombre);
  if (!original) throw new Error(`pieza del kit desconocida: ${nombre}`);
  const holder = new THREE.Group();
  holder.add(original.clone());
  holder.position.set(x, y, z);
  holder.rotation.y = (cuartos * Math.PI) / 2;
  holder.name = nombre;
  return holder;
}
