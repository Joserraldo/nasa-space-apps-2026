import * as THREE from "three";
import type { TokenColor } from "../../../estilos/tokens";
import { colorToken, type Materiales } from "../../../escena/materiales";
import { PALETA_CIELO } from "../../../escena/cielo";
import { aleatorio } from "../../../escena/activos/terrenoDatos";
import { instanciarRocas } from "../../../escena/activos/terrenoVisual";
import { caja, chaflan, grupo, parte } from "../../../escena/activos/piezasComunes";

/**
 * Piezas de la cabina de la nave para las viñetas de inicio/02: pared lila con ventana chaflanada
 * (firma de la familia, DISEÑO §3.1), pantallas cian en las paredes y lo que se ve afuera (Marte
 * facetado con rocas, cielo y un planeta). Colores solo de tokens; el cielo de día es el de MARTE §4.
 */

/** Material mate de facetas planas (DISEÑO §3.4) de un token. Propio de la viñeta: se libera al desmontar. */
export const mate = (token: TokenColor) => new THREE.MeshLambertMaterial({ color: colorToken(token), flatShading: true });

/** Contorno octogonal: rectángulo de centro (x, y) con esquinas cortadas a 45° de tamaño `c`. */
function octogono(x: number, y: number, w: number, h: number, c: number): THREE.Vector2[] {
  const [a, b, d, e] = [x - w / 2, x + w / 2, y - h / 2, y + h / 2];
  return [[a + c, d], [b - c, d], [b, d + c], [b, e - c], [b - c, e], [a + c, e], [a, e - c], [a, d + c]].map(([p, q]) => new THREE.Vector2(p, q));
}

export interface Hueco { x: number; y: number; w: number; h: number; c: number }

/** Pared plana de `ancho` x `alto` (base en y = 0, centrada en x) con ventanas chaflanadas y su marco marfil. */
export function pared(ancho: number, alto: number, huecos: readonly Hueco[], token: TokenColor = "lila"): THREE.Group {
  const forma = new THREE.Shape(octogono(0, alto / 2, ancho, alto, 0.01));
  forma.holes = huecos.map((v) => new THREE.Path(octogono(v.x, v.y, v.w, v.h, v.c)));
  const muro = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.2, bevelEnabled: false }), mate(token));
  const marcos = huecos.map((v) => {
    const anillo = new THREE.Shape(octogono(v.x, v.y, v.w + 0.24, v.h + 0.24, v.c + 0.1));
    anillo.holes = [new THREE.Path(octogono(v.x, v.y, v.w, v.h, v.c))];
    const marco = new THREE.Mesh(new THREE.ExtrudeGeometry(anillo, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), mate("traje-marfil"));
    marco.position.z = 0.2;
    return marco;
  });
  return grupo("Cabin_Wall", muro, ...marcos);
}

/** Columna de pantallas cian en una pared (las de los lados de inicio/02), sin texto ni cifras. */
export function pantallas(m: Materiales, n: number, x: number, y: number, giro: number): THREE.Group {
  const g = new THREE.Group();
  g.name = "Cabin_Screens";
  for (let i = 0; i < n; i++) {
    g.add(parte(m, "SuitBase", chaflan(0.62, 0.42, 0.06, 0.08), [0, -i * 0.55, 0], "Screen_Frame"));
    g.add(parte(m, "Emissive", chaflan(0.5, 0.3, 0.02, 0.06), [0, -i * 0.55, 0.04], "Screen_Glow"));
  }
  g.position.set(x, y, 0);
  g.rotation.y = giro;
  return g;
}

/** Fondo de cielo: plano vertical lejano con degradado de `arriba` a `abajo` (color de vértice). */
function cielo(arriba: THREE.Color, abajo: THREE.Color, z: number): THREE.Mesh {
  const g = new THREE.PlaneGeometry(400, 160, 1, 8);
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = abajo.clone().lerp(arriba, THREE.MathUtils.clamp((pos.getY(i) + 10) / 70, 0, 1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const malla = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true }));
  malla.position.set(0, 40, z);
  return malla;
}

export interface OpcionesExterior {
  /** "espacio": órbita (índigo con estrellas); "dia" y "atardecer": cielo de MARTE §4. */
  cielo: "espacio" | "dia" | "atardecer";
  /** Altura del suelo marciano visto por la ventana. */
  suelo: number;
  planeta?: [number, number, number];
  rocas?: number;
  semilla?: number;
  /** Marte visto desde la órbita: una esfera facetada (centro y radio) con el horizonte curvo, en lugar del suelo plano. */
  globo?: { centro: [number, number, number]; radio: number };
}

/** Altura media del suelo de `exteriorMarte` en la profundidad `z` (sube hacia el fondo, sin el ruido). */
export const alturaExterior = (suelo: number, z: number) => suelo + ((-3 - z) / 50) ** 2 * 9;

/** Lo que se ve por la ventana: suelo facetado de regolito con rocas, lomas lila al fondo, cielo y planeta. */
export function exteriorMarte(m: Materiales, o: OpcionesExterior): THREE.Group {
  const azar = aleatorio(o.semilla ?? 11);
  const g = new THREE.Group();
  g.name = "Window_Mars";
  if (o.globo) {
    g.add(globoMarte(m, o.globo, azar));
  } else {
    g.add(sueloMarte(m, o, azar));
    // Lomas lejanas en `montana-lejana`.
    for (let i = 0; i < 7; i++) {
      const loma = new THREE.Mesh(new THREE.ConeGeometry(6 + azar() * 8, 3 + azar() * 4, 5), mate("montana-lejana"));
      loma.position.set(-45 + i * 15 + azar() * 6, o.suelo + 1.2, -48 - azar() * 6);
      g.add(loma);
    }
  }
  if (o.cielo === "espacio") {
    g.add(cielo(colorToken("espacio"), colorToken("ciruela"), -60));
    const estrellas = new THREE.BufferGeometry();
    estrellas.setAttribute("position", new THREE.Float32BufferAttribute(Array.from({ length: 240 }, (_, i) => (i % 3 === 0 ? (azar() - 0.5) * 120 : i % 3 === 1 ? o.suelo + 8 + azar() * 50 : -58)), 3));
    g.add(new THREE.Points(estrellas, new THREE.PointsMaterial({ color: colorToken("marfil"), size: 2, sizeAttenuation: false })));
  } else {
    const p = PALETA_CIELO[o.cielo];
    g.add(cielo(new THREE.Color(p.cenit), new THREE.Color(p.horizonte), -60));
  }
  if (o.planeta) {
    const esfera = new THREE.IcosahedronGeometry(1.6, 1);
    const cp = esfera.getAttribute("position");
    const cc = new Float32Array(cp.count * 3);
    const [mar, tierra] = [colorToken("indigo-botas"), colorToken("cian")];
    for (let i = 0; i < cp.count; i++) {
      const c = mar.clone().lerp(tierra, (Math.sin(cp.getX(i) * 1.7) * Math.cos(cp.getY(i) * 2.1) + 1) * 0.35);
      cc.set([c.r, c.g, c.b], i * 3);
    }
    esfera.setAttribute("color", new THREE.BufferAttribute(cc, 3));
    const planeta = new THREE.Mesh(esfera, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    planeta.position.set(...o.planeta);
    g.add(planeta);
  }
  return g;
}

/** Asiento de la cabina: base, cojín y respaldo chaflanados en `indigo-botas` y marfil. */
export function asiento(m: Materiales): THREE.Group {
  return grupo(
    "Cabin_Seat",
    parte(m, "SuitBase", caja(0.6, 0.4, 0.5), [0, 0.2, 0], "Seat_Base"),
    parte(m, "Boots", chaflan(0.62, 0.12, 0.55, 0.04), [0, 0.46, 0], "Seat_Cushion"),
    parte(m, "Boots", chaflan(0.64, 0.95, 0.14, 0.14), [0, 0.95, -0.27], "Seat_Back"),
  );
}

/** Suelo marciano cercano: rejilla facetada que sube hacia el fondo, con las rocas basálticas del juego. */
function sueloMarte(m: Materiales, o: OpcionesExterior, azar: () => number): THREE.Group {
  const suelo = new THREE.PlaneGeometry(120, 50, 48, 20);
  suelo.rotateX(-Math.PI / 2);
  const pos = suelo.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const [claro, medio] = [colorToken("regolito-claro"), colorToken("regolito-medio")];
  for (let i = 0; i < pos.count; i++) {
    const fondo = THREE.MathUtils.clamp((25 - pos.getZ(i)) / 50, 0, 1);
    const x = pos.getX(i);
    pos.setY(i, fondo * fondo * 9 + azar() * (0.4 + fondo * 1.8) + Math.sin(x * 0.21) * fondo * 1.4);
    const c = claro.clone().lerp(medio, azar() * 0.45 + fondo * 0.25);
    col.set([c.r, c.g, c.b], i * 3);
  }
  suelo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  suelo.computeVertexNormals();
  const terreno = new THREE.Mesh(suelo, m.Rock);
  terreno.position.set(0, o.suelo, -28);
  // Rocas basálticas del juego (misma roca maestra), más grandes cerca.
  const rocas = Array.from({ length: o.rocas ?? 40 }, () => {
    const z = -6 - azar() * 24;
    const x = (azar() - 0.5) * 34;
    const e = (0.9 + azar() * 1.4) * (1 - (z + 6) / 40);
    return { posicion: [x, alturaExterior(o.suelo, z) + 0.9, z] as [number, number, number], escala: [e, e * 0.7, e] as [number, number, number], rotacion: [0, azar() * 6, 0] as [number, number, number] };
  });
  return grupo("Mars_Ground", terreno, instanciarRocas(m, rocas, "Window_Rocks"));
}

/** Marte desde la órbita: esfera facetada de regolito (horizonte curvo) con rocas del juego sobre la cara visible. */
function globoMarte(m: Materiales, gl: NonNullable<OpcionesExterior["globo"]>, azar: () => number): THREE.Group {
  const geo = new THREE.IcosahedronGeometry(gl.radio, 12);
  const pos = geo.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const [claro, medio] = [colorToken("regolito-claro"), colorToken("regolito-medio")];
  // Un color por cara (tres vértices seguidos en la geometría no indexada), como las facetas de la lámina.
  for (let i = 0; i < pos.count; i += 3) {
    const c = claro.clone().lerp(medio, azar() * 0.5);
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const esfera = new THREE.Mesh(geo, m.Rock);
  const rocas = Array.from({ length: 70 }, () => {
    // Direcciones cerca del polo que mira a la cámara (+y, un poco hacia +z).
    const n = new THREE.Vector3((azar() - 0.5) * 0.7, 1, 0.15 + azar() * 0.45).normalize();
    const e = 0.8 + azar() * 1.6;
    const p = n.multiplyScalar(gl.radio - 0.15);
    return { posicion: [p.x, p.y, p.z] as [number, number, number], escala: [e, e * 0.5, e] as [number, number, number], rotacion: [Math.atan2(p.z, p.y), azar() * 6, -Math.atan2(p.x, p.y)] as [number, number, number] };
  });
  // Atmósfera: casquete lila translúcido apenas mayor, la franja clara sobre el horizonte de la lámina.
  const aire = new THREE.Mesh(new THREE.IcosahedronGeometry(gl.radio + 0.9, 12), new THREE.MeshBasicMaterial({ color: colorToken("lila"), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.BackSide }));
  const g = grupo("Mars_Globe", esfera, aire, instanciarRocas(m, rocas, "Globe_Rocks"));
  g.position.set(...gl.centro);
  return g;
}
