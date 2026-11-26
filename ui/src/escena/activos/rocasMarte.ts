/**
 * Rocas de Marte (Etapa BC): reemplazan al dodecaedro de 12 caras.
 *
 * - Variantes: icosaedro subdividido, deformado con ruido y recortado por planos al azar (facetas afiladas
 *   de roca partida), con la base aplanada y hundida (`ENTERRADO`). Normales con pliegue: aristas vivas en
 *   los cortes, superficie suave en lo demás. `VARIANTES_CERCA` (320 caras) para lo que se ve de cerca;
 *   `VARIANTES_LEJOS` (80 caras) para los grupos lejanos.
 * - Huella en planta: toda variante cabe en un radio de 1,1 por unidad de escala, por debajo del 1,2 que
 *   usa `radioRoca` (armado.ts) para la colisión. Las posiciones y escalas de las rocas que chocan
 *   (borde del claro y primer plano) no cambian.
 * - Grupos: de 3 a 7 rocas medio enterradas alrededor de una mayor; muchas chicas y pocas grandes. Solo
 *   fuera del límite caminable (`limite`), así no hace falta colisión nueva, y nunca en pendiente fuerte.
 * - Una `InstancedMesh` por variante y por zona (cerca / lejos).
 */
import * as THREE from "three";
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { geometriaBase } from "../materiales";
import { aleatorio, type TransformacionRoca } from "./terrenoDatos";
import { normalRelieve, ruido, type FuncionAltura } from "./relieve";
import { PALETA_SUELO } from "./sueloMarte";

/** Fracción de la altura de la roca que queda bajo el suelo. */
export const ENTERRADO = 0.28;
/** Radio en planta máximo por unidad de escala (colisión: `radioRoca` usa 1,2). */
export const RADIO_PLANTA = 1.1;

interface FormaRoca {
  semilla: number;
  /** Proporción (x, y, z) antes de recortar. */
  proporcion: [number, number, number];
  /** Planos de corte y su distancia mínima al centro. */
  cortes: number;
  corteMin: number;
  /** Amplitud del ruido de la superficie. */
  rugosidad: number;
}

/** Seis formas: bloque partido, laja y aguja baja (cerca); canto redondeado, cuña y losa (lejos y chicas). [E] */
const FORMAS: readonly FormaRoca[] = [
  { semilla: 11, proporcion: [1, 0.72, 0.85], cortes: 9, corteMin: 0.55, rugosidad: 0.14 },
  { semilla: 23, proporcion: [1.1, 0.5, 0.9], cortes: 8, corteMin: 0.5, rugosidad: 0.1 },
  { semilla: 41, proporcion: [0.9, 0.85, 0.8], cortes: 9, corteMin: 0.5, rugosidad: 0.14 },
  { semilla: 37, proporcion: [0.95, 0.8, 0.9], cortes: 2, corteMin: 0.8, rugosidad: 0.28 },
  { semilla: 53, proporcion: [1.1, 0.7, 0.65], cortes: 6, corteMin: 0.5, rugosidad: 0.18 },
  { semilla: 67, proporcion: [1.05, 0.38, 1], cortes: 4, corteMin: 0.6, rugosidad: 0.12 },
];

/** Geometría de una forma: deformada, recortada, apoyada en y = 0 con `ENTERRADO` bajo el suelo. */
export function geometriaFormaRoca(forma: FormaRoca, detalle: number): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detalle);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  const azar = aleatorio(forma.semilla);
  const cortes: { n: THREE.Vector3; d: number }[] = [];
  for (let k = 0; k < forma.cortes; k++) {
    // Normales repartidas, con preferencia lateral y hacia arriba (la base se trata aparte).
    const a = azar() * Math.PI * 2;
    const y = azar() * 1.3 - 0.35;
    cortes.push({ n: new THREE.Vector3(Math.cos(a), y, Math.sin(a)).normalize(), d: forma.corteMin + azar() * 0.25 });
  }
  const pos = geo.getAttribute("position");
  const p = new THREE.Vector3();
  const [sx, sy, sz] = forma.proporcion;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const n = ruido(p.x * 1.7 + p.y * 0.9 + forma.semilla, p.z * 1.7 - p.y * 1.1, forma.semilla) * 0.65
      + ruido(p.x * 4.1 - p.y * 2.3, p.z * 4.1 + p.y * 1.7 + forma.semilla, forma.semilla + 1) * 0.35;
    p.multiplyScalar(1 + (n - 0.5) * 2 * forma.rugosidad);
    for (const c of cortes) {
      const s = p.dot(c.n) - c.d;
      if (s > 0) p.addScaledVector(c.n, -s);
    }
    p.set(p.x * sx, p.y * sy, p.z * sz);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.computeBoundingBox();
  const caja = geo.boundingBox!;
  const alto = caja.max.y - caja.min.y;
  const suelo = caja.min.y + alto * ENTERRADO;
  // Radio en planta máximo: se escala para que quepa en `RADIO_PLANTA`.
  let radio = 0;
  for (let i = 0; i < pos.count; i++) radio = Math.max(radio, Math.hypot(pos.getX(i), pos.getZ(i)));
  const k = RADIO_PLANTA / Math.max(radio, 1e-6);
  geo.translate(0, -suelo, 0);
  geo.scale(Math.min(1, k), Math.min(1, k), Math.min(1, k));
  const plegada = toCreasedNormals(geo, Math.PI / 6);
  // Color de vértice: basalto con variación leve por vértice y la cima algo más clara.
  const color = new Float32Array(plegada.getAttribute("position").count * 3);
  const nor = plegada.getAttribute("normal");
  const c = new THREE.Color();
  // Gris pardo, más frío y oscuro que el suelo, como los bloques de `occupy-mars-2`.
  const base = new THREE.Color(PALETA_SUELO.rocaSuelta);
  const claro = new THREE.Color(PALETA_SUELO.rocaSueltaCima);
  const variar = aleatorio(forma.semilla + 500);
  for (let i = 0; i < color.length / 3; i += 3) {
    const t = Math.max(0, nor.getY(i)) * 0.35;
    c.copy(base).lerp(claro, t).multiplyScalar(0.9 + variar() * 0.2);
    for (let v = 0; v < 3; v++) color.set([c.r, c.g, c.b], (i + v) * 3);
  }
  plegada.setAttribute("color", new THREE.BufferAttribute(color, 3));
  plegada.computeBoundingSphere();
  geo.dispose();
  return plegada;
}

/**
 * Variantes de cerca (320 caras, con sombra): las tres primeras formas. De lejos y chicas (80 caras, sin
 * sombra, anexo de objetos: "las piezas chicas no proyectan sombra"): dos más. Con la piedrita de la gravilla, 6 formas:
 * así la escena con los cinco módulos sigue en ≤ 80 llamadas contando las sombras.
 */
export const VARIANTES_CERCA = 3;
export const VARIANTES_LEJOS = 2;

/** Geometría cacheada de la variante `i` de la zona. */
export function geometriaVariante(zona: "cerca" | "lejos", i: number): THREE.BufferGeometry {
  const forma = FORMAS[(zona === "cerca" ? i : i + VARIANTES_CERCA) % FORMAS.length]!;
  return geometriaBase(`roca-marte-${zona}-${i}`, () => geometriaFormaRoca(forma, zona === "cerca" ? 2 : 1));
}

// ---------------------------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------------------------

export interface RocaColocada extends TransformacionRoca {
  variante: number;
  /** `cerca`: 320 caras y sombra; `lejos`: 80 caras sin sombra (lejanas y acompañantes chicas). */
  detalle: "cerca" | "lejos";
}

/** Grupos de rocas fuera de la zona caminable. [E] */
export const GRUPOS_ROCAS = {
  semilla: 4242,
  /** Grupos cercanos (variantes de 320 caras) y lejanos (80 caras). */
  cerca: { n: 48, radioMin: 36, radioMax: 80 },
  lejos: { n: 60, radioMin: 80, radioMax: 175 },
  /** Escala de la roca principal y de las acompañantes. */
  principal: [0.6, 2.6] as [number, number],
  acompanante: [0.12, 0.55] as [number, number],
  /** Normal Y mínima del terreno donde se apoya un grupo (sin pendientes fuertes). */
  pendienteMin: 0.86,
  /** Ninguna roca de grupo entra en el círculo caminable (`limite: 32` de escena3d.ts) más 1 m de aire. */
  limiteCaminable: 33,
} as const;

/**
 * Grupos de 3 a 7 rocas. La principal sigue una ley de potencia (muchas medianas, pocas grandes);
 * las acompañantes se reparten a su alrededor y se hunden más cuanto más chicas.
 */
export function gruposRocas(
  altura: FuncionAltura,
  zona: "cerca" | "lejos",
  excluir: (x: number, z: number, radio: number) => boolean = () => false,
): RocaColocada[] {
  const G = GRUPOS_ROCAS;
  const Z = G[zona];
  const azar = aleatorio(G.semilla + (zona === "cerca" ? 0 : 7919));
  const rocas: RocaColocada[] = [];
  const poner = (x: number, z: number, e: number, aplastar: number, hundir: number, detalle: "cerca" | "lejos") => {
    const r1 = azar(), r2 = azar(), r3 = azar(), r4 = azar();
    const nVar = detalle === "cerca" ? VARIANTES_CERCA : VARIANTES_LEJOS;
    rocas.push({
      detalle,
      posicion: [x, altura(x, z) - hundir * e, z],
      escala: [e * (0.85 + r1 * 0.3), e * aplastar, e * (0.85 + r2 * 0.3)],
      rotacion: [(r3 - 0.5) * 0.25, r4 * Math.PI * 2, (azar() - 0.5) * 0.25],
      variante: Math.floor(azar() * nVar),
    });
  };
  for (let g = 0; g < Z.n; g++) {
    const a = azar() * Math.PI * 2;
    const d = Math.sqrt(Z.radioMin ** 2 + azar() * (Z.radioMax ** 2 - Z.radioMin ** 2));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const [pMin, pMax] = G.principal;
    const e = pMin + (pMax - pMin) * Math.pow(azar(), 1.7) * (zona === "lejos" ? 1.4 : 1);
    const cuantas = 2 + Math.floor(azar() * 5);
    const adentro = (px: number, pz: number, radio: number) => Math.hypot(px, pz) - radio < G.limiteCaminable;
    if (normalRelieve(altura, x, z)[1] < G.pendienteMin || adentro(x, z, e * RADIO_PLANTA) || excluir(x, z, e * RADIO_PLANTA)) continue;
    poner(x, z, e, 0.7 + azar() * 0.5, 0.05, zona);
    for (let k = 0; k < cuantas; k++) {
      const ak = azar() * Math.PI * 2;
      const dk = e * (1.1 + azar() * 1.6);
      const xk = x + Math.cos(ak) * dk, zk = z + Math.sin(ak) * dk;
      const [aMin, aMax] = G.acompanante;
      const ek = e * (aMin + (aMax - aMin) * Math.pow(azar(), 1.6));
      if (adentro(xk, zk, ek * RADIO_PLANTA) || excluir(xk, zk, ek * RADIO_PLANTA)) continue;
      poner(xk, zk, Math.max(0.12, ek), 0.6 + azar() * 0.5, 0.05 + (1 - ek / e) * 0.15, "lejos");
    }
  }
  return rocas;
}

/**
 * Rocas de un mismo detalle en una `InstancedMesh` por variante. Las de `cerca` proyectan sombra;
 * las de `lejos` no. Devuelve un grupo `nombre`.
 */
export function instanciarPorVariante(
  rocas: readonly RocaColocada[],
  zona: "cerca" | "lejos",
  material: THREE.Material,
  nombre: string,
  sombra = zona === "cerca",
): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  const nVar = zona === "cerca" ? VARIANTES_CERCA : VARIANTES_LEJOS;
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  for (let v = 0; v < nVar; v++) {
    const propias = rocas.filter((r) => r.variante % nVar === v);
    if (propias.length === 0) continue;
    const malla = new THREE.InstancedMesh(geometriaVariante(zona, v), material, propias.length);
    malla.name = `${nombre}_${v}`;
    propias.forEach((r, i) => malla.setMatrixAt(i, m.compose(p.set(...r.posicion), q.setFromEuler(e.set(...r.rotacion)), s.set(...r.escala))));
    malla.instanceMatrix.needsUpdate = true;
    malla.computeBoundingSphere();
    malla.castShadow = sombra;
    malla.receiveShadow = true;
    grupo.add(malla);
  }
  return grupo;
}

/** Asigna variantes a rocas ya colocadas (borde del claro, primer plano) sin mover ninguna. */
export function conVariante(rocas: readonly TransformacionRoca[], variantes?: readonly number[]): RocaColocada[] {
  return rocas.map((r, i) => ({ ...r, detalle: "cerca", variante: (variantes?.[i] ?? i * 3) % VARIANTES_CERCA }));
}

// ---------------------------------------------------------------------------------------------
// Piedritas: muchas escalas
// ---------------------------------------------------------------------------------------------

/**
 * Piedritas de la zona (regla 11, `occupy-mars-2`: muchas piedras chicas oscuras alrededor de cada bloque
 * y acumuladas al pie de los badlands). Van en la malla de la gravilla (8 caras, sin sombra).
 * Escala en m; las lejanas son más grandes para que se lean a distancia. [E]
 */
export const PIEDRITAS = {
  semilla: 5151,
  /** Alrededor de cada bloque: cuántas por unidad de escala del bloque y hasta qué radio (× radio del bloque). */
  porBloque: 9,
  radioBloque: [1.1, 3.2] as [number, number],
  /** Al pie de las paredes: candidatos y radios de búsqueda. */
  candidatosPie: 2600,
  pie: { radioMin: 45, radioMax: 230 },
  escalaCerca: [0.06, 0.26] as [number, number],
  escalaLejos: [0.25, 0.8] as [number, number],
  /** Fracción de la piedra bajo el suelo. */
  hundir: 0.35,
  /** Tope total (presupuesto: 8 caras cada una). */
  maximo: 3200,
} as const;

/**
 * Piedritas alrededor de `bloques` y al pie de las paredes de la zona. `excluir(x, z)` descarta las que
 * caerían fuera de la zona, en la base o dentro del círculo caminable.
 */
export function piedritas(altura: FuncionAltura, bloques: readonly TransformacionRoca[], excluir: (x: number, z: number) => boolean): TransformacionRoca[] {
  const P = PIEDRITAS;
  const azar = aleatorio(P.semilla);
  const salida: TransformacionRoca[] = [];
  const escalaPara = (x: number, z: number) => {
    const t = Math.min(1, Math.max(0, (Math.hypot(x, z) - 30) / 150));
    const [a0, a1] = P.escalaCerca, [b0, b1] = P.escalaLejos;
    const lo = a0 + (b0 - a0) * t, hi = a1 + (b1 - a1) * t;
    return lo + (hi - lo) * Math.pow(azar(), 2.4); // muchas chicas, pocas grandes
  };
  const poner = (x: number, z: number, e: number) => {
    if (salida.length >= P.maximo || excluir(x, z)) return;
    salida.push({
      posicion: [x, altura(x, z) - P.hundir * e, z],
      escala: [e * (0.8 + azar() * 0.5), e * (0.5 + azar() * 0.4), e * (0.8 + azar() * 0.5)],
      rotacion: [(azar() - 0.5) * 0.6, azar() * Math.PI * 2, (azar() - 0.5) * 0.6],
    });
  };
  // Alrededor de cada bloque, más cerca cuanto más densas.
  for (const b of bloques) {
    const radio = Math.max(b.escala[0], b.escala[2]) * RADIO_PLANTA;
    const n = Math.round(P.porBloque * (0.6 + Math.max(...b.escala)));
    for (let k = 0; k < n; k++) {
      const a = azar() * Math.PI * 2;
      const d = radio * (P.radioBloque[0] + (P.radioBloque[1] - P.radioBloque[0]) * Math.pow(azar(), 1.8));
      const x = b.posicion[0] + Math.cos(a) * d, z = b.posicion[2] + Math.sin(a) * d;
      poner(x, z, escalaPara(x, z));
    }
  }
  // Al pie de las paredes: suelo poco inclinado con una subida fuerte a pocos metros.
  for (let k = 0; k < P.candidatosPie && salida.length < P.maximo; k++) {
    const a = azar() * Math.PI * 2;
    const d = Math.sqrt(P.pie.radioMin ** 2 + azar() * (P.pie.radioMax ** 2 - P.pie.radioMin ** 2));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (excluir(x, z) || normalRelieve(altura, x, z, 1)[1] < 0.8) continue;
    const y = altura(x, z);
    let subida = 0;
    for (let j = 0; j < 6; j++) {
      const aj = (j / 6) * Math.PI * 2;
      subida = Math.max(subida, altura(x + Math.cos(aj) * 5, z + Math.sin(aj) * 5) - y);
    }
    if (subida < 1.4) continue;
    // Un manchón de 3 a 8 piedras en el pie.
    const cuantas = 3 + Math.floor(azar() * 6);
    for (let j = 0; j < cuantas; j++) {
      const xj = x + (azar() - 0.5) * 4, zj = z + (azar() - 0.5) * 4;
      poner(xj, zj, escalaPara(xj, zj));
    }
  }
  return salida;
}
