import * as THREE from "three";
import { ConstructorMalla, type V3 } from "./malla.js";

/**
 * Iris: rover solar compacto de 4 ruedas (DISEÑO §4.2; láminas `mundo/01` y `personajes/07`).
 * Cuerpo marfil en caja con chaflanes, franja teal, pantalla oscura con dos ojos cian, panel solar
 * en el techo, antena corta con bola y ruedas índigo gruesas. No es humanoide ni vuela.
 *
 * Dos llamadas de dibujo: el cuerpo entero (malla con huesos rígidos) y la cara de la pantalla.
 */

export type CaraIris = "atenta" | "feliz" | "parpadeo" | "pensando" | "error" | "apagada";
export const CARAS_IRIS: CaraIris[] = ["atenta", "feliz", "parpadeo", "pensando", "error", "apagada"];

const HUESOS_IRIS = ["chasis", "ruedaDI", "ruedaDD", "ruedaTI", "ruedaTD", "antena", "panel"] as const;
type HuesoIris = (typeof HUESOS_IRIS)[number];
const H = Object.fromEntries(HUESOS_IRIS.map((n, i) => [n, i])) as Record<HuesoIris, number>;

export interface Iris {
  grupo: THREE.Group;
  huesos: Record<HuesoIris, THREE.Bone>;
  cara(c: CaraIris): void;
  /** Avanza la animación: `velocidad` en m/s para girar las ruedas; `averiada` cambia cara y temblor. */
  animar(t: number, o?: { velocidad?: number | undefined; averiada?: boolean | undefined; quieto?: boolean | undefined; cara?: CaraIris | undefined }): void;
  liberar(): void;
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
const PANEL = 0x4f5fa8;

const RADIO_RUEDA = 0.125;
const ALTO_CHASIS = 0.36;
const FRENTE = 0.33;

function rueda(m: ConstructorMalla, c: V3, hueso: number): void {
  const ancho = 0.058;
  const aro = (x: number, r: number): V3[] =>
    Array.from({ length: 10 }, (_, i): V3 => {
      const t = (i * 2 * Math.PI) / 10;
      return [c[0] + x, c[1] + Math.cos(t) * r, c[2] + Math.sin(t) * r];
    });
  m.loft(
    [aro(-ancho, RADIO_RUEDA * 0.86), aro(-ancho * 0.6, RADIO_RUEDA), aro(ancho * 0.6, RADIO_RUEDA), aro(ancho, RADIO_RUEDA * 0.86)],
    INDIGO,
    hueso,
    { colorBanda: (i) => (i === 1 ? INDIGO_OSCURO : undefined) },
  );
  // Tapacubos claro a ambos lados: hace legible el giro.
  for (const s of [1, -1]) {
    const x = c[0] + s * (ancho + 0.003);
    const pts = Array.from({ length: 5 }, (_, i): V3 => {
      const t = (i * 2 * Math.PI) / 5;
      return [x, c[1] + Math.cos(t) * RADIO_RUEDA * 0.42, c[2] + Math.sin(t) * RADIO_RUEDA * 0.42];
    });
    for (let i = 0; i < 5; i++) m.tri([x, c[1], c[2]], pts[i]!, pts[(i + 1) % 5]!, 0xbdafc4, hueso, [c[0], c[1], c[2]]);
  }
}

/** Rectángulo con esquinas cortadas, en el plano de la pantalla. */
const chaflanado = (rx: number, ry: number, k: number, cx = 0, cy = 0): Array<[number, number]> => [
  [cx - rx + k, cy - ry],
  [cx + rx - k, cy - ry],
  [cx + rx, cy - ry + k],
  [cx + rx, cy + ry - k],
  [cx + rx - k, cy + ry],
  [cx - rx + k, cy + ry],
  [cx - rx, cy + ry - k],
  [cx - rx, cy - ry + k],
];

function geometriaCara(cara: CaraIris): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const tmp = new THREE.Color();
  const poligono = (pts: Array<[number, number]>, color: number) => {
    tmp.setHex(color);
    for (let i = 1; i < pts.length - 1; i++) {
      for (const q of [pts[0]!, pts[i]!, pts[i + 1]!]) {
        pos.push(q[0], q[1], 0);
        col.push(tmp.r, tmp.g, tmp.b);
      }
    }
  };
  const tira = (x0: number, y0: number, x1: number, y1: number, g: number, color: number) => {
    const l = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / l) * g;
    const ny = ((x1 - x0) / l) * g;
    poligono(
      [
        [x0 - nx, y0 - ny],
        [x1 - nx, y1 - ny],
        [x1 + nx, y1 + ny],
        [x0 + nx, y0 + ny],
      ],
      color,
    );
  };
  const X = 0.085;
  for (const s of [1, -1]) {
    const x = s * X;
    if (cara === "atenta") poligono(chaflanado(0.03, 0.05, 0.014, x), CIAN);
    else if (cara === "parpadeo") poligono(chaflanado(0.034, 0.008, 0.004, x), CIAN);
    else if (cara === "feliz") {
      // Arco hacia arriba: ojos que sonríen.
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI * (i / 6);
        const a1 = Math.PI * ((i + 1) / 6);
        tira(x + Math.cos(a0) * 0.034, Math.sin(a0) * 0.036 - 0.014, x + Math.cos(a1) * 0.034, Math.sin(a1) * 0.036 - 0.014, 0.009, CIAN);
      }
    } else if (cara === "pensando") poligono(chaflanado(0.03, s === 1 ? 0.05 : 0.026, 0.012, x, s === 1 ? 0.008 : -0.006), CIAN);
    else if (cara === "error") {
      tira(x - 0.03, -0.03, x + 0.03, 0.03, 0.009, AMBAR);
      tira(x - 0.03, 0.03, x + 0.03, -0.03, 0.009, AMBAR);
    } else poligono(chaflanado(0.03, 0.005, 0.002, x), 0x4d4474);
  }
  if (cara === "error") for (let i = 0; i < 3; i++) tira(-0.17, -0.075 + i * 0.075, 0.17, -0.075 + i * 0.075, 0.003, 0x675b95);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

const materialCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8, metalness: 0 });
const materialCara = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });

export function crearIris(): Iris {
  const m = new ConstructorMalla();
  const y0 = RADIO_RUEDA * 1.15;
  const cy = y0 + ALTO_CHASIS / 2;

  // Bajos, franja teal y cuerpo: tres cajas biseladas encajadas, la del cuerpo manda la silueta.
  m.caja([0, y0 + 0.01, 0], [0.19, 0.05, FRENTE * 0.84], INDIGO_OSCURO, H.chasis, 0.3);
  m.caja([0, y0 + 0.055, 0], [0.262, 0.04, FRENTE + 0.008], TEAL, H.chasis, 0.4);
  m.caja([0, cy + 0.03, 0], [0.255, ALTO_CHASIS / 2, FRENTE], MARFIL, H.chasis, 0.34);

  // Marco y pantalla.
  const zp = FRENTE + 0.002;
  const yp = cy + 0.045;
  const plano = (pts: Array<[number, number]>, z: number, color: number) => {
    for (let i = 1; i < pts.length - 1; i++) {
      m.tri([pts[0]![0], yp + pts[0]![1], z], [pts[i]![0], yp + pts[i]![1], z], [pts[i + 1]![0], yp + pts[i + 1]![1], z], color, H.chasis, [0, yp, z - 1]);
    }
  };
  plano(chaflanado(0.205, 0.118, 0.045), zp, INDIGO);
  plano(chaflanado(0.186, 0.1, 0.038), zp + 0.003, PANTALLA);

  // Faro del parachoques.
  m.disco([0, y0 + 0.055, FRENTE + 0.012], 0.04, 0.04, 8, 0xf7fbfb, H.chasis, 1, Math.PI / 8);
  m.disco([0, y0 + 0.055, FRENTE + 0.015], 0.026, 0.026, 8, CIAN, H.chasis, 1, Math.PI / 8);

  // Detalle naranja en los costados.
  for (const s of [1, -1]) m.caja([s * 0.258, cy + 0.02, -0.07], [0.008, 0.05, 0.085], NARANJA, H.chasis, 0.3);

  // Panel solar con retícula, sobre un pie corto.
  const yt = cy + 0.03 + ALTO_CHASIS / 2;
  m.caja([0, yt + 0.02, -0.03], [0.05, 0.022, 0.05], MARFIL_SOMBRA, H.chasis, 0.2);
  m.caja([0, yt + 0.05, -0.03], [0.23, 0.012, 0.25], PANEL, H.panel, 0.2);
  const ys = yt + 0.0635;
  const linea = (x0: number, z0: number, x1: number, z1: number) => {
    const g = 0.006;
    const horizontal = z0 === z1;
    const a: V3 = horizontal ? [x0, ys, z0 - g] : [x0 - g, ys, z0];
    const b: V3 = horizontal ? [x1, ys, z1 - g] : [x1 - g, ys, z1];
    const c: V3 = horizontal ? [x1, ys, z1 + g] : [x1 + g, ys, z1];
    const d: V3 = horizontal ? [x0, ys, z0 + g] : [x0 + g, ys, z0];
    m.cuad(a, b, c, d, MARFIL, H.panel, [0, ys - 1, 0]);
  };
  for (const x of [-0.077, 0.077]) linea(x, -0.27, x, 0.21);
  for (const z of [-0.11, 0.05]) linea(-0.22, z, 0.22, z);

  // Antena corta con bola, atrás a su izquierda.
  const ax = 0.17;
  const az = -0.2;
  m.tubo(
    [
      { p: [ax, yt - 0.01, az], rx: 0.014, rz: 0.014 },
      { p: [ax, yt + 0.2, az], rx: 0.011, rz: 0.011 },
    ],
    5,
    MARFIL_SOMBRA,
    H.antena,
    { n: 2 },
  );
  m.bola([ax, yt + 0.225, az], [0.034, 0.034, 0.034], 1, 0xfff4ea, H.antena);

  // Ruedas.
  const ejes: Record<"ruedaDI" | "ruedaDD" | "ruedaTI" | "ruedaTD", V3> = {
    ruedaDI: [0.3, RADIO_RUEDA, 0.2],
    ruedaDD: [-0.3, RADIO_RUEDA, 0.2],
    ruedaTI: [0.3, RADIO_RUEDA, -0.2],
    ruedaTD: [-0.3, RADIO_RUEDA, -0.2],
  };
  for (const [n, c] of Object.entries(ejes)) rueda(m, c, H[n as HuesoIris]);

  // Esqueleto.
  const pivote: Record<HuesoIris, V3> = { chasis: [0, y0, 0], ...ejes, antena: [ax, yt, az], panel: [0, yt + 0.04, -0.03] };
  const huesos = {} as Record<HuesoIris, THREE.Bone>;
  for (const n of HUESOS_IRIS) {
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
  const geometria = m.geometria(true);
  const cuerpo = new THREE.SkinnedMesh(geometria, materialCuerpo);
  cuerpo.name = "iris-cuerpo";
  cuerpo.frustumCulled = false;
  cuerpo.castShadow = true;
  grupo.add(cuerpo);
  grupo.updateMatrixWorld(true);
  const esqueleto=new THREE.Skeleton(HUESOS_IRIS.map((n) => huesos[n]));
  cuerpo.bind(esqueleto);
  let liberado=false;

  // Cara: una malla por expresión, solo una visible.
  const caras = new Map<CaraIris, THREE.Mesh>();
  const soporte = new THREE.Group();
  soporte.position.set(0, yp - y0, zp + 0.008);
  huesos.chasis.add(soporte);
  for (const c of CARAS_IRIS) {
    const malla = new THREE.Mesh(geometriaCara(c), materialCara);
    malla.visible = c === "atenta";
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
    animar(t, o = {}) {
      const vivo = o.quieto ? 0 : 1;
      const v = o.velocidad ?? 0;
      const giro = o.quieto ? 0 : (v * t) / RADIO_RUEDA;
      for (const n of ["ruedaDI", "ruedaDD", "ruedaTI", "ruedaTD"] as const) huesos[n].rotation.x = giro;
      const rodando = Math.min(1, Math.abs(v));
      // Suspensión: rebote corto al rodar, respiración lenta en reposo.
      huesos.chasis.position.y = y0 + (Math.sin(t * 9) * 0.006 * rodando + Math.sin(t * 1.6) * 0.004 * (1 - rodando)) * vivo;
      huesos.chasis.rotation.x = Math.sin(t * 9 + 1) * 0.012 * rodando * vivo;
      huesos.antena.rotation.x = (Math.sin(t * 5) * 0.1 * rodando + Math.sin(t * 2.1) * 0.04) * vivo;
      huesos.antena.rotation.z = Math.sin(t * 1.3) * 0.05 * vivo;
      huesos.panel.rotation.x = -0.1 + Math.sin(t * 0.6) * 0.03 * vivo;
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
      if(liberado)return;liberado=true;esqueleto.dispose();
      geometria.dispose();
      caras.forEach((c) => c.geometry.dispose());
    },
  };
}
