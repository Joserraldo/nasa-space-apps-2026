/**
 * Modelos reales de la Etapa D del exterior (módulos de Jezero, `missions/src/jezero.ts`): antena y panel solar.
 * El hábitat sigue procedural: el Habitat Demonstration Unit de NASA no se leía como refugio desde la cámara de
 * inicio (dos intentos, ver `traspaso-D.md`). Llegan como GLB desde `public/modelos/` después del primer cuadro, igual que el DEM; mientras tanto (y en
 * las pruebas de Node, sin red) se ven las formas procedurales de `modulos.ts` y `edificios.ts`.
 *
 * Fuentes y licencias (`public/modelos/FUENTES.md`): antena = Tall Dish, de NASA 3D Resources (con crédito y sin
 * insignia); panel = `Solar_panel` de Craftpix Space Colony.
 * La escena no cobra ni decide nada (`frontera.ts`): el polvo del panel solo se pinta según `VistaEscena`.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { colorToken } from "../materiales";

/** Archivos de `public/modelos/` (los arma `construir_modelos.py`: base en y = 0, frente hacia +z, en metros). */
export const ARCHIVOS_MODELOS = {
  antena: "antena-tall-dish.glb",
  panel: "panel-solar.glb",
  /** Kit Craftpix Space Colony, una malla por pieza (Etapa D2, `colonia.ts`). */
  kit: "kit-colonia.glb",
} as const;
export type ModeloExterno = keyof typeof ARCHIVOS_MODELOS;

/** Mallas de cada modelo cargado, listas para clonar (sin colocar). */
export type ModelosModulos = Readonly<Record<ModeloExterno, THREE.Group>>;

/**
 * Paneles del módulo `panel_solar`: tres en fila sobre la huella de 6,8 × 2,4 m de `FORMA_MODULO`. Referencia
 * (regla 11): paneles inclinados con soporte, separados para caminar entre ellos al limpiarlos. [E]
 */
export const PANELES = { n: 3, paso: 1.9 } as const;

/**
 * Mástil de relevo de la antena (restricción del 17 nov: plato hacia la Tierra sobre pedestal robusto más mástil
 * alto hacia los orbitadores; comunicaciones #2: mástil con luz roja en la punta). Medidas en metros. [E]
 */
export const MASTIL_RELEVO = { x: 1.0, z: -0.75, alto: 5.6 } as const;

// ---------------------------------------------------------------------------------------------
// Polvo del panel
// ---------------------------------------------------------------------------------------------

/** Aspecto de las celdas limpias y cubiertas de polvo (más rojizo y sin reflejo, como los paneles de InSight). */
const AZUL_CELDA = new THREE.Color(0.03, 0.05, 0.12);
const CELDAS = {
  // Vidrio dieléctrico: refleja el cielo en ángulo rasante sin volverse espejo blanco.
  limpio: { color: AZUL_CELDA, rugosidad: 0.42, metal: 0 },
  // Capa de regolito (tono del suelo cercano de la Etapa BC) con un resto del azul debajo.
  polvo: { color: AZUL_CELDA.clone().lerp(new THREE.Color("#8f604a"), 0.82), rugosidad: 0.97, metal: 0 },
} as const;

/** Cambia el material de las celdas entre limpio y con polvo (mismo material: no se crea ni libera nada). */
export function pintarPolvo(celdas: THREE.MeshStandardMaterial, conPolvo: boolean): void {
  const a = conPolvo ? CELDAS.polvo : CELDAS.limpio;
  celdas.color.copy(a.color);
  celdas.roughness = a.rugosidad;
  celdas.metalness = a.metal;
}

// ---------------------------------------------------------------------------------------------
// Preparación de cada modelo (sin red: las pruebas la llaman con mallas armadas a mano)
// ---------------------------------------------------------------------------------------------

/** Desgaste común: todo lo que vive afuera tiene polvo encima (restricción del 17 nov: polvo y desgaste). */
const TINTE_POLVO = new THREE.Color(0.95, 0.86, 0.78);

/**
 * Sombras, guarda de transmisión y desgaste. `Object3D.clone()` comparte los materiales con el GLB cargado: se
 * clonan aquí (uno por material original, así las mallas que lo compartían lo siguen compartiendo) para que el
 * tinte no se acumule si la pieza se arma más de una vez.
 */
export function prepararMallas(raiz: THREE.Object3D, tinte = true): void {
  const clones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const original = o.material as THREE.MeshStandardMaterial;
    let m = clones.get(original);
    if (!m) clones.set(original, (m = original.clone()));
    o.material = m;
    // Guarda: un material con transmisión obliga a three a redibujar toda la escena en un pase extra.
    if (m instanceof THREE.MeshPhysicalMaterial) m.transmission = 0;
    if (tinte && m.name !== "Panel_Cells") {
      m.color.multiply(TINTE_POLVO);
      m.roughness = Math.max(m.roughness, 0.8);
    }
  });
}

/** Material de las celdas del panel (`Panel_Cells`, nombre fijado en `construir_modelos.py`). */
export function materialCeldas(raiz: THREE.Object3D): THREE.MeshStandardMaterial | null {
  let celdas: THREE.MeshStandardMaterial | null = null;
  raiz.traverse((o) => {
    if (o instanceof THREE.Mesh && (o.material as THREE.Material).name === "Panel_Cells") celdas = o.material as THREE.MeshStandardMaterial;
  });
  return celdas;
}

/** Antena: zapata de regolito, Tall Dish y mástil de relevo con luz roja. */
export function armarAntenaReal(modelos: ModelosModulos): THREE.Group {
  const g = new THREE.Group();
  g.name = "Antenna_TallDish";
  const plato = modelos.antena.clone();
  plato.position.y = 0.3;
  const metal = new THREE.MeshStandardMaterial({ name: "Antenna_Metal", color: 0x8e8a84, roughness: 0.7, metalness: 0.4 });
  const zapata = new THREE.MeshStandardMaterial({ name: "Antenna_Footing", color: colorToken("regolito-medio").lerp(new THREE.Color(0x6b5a50), 0.6), roughness: 1 });
  const rojo = new THREE.MeshStandardMaterial({ name: "Antenna_Beacon", color: 0x3a0606, emissive: 0xff2a1a, emissiveIntensity: 2.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.3, 8), zapata);
  base.position.y = 0.17;
  const { x, z, alto } = MASTIL_RELEVO;
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, alto, 6), metal);
  mastil.position.set(x, alto / 2, z);
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 6), zapata);
  pie.position.set(x, 0.12, z);
  const luz = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), rojo);
  luz.position.set(x, alto + 0.08, z);
  luz.name = "Antenna_RedLight";
  // Dos travesaños con antenas de látigo a media altura: lectura de "relevo", no solo un poste.
  const travesano = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), metal);
  travesano.position.set(x, alto * 0.78, z);
  prepararMallas(plato);
  g.add(plato, base, mastil, pie, luz, travesano);
  for (const x of [base, mastil, pie, luz, travesano]) x.castShadow = x.receiveShadow = true;
  luz.castShadow = false;
  return g;
}

/** Controlador del panel, al costado de la fila (punto de uso del panel en `mundo.ts`). */
export const CONTROLADOR_PANEL = { x: -3.6, z: 0.55, alto: 0.95 } as const;

/** Panel solar: `PANELES.n` paneles en fila; devuelve el grupo y el material de sus celdas (compartido). */
export function armarPanelReal(modelos: ModelosModulos): { grupo: THREE.Group; celdas: THREE.MeshStandardMaterial | null } {
  const g = new THREE.Group();
  g.name = "Solar_Craftpix";
  const molde = modelos.panel.clone();
  prepararMallas(molde);
  const celdas = materialCeldas(molde);
  for (let i = 0; i < PANELES.n; i++) {
    const p = i === 0 ? molde : molde.clone();
    p.position.x = (i - (PANELES.n - 1) / 2) * PANELES.paso;
    g.add(p);
  }
  const caja = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, CONTROLADOR_PANEL.alto, 0.36),
    new THREE.MeshStandardMaterial({ name: "Panel_Controller", color: new THREE.Color(0.62, 0.6, 0.56).multiply(TINTE_POLVO), roughness: 0.85 }),
  );
  caja.position.set(CONTROLADOR_PANEL.x, CONTROLADOR_PANEL.alto / 2, CONTROLADOR_PANEL.z);
  caja.castShadow = caja.receiveShadow = true;
  g.add(caja);
  return { grupo: g, celdas };
}

// ---------------------------------------------------------------------------------------------
// Carga (navegador)
// ---------------------------------------------------------------------------------------------

/** Carga los tres GLB. Los materiales del GLB quedan en el árbol: los libera `liberarEscena` con la escena. */
export async function cargarModelosModulos(base: string = import.meta.env.BASE_URL): Promise<ModelosModulos> {
  const cargador = new GLTFLoader();
  const pares = await Promise.all(
    (Object.keys(ARCHIVOS_MODELOS) as ModeloExterno[]).map(async (k) => {
      const gltf = await cargador.loadAsync(`${base}modelos/${ARCHIVOS_MODELOS[k]}`);
      return [k, gltf.scene] as const;
    }),
  );
  return Object.fromEntries(pares) as unknown as ModelosModulos;
}
