import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { colorToken } from "../materiales";
import { lugar } from "../mundo";
import type { Materiales } from "../materiales";
import { PANELES_MESA, armarEdificios, enlacesEstaciones, type PiezaReemplazable } from "./baseExterior";

/**
 * Colony pieces loaded from local model files (`public/modelos-locales/*.glb`), which are NOT in the
 * repository: they are prepared from a pack whose licence lets a game use and ship them but not hand the
 * files out for reuse (see `assets/MODELOS-LOCALES.md`). When a file is there, its piece replaces the one
 * built in code; when it is not, the code-built base stays exactly as it was.
 *
 * The files carry no texture. Each mesh is split into named materials (Casco, Acento, Grafito, Oscuro and,
 * on the solar panel, Celdas), and the game paints them with its own: matte white shell, teal accents,
 * graphite mechanisms, dark glass, blue solar cells drawn on a canvas.
 */

const CARPETA = `${import.meta.env.BASE_URL}modelos-locales/`;

/** Solar cells: 4 x 8 blue cells with a darker lower edge each, pale frame lines and a diagonal sheen. */
function texturaCeldas(): THREE.CanvasTexture {
  const el = document.createElement("canvas");
  el.width = 128;
  el.height = 256;
  const c = el.getContext("2d");
  if (c) {
    const nx = 4, ny = 8, cw = el.width / nx, ch = el.height / ny;
    c.fillStyle = "#C3CEE4";
    c.fillRect(0, 0, el.width, el.height);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const g = c.createLinearGradient(0, j * ch, 0, (j + 1) * ch);
      g.addColorStop(0, "#3E63BC");
      g.addColorStop(1, "#1E357E");
      c.fillStyle = g;
      c.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
    }
    c.fillStyle = "rgba(255,255,255,0.16)";
    c.beginPath(); c.moveTo(0, 0); c.lineTo(el.width * 0.5, 0); c.lineTo(el.width * 0.15, el.height); c.lineTo(0, el.height); c.fill();
  }
  const t = new THREE.CanvasTexture(el);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // glTF convention
  t.anisotropy = 4;
  return t;
}

/** The game's materials for the named slots of the local models; built once per scene. */
function materialesColonia(): Record<string, THREE.Material> {
  const m = (name: string, color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ name: `Colony_${name}`, color, roughness: 0.72, metalness: 0, ...extra });
  return {
    Casco: m("Shell", "#ECE7E1"),
    Acento: m("Accent", colorToken("teal"), { roughness: 0.55 }),
    Grafito: m("Graphite", "#3B3E49", { roughness: 0.5, metalness: 0.3 }),
    Oscuro: m("DarkGlass", "#161A24", { roughness: 0.15, metalness: 0.7 }),
    Celdas: m("Cells", "#FFFFFF", { map: texturaCeldas(), roughness: 0.3, metalness: 0.3 }),
  };
}

/** Where a piece goes: position, turn about y (radians) and scale (one number, or x/y/z). */
interface Puesto { x: number; z: number; giro: number; escala: number | readonly [number, number, number] }

interface Reemplazo {
  archivo: string;
  /** The code-built piece it replaces. */
  reemplaza: PiezaReemplazable;
  puestos: () => Puesto[];
}

/**
 * Pilot set (stage 1). Scales and turns measured on the prepared files:
 * - `casa`: round main house, 13.85 m wide with its entry slab toward -x and 4.43 m tall. Turned a quarter so
 *   the slab faces the player's side (+z) and scaled to fit between the door spot and the ring path behind.
 * - `conexion`: gateway tube, 3.69 m long along x and 2.76 m across.
 * - `panel`: solar panel on a post, 1.98 m wide and 4.15 m tall, its cells facing +z.
 */
const REEMPLAZOS: readonly Reemplazo[] = [
  { archivo: "casa.glb", reemplaza: "habitat", puestos: () => [{ x: lugar("habitat").mx, z: -9.25, giro: Math.PI / 2, escala: 0.5 }] },
  { archivo: "conexion.glb", reemplaza: "enlaces", puestos: () => enlacesEstaciones().map((k) => ({ x: k.x, z: k.z, giro: k.giro + Math.PI / 2, escala: 0.8 })) },
  { archivo: "panel.glb", reemplaza: "paneles", puestos: () => PANELES_MESA.dx.map((dx) => ({ x: lugar("mesa").mx + dx, z: lugar("mesa").mz + PANELES_MESA.dz, giro: 0, escala: 0.42 })) },
];

/** Loads a local model; null when the file is not there (a dev server answers a missing file with a page). */
async function cargar(archivo: string): Promise<THREE.Object3D | null> {
  try {
    return (await new GLTFLoader().loadAsync(CARPETA + archivo)).scene;
  } catch {
    return null;
  }
}

/**
 * Replaces the code-built pieces of the base with the local models that are available: the fused
 * `Base_Buildings` is rebuilt without them and the models take their place. Returns how many were replaced.
 * Safe to call when none is: nothing changes. `vigente` lets the caller cancel after a dispose.
 *
 * Every copy of every piece is baked into one geometry per material, so the whole set costs one draw call
 * per material (five at most) however many pieces and copies there are.
 */
export async function aplicarModelosColonia(escena: THREE.Object3D, materiales: Materiales, vigente: () => boolean = () => true): Promise<number> {
  const cargados = await Promise.all(REEMPLAZOS.map(async (r) => ({ r, modelo: await cargar(r.archivo) })));
  const edificios = escena.getObjectByName("Base_Buildings");
  if (!vigente() || !edificios?.parent || cargados.every((c) => !c.modelo)) return 0;
  const mats = materialesColonia();
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const puesto = new THREE.Matrix4(), q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0), escala = new THREE.Vector3();
  const omitir = new Set<PiezaReemplazable>();
  for (const { r, modelo } of cargados) {
    if (!modelo) continue;
    modelo.updateMatrixWorld(true);
    for (const p of r.puestos()) {
      if (typeof p.escala === "number") escala.setScalar(p.escala);
      else escala.set(p.escala[0], p.escala[1], p.escala[2]);
      puesto.compose(new THREE.Vector3(p.x, 0, p.z), q.setFromAxisAngle(eje, p.giro), escala);
      modelo.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const material = mats[(o.material as THREE.Material).name] ?? mats.Casco!;
        const g = (o.geometry as THREE.BufferGeometry).clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(puesto, o.matrixWorld));
        // Only the cells are textured; the rest drop `uv` so pieces merge whatever their source.
        if (material !== mats.Celdas) g.deleteAttribute("uv");
        const lista = porMaterial.get(material) ?? [];
        lista.push(g);
        porMaterial.set(material, lista);
      });
    }
    // The loaded file's own geometry and materials are no longer needed.
    modelo.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
    });
    omitir.add(r.reemplaza);
  }
  // Materials no piece used are released now; the rest go with the scene.
  for (const m of Object.values(mats)) if (!porMaterial.has(m)) {
    if (m instanceof THREE.MeshStandardMaterial) m.map?.dispose();
    m.dispose();
  }
  const grupo = new THREE.Group();
  grupo.name = "Colony_Models";
  for (const [material, geos] of porMaterial) {
    const malla = new THREE.Mesh(mergeGeometries(geos, false), material);
    for (const g of geos) g.dispose();
    malla.name = `Colony_Models_${material.name}`;
    malla.castShadow = true;
    malla.receiveShadow = true;
    grupo.add(malla);
  }
  // The fused buildings own their geometry; their materials are the game's shared ones.
  const padre = edificios.parent;
  edificios.removeFromParent();
  edificios.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  padre.add(armarEdificios(materiales, omitir), grupo);
  return omitir.size;
}
