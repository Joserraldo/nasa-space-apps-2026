/**
 * Caché de geometrías base y materiales por slot (APLICACION.md §2–§3, DISEÑO.md §3.1–§3.2).
 *
 * - Geometrías base inmutables: se piden por clave con `geometriaBase(clave, fabrica)` y se
 *   comparten entre todas las copias. Llevan `userData.compartido = true` para que
 *   `liberarEscena` no las borre al quitar una copia (se liberan con `liberarCache()`).
 * - Materiales: uno por slot, mates (`MeshStandardMaterial`), con `flatShading: true` para las
 *   facetas planas. También llevan `userData.compartido = true`. Cambiar el rol de un personaje
 *   clona solo `Accent` de esa instancia; nunca se toca el material compartido.
 */
import * as THREE from "three";

// ---------------------------------------------------------------------------------------------
// TOKENS_TEMP — REEMPLAZAR POR IMPORT DE `ui/src/estilos/tokens.ts` CUANDO ENTRE (lo fusiona Jaime).
// Mismos nombres y hex que DISEÑO.md §2. No añadir hex sueltos fuera de este bloque.
// `piel-base` y `cabello-base` NO existen en DISEÑO §2 todavía: son provisionales, a aprobar
// por María Paula (cada personaje los sobrescribe con su identidad, DISEÑO §4.2).
// ---------------------------------------------------------------------------------------------
export const TOKENS_TEMP = {
  marfil: "#F3EEE5",
  lila: "#EEE5F1",
  ciruela: "#53306D",
  cian: "#73D4E1",
  "icono-vida": "#47BE5B",
  "traje-marfil": "#FCE6D6",
  teal: "#47AAB5",
  "indigo-botas": "#675B95",
  "regolito-claro": "#FA8D6F",
  "regolito-medio": "#B76A78",
  "roca-basalto": "#813E55",
  "sombra-suelo": "#F8B9B2",
  "piel-base": "#C68E6A",
  "cabello-base": "#4A3328",
} as const;
export type TokenTemp = keyof typeof TOKENS_TEMP;
// ------------------------------------- fin de TOKENS_TEMP -------------------------------------

export const SLOTS = ["SuitBase", "Accent", "Boots", "Skin", "Hair", "Glass", "Emissive", "Rock", "Plant"] as const;
export type Slot = (typeof SLOTS)[number];
export type Materiales = Readonly<Record<Slot, THREE.MeshStandardMaterial>>;

/** Token de color de cada slot. `Rock` pinta con color de vértice (ver `crearMateriales`). */
export const TOKEN_SLOT: Readonly<Record<Slot, TokenTemp>> = {
  SuitBase: "traje-marfil",
  Accent: "teal",
  Boots: "indigo-botas",
  Skin: "piel-base",
  Hair: "cabello-base",
  Glass: "lila",
  Emissive: "cian",
  Rock: "roca-basalto",
  Plant: "icono-vida",
};

/** Color de Three desde un token (sRGB → espacio de trabajo lineal). */
export function colorToken(token: TokenTemp): THREE.Color {
  return new THREE.Color(TOKENS_TEMP[token]);
}

/**
 * Crea los 9 materiales compartidos. Todos mates y con facetas planas.
 * - `Glass`: transparente simple de una cara, sin `transmission` (APLICACION §8.1), nunca opaco.
 * - `Emissive`: solo pantallas, luces de estado y balizas.
 * - `Rock`: color base blanco y `vertexColors: true`; el tono (`roca-basalto`, `regolito-medio`,
 *   `regolito-claro`) va en el atributo `color` de cada geometría, así terreno y rocas comparten
 *   material y la cara superior de la roca sale más clara. Toda geometría con `Rock` lleva `color`.
 */
export function crearMateriales(): Materiales {
  const base = (slot: Slot, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color: colorToken(TOKEN_SLOT[slot]),
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
      ...extra,
    });
    m.name = slot;
    m.userData.compartido = true;
    return m;
  };
  return {
    SuitBase: base("SuitBase"),
    Accent: base("Accent"),
    Boots: base("Boots"),
    Skin: base("Skin", { roughness: 0.8 }),
    Hair: base("Hair"),
    Glass: base("Glass", { transparent: true, opacity: 0.35, roughness: 0.15, depthWrite: false, side: THREE.FrontSide }),
    Emissive: base("Emissive", { emissive: colorToken(TOKEN_SLOT.Emissive), emissiveIntensity: 1 }),
    Rock: base("Rock", { color: 0xffffff, vertexColors: true }),
    Plant: base("Plant"),
  };
}

const cache = new Map<string, THREE.BufferGeometry>();

/** Devuelve la geometría compartida de `clave`, creándola una sola vez con `fabrica`. */
export function geometriaBase(clave: string, fabrica: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(clave);
  if (!g) {
    g = fabrica();
    g.name = clave;
    g.userData.compartido = true;
    cache.set(clave, g);
  }
  return g;
}

/** Solo lectura: la caché (para `liberarCache` y los tests). */
export function cacheGeometrias(): ReadonlyMap<string, THREE.BufferGeometry> {
  return cache;
}

/** Vacía la caché sin liberar (uso interno de `liberarCache`). */
export function vaciarCache(): void {
  cache.clear();
}
