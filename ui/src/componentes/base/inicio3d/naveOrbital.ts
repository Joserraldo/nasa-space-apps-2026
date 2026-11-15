/**
 * Nave orbital de la portada (`inicio/capas/nave.png`, DISEÑO §6): cápsula facetada lila con ventanal
 * índigo de esquinas recortadas, techo con franja cian, luces cian, puerto octogonal para el cable y dos
 * patines. Solo aparece en la portada, por eso vive en el kit de inicio y no en `escena/activos/`
 * (si Daniel o María Paula la quieren en la escena, se puede mover tal cual).
 *
 * Perfil lateral extruido con chaflán; frente hacia +z, proa (con el puerto) hacia -x. Se fusiona por
 * material: cuatro llamadas de dibujo.
 */
import * as THREE from "three";
import { fusionar } from "../../../escena/activos/fusionar.js";
import { color, mate, mezcla } from "./lienzo.js";

type P = [number, number];

/** Prisma de perfil `pts` (plano xy), de grosor `z`, con chaflán `b` y centrado en z = `z0`. */
function prisma(pts: P[], z: number, b: number, z0 = 0): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), {
    depth: z, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1,
  });
  g.translate(0, 0, z0 - z / 2);
  return g;
}

/** Rectángulo de esquinas recortadas (la firma octogonal de la familia). */
const octo = (x0: number, y0: number, x1: number, y1: number, c: number): P[] =>
  [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];

export interface NaveOrbital { grupo: THREE.Group; puerto: THREE.Object3D }

export function crearNaveOrbital(): NaveOrbital {
  const casco = mate(mezcla("lila", "montana-lejana", 0.38));
  const faldon = mate(mezcla("montana-lejana", "ciruela", 0.25));
  const vidrio = mate(mezcla("indigo-texto", "montana-lejana", 0.3));
  const luz = new THREE.MeshBasicMaterial({ color: color("cian") });
  const D = 1.1; // grosor del casco (frente en z = D/2 + chaflán)
  const F = D / 2 + 0.1;
  const malla = (g: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number] = [0, 0, 0]) => {
    const x = new THREE.Mesh(g, m);
    x.position.set(...pos);
    return x;
  };
  const caja = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

  const pieza = new THREE.Group();
  pieza.add(
    // Casco: proa redondeada abajo a la izquierda, techo inclinado y popa casi recta.
    malla(prisma([[-1.05, -0.3], [-0.95, 0.12], [-0.5, 0.58], [0.15, 0.8], [0.9, 0.78], [1.12, 0.45], [1.12, -0.3], [0.85, -0.42], [-0.7, -0.42]], D, 0.1), casco),
    // Faldón inferior más oscuro, un poco más ancho que el casco.
    malla(prisma([[-0.85, -0.25], [1.15, -0.25], [1.1, -0.62], [-0.55, -0.66]], D + 0.12, 0.06), faldon),
    // Techo elevado con su franja cian.
    malla(prisma([[-0.25, 0.7], [0.75, 0.86], [0.8, 0.98], [-0.15, 0.86]], D * 0.7, 0.04), faldon),
    malla(caja(0.8, 0.06, 0.06), luz, [0.28, 0.93, D * 0.35 + 0.03]),
    // Ventanal: marco claro y vidrio índigo, en el flanco que mira a la cámara.
    malla(prisma(octo(-0.12, -0.12, 0.98, 0.66, 0.16), 0.05, 0.02, F), casco),
    malla(prisma(octo(-0.02, -0.04, 0.88, 0.58, 0.13), 0.04, 0, F + 0.05), vidrio),
    // Luces cian: placa en la proa, franja del faldón y las de los patines.
    malla(caja(0.32, 0.12, 0.05), luz, [-0.72, 0.38, F - 0.04]),
    malla(caja(0.42, 0.11, 0.04), luz, [0.25, -0.44, F + 0.06]),
    // Rejilla de la popa.
    malla(caja(0.22, 0.035, 0.03), faldon, [0.85, -0.12, F + 0.02]),
    malla(caja(0.22, 0.035, 0.03), faldon, [0.85, -0.2, F + 0.02]),
  );
  for (const x of [-0.55, 0.75]) {
    pieza.add(malla(prisma([[-0.22, 0], [0.22, 0], [0.16, 0.14], [-0.16, 0.14]], D * 0.6, 0.03), faldon, [x, -0.82, 0]));
    pieza.add(malla(caja(0.2, 0.05, 0.03), luz, [x, -0.75, D * 0.3 + 0.05]));
  }

  // Puerto octogonal del cable, en la proa.
  const puerto = new THREE.Group();
  puerto.add(malla(new THREE.TorusGeometry(0.15, 0.05, 3, 8), mate(mezcla("cian", "teal", 0.2))), malla(new THREE.CircleGeometry(0.12, 8), faldon));
  puerto.position.set(-0.72, 0.02, F + 0.02);
  puerto.rotation.z = Math.PI / 8;

  const grupo = new THREE.Group();
  grupo.add(fusionar(pieza, "Portada_NaveOrbital"), puerto);
  return { grupo, puerto };
}
