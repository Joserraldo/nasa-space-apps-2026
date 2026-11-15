import * as THREE from "three";

const usuarios = new WeakMap<THREE.Material, number>();

/** Materiales compartidos por las fábricas: solo la última instancia libera el recurso GPU. */
export function retenerMateriales(raiz: THREE.Object3D): () => void {
  const materiales = new Set<THREE.Material>();
  raiz.traverse(o => {
    if (o instanceof THREE.Mesh) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materiales.add(m);
    }
  });
  for (const m of materiales) usuarios.set(m, (usuarios.get(m) ?? 0) + 1);
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    for (const m of materiales) {
      const n = usuarios.get(m)! - 1;
      if (n) usuarios.set(m, n);
      else { usuarios.delete(m); m.dispose(); }
    }
  };
}
