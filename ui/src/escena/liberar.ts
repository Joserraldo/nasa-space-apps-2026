/**
 * Liberación de recursos de Three con dueño explícito (APLICACION.md §2 y §8.1).
 *
 * - `Object3D` no libera a sus hijos: aquí se recorre el árbol entero.
 * - `material.dispose()` no libera sus texturas: cada textura se libera aparte.
 * - Cada recurso se libera una sola vez, aunque lo compartan varias mallas o se llame dos veces
 *   (doble montaje de `StrictMode`).
 * - Lo marcado `userData.compartido` (geometrías de la caché y materiales de `crearMateriales`)
 *   NO se libera salvo `{ compartidos: true }`: quitar una copia no rompe las demás.
 */
import * as THREE from "three";
import { cacheGeometrias, vaciarCache } from "./materiales";

export interface OpcionesLiberar {
  /** true: libera también geometrías y materiales compartidos. */
  compartidos?: boolean;
}

export interface Liberados {
  geometrias: number;
  materiales: number;
  texturas: number;
}

const yaLiberados = new WeakSet<object>();

function esCompartido(r: { userData: Record<string, unknown> }): boolean {
  return r.userData.compartido === true;
}

function texturasDe(material: THREE.Material, salida: Set<THREE.Texture>): void {
  for (const valor of Object.values(material)) {
    if (valor instanceof THREE.Texture) salida.add(valor);
  }
}

/** Recorre `objeto` y libera geometrías, materiales y texturas una sola vez cada uno. */
export function liberarEscena(objeto: THREE.Object3D, opciones: OpcionesLiberar = {}): Liberados {
  const geometrias = new Set<THREE.BufferGeometry>();
  const materiales = new Set<THREE.Material>();
  const texturas = new Set<THREE.Texture>();
  const instancias = new Set<THREE.InstancedMesh>();
  const incluir = (r: { userData: Record<string, unknown> }) => opciones.compartidos === true || !esCompartido(r);

  objeto.traverse((o) => {
    const conRecursos = o as Partial<THREE.Mesh>;
    if (conRecursos.geometry instanceof THREE.BufferGeometry && incluir(conRecursos.geometry)) {
      geometrias.add(conRecursos.geometry);
    }
    const mat = conRecursos.material;
    for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      if (m instanceof THREE.Material && incluir(m)) {
        materiales.add(m);
        texturasDe(m, texturas);
      }
    }
    if (o instanceof THREE.InstancedMesh) instancias.add(o);
    if (o instanceof THREE.Scene) {
      if (o.background instanceof THREE.Texture) texturas.add(o.background);
      if (o.environment instanceof THREE.Texture) texturas.add(o.environment);
    }
  });

  const cuenta: Liberados = { geometrias: 0, materiales: 0, texturas: 0 };
  const liberar = <T extends { dispose(): void }>(r: T, clave: keyof Liberados) => {
    if (yaLiberados.has(r)) return;
    yaLiberados.add(r);
    r.dispose();
    cuenta[clave]++;
  };
  for (const t of texturas) liberar(t, "texturas");
  for (const m of materiales) liberar(m, "materiales");
  for (const g of geometrias) liberar(g, "geometrias");
  for (const i of instancias) {
    if (!yaLiberados.has(i)) {
      yaLiberados.add(i);
      i.dispose();
    }
  }
  return cuenta;
}

/** Libera todas las geometrías de la caché y la vacía. */
export function liberarCache(): number {
  let n = 0;
  for (const g of cacheGeometrias().values()) {
    if (!yaLiberados.has(g)) {
      yaLiberados.add(g);
      g.dispose();
      n++;
    }
  }
  vaciarCache();
  return n;
}

/** Libera materiales compartidos incluso si no llegaron a montarse en la escena. */
export function liberarMateriales(materiales: Iterable<THREE.Material>): number {
  let n = 0;
  for (const m of materiales) {
    if (yaLiberados.has(m)) continue;
    yaLiberados.add(m);
    m.dispose();
    n++;
  }
  return n;
}
