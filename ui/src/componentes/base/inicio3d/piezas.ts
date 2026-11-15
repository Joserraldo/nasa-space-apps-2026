/**
 * Piezas propias de las ilustraciones de inicio (capas de `inicio/capas/`): planeta con anillo,
 * asteroide con cráteres octogonales de borde teal, tubos (cable y órbita) y la sombra del suelo.
 * Low poly facetado, colores solo de tokens. Una o dos llamadas de dibujo por pieza.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { aMundo, color, mate, mezcla } from "./lienzo.js";

/** Planeta violeta facetado con anillo inclinado (`capas/planeta.png`). Dos llamadas. */
export function crearPlaneta(): THREE.Group {
  const g = new THREE.Group();
  const esfera = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mate(mezcla("montana-lejana", "ciruela-traje", 0.15)));
  esfera.rotation.set(0.4, 0.3, 0);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.16, 3, 28), mate(mezcla("montana-lejana", "lila", 0.3), { emissive: mezcla("montana-lejana", "espacio", 0.3).multiplyScalar(0.5) }));
  anillo.scale.set(1, 1, 0.5);
  anillo.rotation.set(1.28, 0, 0.32);
  g.add(esfera, anillo);
  return g;
}

/** Ruido determinista por posición: el mismo vértice repetido en caras vecinas se mueve igual. */
const ruido = (v: THREE.Vector3, semilla: number) => Math.sin(v.x * 5.3 + semilla) * Math.cos(v.y * 4.1 - semilla) * Math.sin(v.z * 3.7 + semilla * 2);

function pintar(g: THREE.BufferGeometry, c: (n: THREE.Vector3) => THREE.Color): THREE.BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g;
  geo.computeVertexNormals();
  const n = geo.getAttribute("normal");
  const col = new Float32Array(n.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n.count; i += 3) {
    const k = c(v.fromBufferAttribute(n, i));
    for (let j = 0; j < 3; j++) col.set([k.r, k.g, k.b], (i + j) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  for (const a of Object.keys(geo.attributes)) if (a !== "position" && a !== "normal" && a !== "color") geo.deleteAttribute(a);
  return geo;
}

/**
 * Asteroide índigo con el borde que mira a la derecha en teal y cráteres de aro octogonal
 * (`capas/asteroide.png`). Una sola malla con color de vértice: una llamada.
 */
export function crearAsteroide(semilla = 1, crateres = 2): THREE.Mesh {
  const roca = new THREE.IcosahedronGeometry(1, 1);
  const p = roca.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.16 * ruido(v, semilla));
    p.setXYZ(i, v.x, v.y * 0.9, v.z);
  }
  const base = mezcla("indigo-texto", "montana-lejana", 0.4);
  const borde = mezcla("teal", "cian", 0.3);
  const partes = [pintar(roca, (n) => base.clone().lerp(borde, THREE.MathUtils.clamp((n.x - 0.25) * 1.6, 0, 0.85)))];
  const dirs = [new THREE.Vector3(0.45, 0.55, 0.7), new THREE.Vector3(-0.2, -0.45, 0.85), new THREE.Vector3(-0.7, 0.3, 0.6)];
  for (const d of dirs.slice(0, crateres)) {
    d.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    // Sobre la superficie ya deformada (el mismo ruido de la roca), para que el aro no quede enterrado.
    const r = 1 + 0.16 * ruido(d, semilla);
    const aro = new THREE.TorusGeometry(0.2, 0.06, 4, 8);
    const fondo = new THREE.CircleGeometry(0.18, 8);
    for (const [geo, c, z] of [[aro, borde, r], [fondo, color("espacio"), r - 0.04]] as const) {
      geo.applyQuaternion(q);
      geo.translate(d.x * z, d.y * z * 0.9, d.z * z);
      partes.push(pintar(geo, () => c));
    }
  }
  const geo = mergeGeometries(partes, false);
  for (const x of partes) x.dispose();
  return new THREE.Mesh(geo, mate(new THREE.Color(1, 1, 1), { vertexColors: true }));
}

/** Tubo fino por puntos en px del lienzo (y hacia abajo): cable de la portada u órbita de la carga. */
export function tubo(malla: THREE.Mesh, puntos: [number, number][], z: number, radio: number, cerrado = false): void {
  const curva = new THREE.CatmullRomCurve3(puntos.map(([x, y]) => aMundo(x, y, z)), cerrado, "centripetal");
  malla.geometry.dispose();
  malla.geometry = new THREE.TubeGeometry(curva, cerrado ? 96 : 72, radio, 6, cerrado);
}

/** Sombra suave del suelo, teñida de ciruela (nunca negra): un disco de cara a la cámara, para aplastar. */
export function crearSombra(): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: color("ciruela"), transparent: true, opacity: 0.22, depthWrite: false }));
  return m;
}
