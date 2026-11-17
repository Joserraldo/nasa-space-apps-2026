import * as THREE from "three";

/**
 * Who casts a shadow outdoors. Every caster costs one more draw call in the shadow pass; with every module
 * built the scene reached 79 of the 80-call budget. Small pieces whose shadow does not read from the game
 * camera stop casting (they still receive): scaffolds, beacons, foreground pebbles, the low mounds and the
 * small trims of the modules. Buildings, module bodies, crew and rocks keep casting.
 */
const SIN_SOMBRA = /^(Scaffold|Kit_Beacon|Rocks_Basalt_Foreground|Mounds)/;
/** Module parts below this many triangles are trims (doors, bands, small boxes). */
const TRIM_MODULO = 100;

const triangulos = (m: THREE.Mesh) => {
  const g = m.geometry as THREE.BufferGeometry;
  return (g.index ? g.index.count : g.attributes.position?.count ?? 0) / 3;
};

/** Turns shadow casting off on the small pieces of `raiz`. Returns how many stopped casting. */
export function limitarSombras(raiz: THREE.Object3D): number {
  let apagadas = 0;
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.castShadow) return;
    if (SIN_SOMBRA.test(o.name) || (o.name.startsWith("Module_") && triangulos(o) < TRIM_MODULO)) {
      o.castShadow = false;
      apagadas++;
    }
  });
  return apagadas;
}
