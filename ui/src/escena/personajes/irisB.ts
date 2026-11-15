import * as THREE from "three";
import { CARAS_IRIS, chaflanado, geometriaCara, type CaraIris, type Iris } from "./iris.js";
import type { V3 } from "./malla.js";
import { Superficie, type Pesos, type Topologia } from "./superficie.js";

/**
 * Iris B: el rover de la lámina "Iris / Solar Field Guide" con la misma construcción que la
 * tripulación B. El chasis es UNA superficie cerrada de seis secciones de diez puntos (la franja
 * teal es una banda de la propia malla, no una caja encima); ruedas, pantalla, paneles y antena
 * son piezas cerradas de vértices compartidos. Dos llamadas de dibujo: cuerpo y ojos.
 *
 * Añade a Iris A los paneles laterales plegables de la lámina (huesos `alaI` y `alaD`).
 * Unidades: metros. +Z frente, +X izquierda de Iris.
 */

export const HUESOS_IRIS_B = ["chasis", "ruedaDI", "ruedaDD", "ruedaTI", "ruedaTD", "antena", "panel", "alaI", "alaD"] as const;
export type HuesoIrisB = (typeof HUESOS_IRIS_B)[number];
const H = Object.fromEntries(HUESOS_IRIS_B.map((n, i) => [n, i])) as Record<HuesoIrisB, number>;
const peso = (n: HuesoIrisB): Pesos => [[H[n], 1]];

export interface OpcionesIrisB {
  velocidad?: number | undefined;
  averiada?: boolean | undefined;
  quieto?: boolean | undefined;
  cara?: CaraIris | undefined;
  /** Paneles laterales: 0 = plegados (conducir), 1 = desplegados (cargar). */
  paneles?: number | undefined;
}

export interface IrisB extends Iris {
  huesos: Record<HuesoIrisB, THREE.Bone>;
  animar(t: number, o?: OpcionesIrisB): void;
  /** Medidas de la malla lógica por pieza, para revisión y pruebas. */
  topologia: Record<string, Topologia>;
}

const MARFIL = 0xfce6d6;
const MARFIL_SOMBRA = 0xe3c4bb;
const TEAL = 0x47aab5;
const INDIGO = 0x675b95;
const INDIGO_OSCURO = 0x4d4474;
const PANTALLA = 0x1c1248;
const CIAN = 0x73d4e1;
const AMBAR = 0xf2b531;
const NARANJA = 0xf88536;
const CELDA = 0x3b3f86;

const RADIO = 0.16;
const Y_BANDA = 0.29;
const PLIEGUE = 1.5;

/** Sección del chasis: [z, medio ancho, y de abajo, y de arriba, chaflán bajo, chaflán alto]. */
type Seccion = [z: number, w: number, yb: number, yt: number, cb: number, ca: number];
const CHASIS: Seccion[] = [
  [-0.335, 0.2, 0.2, 0.47, 0.04, 0.05],
  [-0.295, 0.25, 0.15, 0.53, 0.07, 0.07],
  [-0.05, 0.26, 0.14, 0.57, 0.08, 0.07],
  [0.2, 0.26, 0.14, 0.57, 0.08, 0.07],
  [0.29, 0.245, 0.15, 0.55, 0.09, 0.08],
  [0.325, 0.21, 0.18, 0.51, 0.07, 0.07],
];

function construirChasis(s: Superficie): void {
  s.etiqueta = "chasis";
  const W = peso("chasis");
  // Diez puntos por sección: 0-4 suben por su izquierda (bajo, chaflán, franja, costado, techo) y 5-9 bajan por su derecha.
  const anillos = CHASIS.map(([z, w, yb, yt, cb, ca]) => {
    const mitad: Array<[number, number]> = [
      [w - cb, yb],
      [w, yb + cb],
      [w, Y_BANDA],
      [w, yt - ca],
      [w - ca, yt],
    ];
    const pts = [...mitad, ...mitad.map(([x, y]): [number, number] => [-x, y]).reverse()];
    return s.anillo(
      pts.map(([x, y]): V3 => [x, y, z]),
      W,
    );
  });
  const color = (i: number) => (i === 1 || i === 7 ? TEAL : i === 9 ? INDIGO_OSCURO : i === 0 || i === 8 ? MARFIL_SOMBRA : MARFIL);
  for (let i = 0; i < anillos.length - 1; i++) s.puente(anillos[i]!, anillos[i + 1]!, color);
  // Tapas: nariz, franja y frente comparten aristas, así la franja da la vuelta completa.
  for (const [a, colorAlto] of [
    [anillos[anillos.length - 1]!, MARFIL],
    [anillos[0]!, MARFIL],
  ] as const) {
    s.cara([a[9]!, a[0]!, a[1]!, a[8]!], MARFIL_SOMBRA);
    s.cara([a[8]!, a[1]!, a[2]!, a[7]!], TEAL);
    s.cara([a[7]!, a[2]!, a[3]!, a[4]!, a[5]!, a[6]!], colorAlto);
  }
}

function prisma(s: Superficie, pts: Array<[number, number]>, y: number, z0: number, z1: number, W: Pesos, color: number, colorFrente = color): void {
  const a = s.anillo(
    pts.map(([px, py]): V3 => [px, y + py, z0]),
    W,
  );
  const b = s.anillo(
    pts.map(([px, py]): V3 => [px, y + py, z1]),
    W,
  );
  s.puente(a, b, color);
  s.cara(a, color);
  s.cara(b, colorFrente);
}

/** Rueda octogonal cerrada: banda de rodadura, flanco y tapacubos marfil elevado hacia fuera. */
function construirRueda(s: Superficie, c: V3, lado: 1 | -1, W: Pesos): void {
  const A = 0.084;
  const aro = (dx: number, r: number): number[] =>
    s.anillo(
      Array.from({ length: 8 }, (_, i): V3 => {
        const t = ((i + 0.5) * Math.PI) / 4;
        return [c[0] + lado * dx, c[1] + Math.cos(t) * r, c[2] + Math.sin(t) * r];
      }),
      W,
    );
  const dentro = aro(-A, RADIO * 0.72);
  const cantoDentro = aro(-A * 0.66, RADIO);
  const cantoFuera = aro(A * 0.66, RADIO);
  const flanco = aro(A, RADIO * 0.68);
  const cubo = aro(A + 0.012, RADIO * 0.54);
  s.puente(dentro, cantoDentro, INDIGO_OSCURO);
  s.puente(cantoDentro, cantoFuera, INDIGO);
  s.puente(cantoFuera, flanco, INDIGO_OSCURO);
  s.puente(flanco, cubo, MARFIL_SOMBRA);
  s.cara(dentro, INDIGO_OSCURO);
  s.cara(cubo, 0xf3e6dc);
}

/** Panel solar: marco marfil y celdas separadas; la retícula es el marco que asoma entre ellas. */
function construirPanel(s: Superficie, c: V3, medio: [number, number], columnas: number, filas: number, W: Pesos): void {
  s.caja(c, [medio[0], 0.011, medio[1]], W, MARFIL, 0.3);
  const margen = 0.016;
  const hueco = 0.012;
  const cw = (medio[0] * 2 - margen * 2 - hueco * (columnas - 1)) / columnas;
  const cl = (medio[1] * 2 - margen * 2 - hueco * (filas - 1)) / filas;
  for (let i = 0; i < columnas; i++) {
    for (let j = 0; j < filas; j++) {
      const x = c[0] - medio[0] + margen + cw / 2 + i * (cw + hueco);
      const z = c[2] - medio[1] + margen + cl / 2 + j * (cl + hueco);
      s.caja([x, c[1] + 0.012, z], [cw / 2, 0.004, cl / 2], W, CELDA, 0.3);
    }
  }
}

const materialCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 });
const materialCara = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });

const PIEZAS = ["chasis", "pantalla", "ruedas", "paneles", "antena", "detalles"];

export function crearIrisB(): IrisB {
  const s = new Superficie();
  const W = peso("chasis");
  construirChasis(s);

  const frente = CHASIS[CHASIS.length - 1]!;
  const zf = frente[0];
  const techo = 0.57;

  // Visera y pantalla: dos prismas octogonales encajados en la cara frontal.
  s.etiqueta = "pantalla";
  const yPantalla = 0.412;
  prisma(s, chaflanado(0.198, 0.1, 0.05), yPantalla, zf - 0.02, zf + 0.016, W, MARFIL_SOMBRA, MARFIL);
  prisma(s, chaflanado(0.174, 0.082, 0.04), yPantalla, zf - 0.01, zf + 0.021, W, PANTALLA);

  s.etiqueta = "detalles";
  // Faro: aro claro y núcleo cian sobre la franja.
  const disco = (r: number, z: number, color: number) => {
    const borde = s.anillo(
      Array.from({ length: 8 }, (_, k): V3 => {
        const t = Math.PI / 8 + (k * Math.PI) / 4;
        return [Math.cos(t) * r, 0.262 + Math.sin(t) * r, z];
      }),
      W,
    );
    s.abanico(borde, [0, 0.262, z], W, color, { pista: [0, 0, 1] });
  };
  s.caja([0, 0.262, zf + 0.002], [0.05, 0.05, 0.008], W, MARFIL, 0.6);
  disco(0.04, zf + 0.012, 0xf7fbfb);
  disco(0.026, zf + 0.015, CIAN);
  // Cámara bajo el faro, luces naranjas de costado, rejilla y luz traseras.
  s.caja([0, 0.2, zf + 0.004], [0.03, 0.02, 0.012], W, INDIGO_OSCURO, 0.3, 0x2a1f55);
  for (const lado of [1, -1]) s.caja([lado * 0.262, 0.41, -0.1], [0.006, 0.016, 0.04], W, NARANJA, 0.3);
  const zt = CHASIS[0]![0];
  s.caja([0, 0.345, zt - 0.003], [0.075, 0.036, 0.008], W, INDIGO_OSCURO, 0.3);
  for (const x of [-0.04, 0, 0.04]) s.caja([x, 0.345, zt - 0.011], [0.011, 0.02, 0.004], W, AMBAR, 0.3);
  s.caja([0, 0.425, zt - 0.003], [0.03, 0.012, 0.008], W, NARANJA, 0.3);
  // Ejes: unen cada rueda con los bajos.
  for (const z of [0.2, -0.2]) s.caja([0, RADIO, z], [0.27, 0.03, 0.03], W, INDIGO_OSCURO, 0.3);

  // Ruedas.
  s.etiqueta = "ruedas";
  const ejes: Record<"ruedaDI" | "ruedaDD" | "ruedaTI" | "ruedaTD", V3> = {
    ruedaDI: [0.35, RADIO, 0.2],
    ruedaDD: [-0.35, RADIO, 0.2],
    ruedaTI: [0.35, RADIO, -0.2],
    ruedaTD: [-0.35, RADIO, -0.2],
  };
  for (const [n, c] of Object.entries(ejes)) construirRueda(s, c, c[0] > 0 ? 1 : -1, peso(n as HuesoIrisB));

  // Panel del techo y paneles laterales (modelados desplegados; el hueso los pliega).
  s.etiqueta = "paneles";
  const pivotePanel: V3 = [0, techo + 0.03, 0.04];
  s.caja([0, techo + 0.01, 0.04], [0.06, 0.012, 0.06], W, MARFIL_SOMBRA, 0.3);
  construirPanel(s, pivotePanel, [0.185, 0.2], 2, 3, peso("panel"));
  const bisagra: Record<"alaI" | "alaD", V3> = { alaI: [0.275, techo - 0.012, 0.04], alaD: [-0.275, techo - 0.012, 0.04] };
  for (const lado of [1, -1] as const) {
    const n = lado === 1 ? "alaI" : "alaD";
    const b = bisagra[n];
    s.caja([lado * 0.245, b[1], b[2]], [0.03, 0.014, 0.05], W, MARFIL_SOMBRA, 0.3);
    construirPanel(s, [b[0] + lado * 0.125, b[1], b[2]], [0.115, 0.17], 2, 2, peso(n));
  }

  // Antena: base, varilla y bola, en el centro de la zaga del techo.
  s.etiqueta = "antena";
  const A = peso("antena");
  const pivoteAntena: V3 = [0, techo, -0.235];
  s.caja([0, techo + 0.012, -0.235], [0.03, 0.014, 0.03], W, MARFIL_SOMBRA, 0.3);
  s.caja([0, techo + 0.1, -0.235], [0.011, 0.08, 0.011], A, MARFIL_SOMBRA, 0.3);
  s.bola([0, techo + 0.205, -0.235], [0.04, 0.04, 0.04], A, 0xfff4ea);

  // Esqueleto.
  const y0 = 0.14;
  const pivote: Record<HuesoIrisB, V3> = { chasis: [0, y0, 0], ...ejes, antena: pivoteAntena, panel: pivotePanel, ...bisagra };
  const huesos = {} as Record<HuesoIrisB, THREE.Bone>;
  for (const n of HUESOS_IRIS_B) {
    const b = new THREE.Bone();
    b.name = n;
    huesos[n] = b;
    if (n === "chasis") b.position.set(...pivote.chasis);
    else {
      b.position.set(pivote[n][0], pivote[n][1] - y0, pivote[n][2]);
      huesos.chasis.add(b);
    }
  }
  const grupo = new THREE.Group();
  grupo.name = "iris";
  grupo.add(huesos.chasis);
  const geometria = s.geometria();
  const cuerpo = new THREE.SkinnedMesh(geometria, materialCuerpo);
  cuerpo.name = "iris-cuerpo";
  cuerpo.frustumCulled = false;
  cuerpo.castShadow = true;
  grupo.add(cuerpo);
  grupo.updateMatrixWorld(true);
  const esqueleto = new THREE.Skeleton(HUESOS_IRIS_B.map((n) => huesos[n]));
  cuerpo.bind(esqueleto);
  let liberado = false;

  // Ojos: las mismas seis caras de Iris A, una malla visible a la vez.
  const caras = new Map<CaraIris, THREE.Mesh>();
  const soporte = new THREE.Group();
  soporte.position.set(0, yPantalla - y0, zf + 0.025);
  soporte.scale.setScalar(0.92);
  huesos.chasis.add(soporte);
  for (const c of CARAS_IRIS) {
    const malla = new THREE.Mesh(geometriaCara(c), materialCara);
    malla.visible = c === "atenta";
    malla.name = `iris-cara-${c}`;
    caras.set(c, malla);
    soporte.add(malla);
  }
  let actual: CaraIris = "atenta";
  const cara = (c: CaraIris) => {
    if (c === actual) return;
    caras.get(actual)!.visible = false;
    caras.get(c)!.visible = true;
    actual = c;
  };

  return {
    grupo,
    huesos,
    cara,
    topologia: Object.fromEntries(PIEZAS.map((p) => [p, s.topologia(p)])),
    animar(t, o = {}) {
      const vivo = o.quieto ? 0 : 1;
      const v = o.velocidad ?? 0;
      const giro = o.quieto ? 0 : (v * t) / RADIO;
      for (const n of ["ruedaDI", "ruedaDD", "ruedaTI", "ruedaTD"] as const) huesos[n].rotation.x = giro;
      const rodando = Math.min(1, Math.abs(v));
      // Suspensión: rebote corto al rodar, respiración lenta en reposo.
      huesos.chasis.position.y = y0 + (Math.sin(t * 9) * 0.006 * rodando + Math.sin(t * 1.6) * 0.004 * (1 - rodando)) * vivo;
      huesos.chasis.rotation.x = Math.sin(t * 9 + 1) * 0.012 * rodando * vivo;
      huesos.antena.rotation.x = (Math.sin(t * 5) * 0.1 * rodando + Math.sin(t * 2.1) * 0.04) * vivo;
      huesos.antena.rotation.z = Math.sin(t * 1.3) * 0.05 * vivo;
      huesos.panel.rotation.x = Math.sin(t * 0.6) * 0.02 * vivo;
      const abre = Math.max(0, Math.min(1, o.paneles ?? 0));
      const pliegue = PLIEGUE * (1 - abre);
      huesos.alaI.rotation.z = -pliegue;
      huesos.alaD.rotation.z = pliegue;
      if (o.averiada) {
        huesos.chasis.rotation.z = Math.sin(t * 31) * 0.012 * vivo + 0.03;
        huesos.antena.rotation.z = 0.5;
        cara(Math.floor(t * 3) % 4 === 3 && vivo ? "apagada" : "error");
        return;
      }
      huesos.chasis.rotation.z = 0;
      const base = o.cara ?? "atenta";
      cara(vivo && (t + 0.4) % 3.3 > 3.16 && (base === "atenta" || base === "pensando") ? "parpadeo" : base);
    },
    liberar() {
      if (liberado) return;
      liberado = true;
      esqueleto.dispose();
      geometria.dispose();
      caras.forEach((c) => c.geometry.dispose());
    },
  };
}
