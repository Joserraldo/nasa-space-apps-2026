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

import { COLORES, type TokenColor } from "../estilos/tokens";

/** Alias de compatibilidad para las subidas del escenario; no mantiene una paleta duplicada. */
export { COLORES as TOKENS_TEMP } from "../estilos/tokens";
export type TokenTemp = TokenColor;

export const SLOTS = ["SuitBase", "Accent", "Boots", "Skin", "Hair", "Glass", "Emissive", "Rock", "Plant"] as const;
export type Slot = (typeof SLOTS)[number];
export type Materiales = Readonly<Record<Slot, THREE.MeshStandardMaterial>>;

/** Token de color de cada slot. `Rock` pinta con color de vértice (ver `crearMateriales`). */
export const TOKEN_SLOT: Readonly<Record<Slot, TokenTemp>> = {
  SuitBase: "traje-marfil",
  Accent: "teal",
  Boots: "indigo-botas",
  Skin: "piel-nino",
  Hair: "cabello-nino",
  Glass: "lila",
  Emissive: "cian",
  Rock: "roca-basalto",
  Plant: "icono-vida",
};

/** Color de Three desde un token (sRGB → espacio de trabajo lineal). */
export function colorToken(token: TokenTemp): THREE.Color {
  return new THREE.Color(COLORES[token]);
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
      roughness: 0.65,
      metalness: 0.04,
      flatShading: false,
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
    Skin: base("Skin", { roughness: 0.75, metalness: 0 }),
    Hair: base("Hair", { roughness: 0.9, metalness: 0, flatShading: true }),
    Glass: base("Glass", { transparent: true, opacity: 0.35, roughness: 0.15, depthWrite: false, side: THREE.FrontSide, flatShading: true }),
    // Etapa A: 1,4 (antes 1): de noche pasa el umbral del bloom (`postproceso.ts`); de día, con el Sol encima, no.
    Emissive: base("Emissive", { emissive: colorToken(TOKEN_SLOT.Emissive), emissiveIntensity: 1.4 }),
    Rock: base("Rock", { color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true, flatShading: true }),
    Plant: base("Plant", { roughness: 0.85, metalness: 0, flatShading: true }),
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
