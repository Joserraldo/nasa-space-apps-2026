import * as THREE from "three";
import { construirCabeza, construirGafas, construirPelo, crearCraneo, crearRostro, type Expresion, type Rostro } from "./cabeza.js";
import { FICHAS, type Ficha, type IdPersonaje, type Proporciones } from "./fichas.js";
import { ConstructorMalla, puntoAnillo, type Anillo, type V3 } from "./malla.js";

/**
 * Tripulante completo: una malla con esqueleto (cuerpo, cabeza, pelo y equipo en una sola
 * llamada de dibujo), el casco translúcido y el rostro de la expresión activa.
 */

export const HUESOS = [
  "pelvis",
  "torso",
  "cabeza",
  "brazoI",
  "antebrazoI",
  "manoI",
  "brazoD",
  "antebrazoD",
  "manoD",
  "musloI",
  "espinillaI",
  "pieI",
  "musloD",
  "espinillaD",
  "pieD",
  "tableta",
  "llave",
  "catalejo",
] as const;
export type NombreHueso = (typeof HUESOS)[number];
const H = Object.fromEntries(HUESOS.map((n, i) => [n, i])) as Record<NombreHueso, number>;

export interface Personaje {
  id: IdPersonaje;
  grupo: THREE.Group;
  huesos: Record<NombreHueso, THREE.Bone>;
  rostro: Rostro;
  altura: number;
  proporciones: Proporciones;
  /** Altura de la pelvis en reposo, en fracción de altura: base para agacharse o rebotar al caminar. */
  reposoPelvis: number;
  expresion(e: Expresion): void;
  liberar(): void;
}

const espejoX = (p: V3): V3 => [-p[0], p[1], p[2]];
const espejoAnillo = (a: Anillo): Anillo => ({ ...a, cx: -(a.cx ?? 0) });
const mezcla = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mas = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Cara frontal del torso a la altura `y`: dónde apoyar la luz del pecho y los emblemas. */
function frenteTorso(torso: Anillo[], y: number, segmentos: number): number {
  for (let i = 1; i < torso.length; i++) {
    if (y <= torso[i]!.y) {
      const a = torso[i - 1]!;
      const b = torso[i]!;
      const k = (y - a.y) / (b.y - a.y);
      const za = puntoAnillo(a, Math.PI / segmentos)[2];
      const zb = puntoAnillo(b, Math.PI / segmentos)[2];
      return za + (zb - za) * k;
    }
  }
  return puntoAnillo(torso[torso.length - 1]!, Math.PI / segmentos)[2];
}

function construirCuerpo(m: ConstructorMalla, f: Ficha): void {
  const p = f.proporciones;
  const c = f.paleta;
  const SEG = 8;

  // Tronco: pelvis, cinturón y torso son una columna continua de secciones, no cajas apiladas.
  m.columna(p.pelvis, SEG, c.traje, H.pelvis);
  if (p.cinturon && c.cinturon !== undefined) {
    // Cinturón fino: misma sección, comprimida a la franja central.
    const aros = f.cinturonFino
      ? p.cinturon.map((a, i) => ({ ...a, y: p.cinturon![1]!.y + (i - 1) * 0.014, rx: a.rx * 0.99 }))
      : p.cinturon;
    if (f.cinturonFino) m.columna([p.pelvis[p.pelvis.length - 1]!, p.torso[0]!], SEG, c.traje, H.pelvis);
    m.columna(aros, SEG, c.cinturon, H.pelvis);
  }
  m.columna(p.torso, SEG, c.traje, H.torso, { colorBanda: (i) => (i === 0 ? c.trajeSombra : undefined) });

  // Collar del casco.
  m.loft(
    p.collar.map((a) => {
      const pts: V3[] = [];
      for (let i = 0; i < 12; i++) {
        const t = ((i + 0.5) / 12) * 2 * Math.PI;
        pts.push([Math.sin(t) * a.r, a.y, Math.cos(t) * a.r]);
      }
      return pts;
    }),
    c.collar,
    H.torso,
  );

  // Cuello.
  m.tubo(
    [
      { p: [0, p.cuello.y0, 0], rx: p.cuello.r * 1.15, rz: p.cuello.r * 1.15 },
      { p: [0, p.cuello.y1, 0], rx: p.cuello.r, rz: p.cuello.r },
    ],
    6,
    c.pielSombra,
    H.cabeza,
    { n: 2 },
  );

  // Luz del pecho.
  const zLuz = frenteTorso(p.torso, p.luz.y, SEG);
  m.disco([0, p.luz.y, zLuz + 0.003], p.luz.r, p.luz.r, 8, 0xf7fbfb, H.torso, 1, Math.PI / 8);
  m.disco([0, p.luz.y, zLuz + 0.006], p.luz.r * 0.68, p.luz.r * 0.68, 8, 0x8fe6ee, H.torso, 1, Math.PI / 8);

  // Mochila con su panel.
  const mo = p.mochila;
  m.caja(mo.c, mo.medio, c.mochila, H.torso, 0.3);
  m.disco([mo.c[0], mo.c[1] + mo.medio[1] * 0.05, mo.c[2] - mo.medio[2] - 0.002], mo.medio[0] * 0.5, mo.medio[1] * 0.42, 4, c.panelMochila, H.torso, -1, Math.PI / 4);
  // Familia de traje (lámina 00): cápsulas laterales del color de acento y dos correas arriba.
  for (const s of [1, -1]) {
    m.caja([mo.c[0] + s * mo.medio[0] * 1.08, mo.c[1] - mo.medio[1] * 0.08, mo.c[2]], [mo.medio[0] * 0.2, mo.medio[1] * 0.56, mo.medio[2] * 0.62], c.panelMochila, H.torso, 0.35);
    m.caja([mo.c[0] + s * mo.medio[0] * 0.5, mo.c[1] + mo.medio[1] + mo.medio[2] * 0.12, mo.c[2] + mo.medio[2] * 0.25], [mo.medio[0] * 0.16, mo.medio[2] * 0.2, mo.medio[2] * 0.6], 0x7b6396, H.torso, 0.3);
  }

  // Brazos y piernas, espejados: un par izquierda/derecha es una reflexión, nunca una rotación.
  for (const s of [1, -1] as const) {
    const lado = s === 1 ? "I" : "D";
    const pos = (v: V3): V3 => (s === 1 ? v : espejoX(v));
    const hombro = pos(p.hombro);
    const codo = pos(p.codo);
    const muneca = pos(p.muneca);
    const [r0, r1, r2] = p.radioBrazo;
    const hBrazo = H[`brazo${lado}`];
    const hAnte = H[`antebrazo${lado}`];
    const hMano = H[`mano${lado}`];

    m.tubo(
      [
        { p: mas(hombro, [0, r0 * 0.5, 0]), rx: r0 * 0.9, rz: r0 },
        { p: mezcla(hombro, codo, 0.45), rx: r0 * 0.97, rz: r0 * 1.02 },
        { p: codo, rx: r1, rz: r1 * 1.04 },
      ],
      6,
      c.traje,
      hBrazo,
    );
    m.tubo(
      [
        { p: mezcla(codo, muneca, 0.05), rx: r1 * 0.98, rz: r1 },
        { p: mezcla(codo, muneca, 0.5), rx: r1 * 0.98, rz: r1 * 1.02 },
        { p: muneca, rx: r2, rz: r2 * 1.04 },
      ],
      6,
      c.traje,
      hAnte,
    );

    // Guante tipo manopla con pulgar, con puño marfil (lámina 00).
    const g = p.mano;
    m.tubo(
      [
        { p: mas(muneca, [0, g.largo * 0.3, 0]), rx: g.rx * 1.2, rz: g.rz * 1.08 },
        { p: mas(muneca, [0, g.largo * 0.1, 0]), rx: g.rx * 1.2, rz: g.rz * 1.08 },
      ],
      6,
      c.equipo,
      H[`antebrazo${lado}`],
      { n: 3 },
    );
    const abajo = (k: number): V3 => mas(muneca, [s * g.largo * 0.08 * k, -g.largo * k, g.largo * 0.06 * k]);
    m.tubo(
      [
        { p: mas(muneca, [0, g.largo * 0.16, 0]), rx: g.rx * 1.12, rz: g.rz * 1.02 },
        { p: abajo(0.12), rx: g.rx * 1.12, rz: g.rz * 1.02 },
        { p: abajo(0.2), rx: g.rx * 0.94, rz: g.rz * 0.9 },
        { p: abajo(0.6), rx: g.rx, rz: g.rz },
        { p: abajo(0.92), rx: g.rx * 0.82, rz: g.rz * 0.84 },
        { p: abajo(1), rx: g.rx * 0.5, rz: g.rz * 0.56 },
      ],
      6,
      c.guante,
      hMano,
      { n: 3 },
    );
    m.tubo(
      [
        { p: mas(abajo(0.3), [-s * g.rx * 0.2, 0, g.rz * 0.7]), rx: g.rx * 0.36, rz: g.rx * 0.36 },
        { p: mas(abajo(0.62), [-s * g.rx * 0.5, 0, g.rz * 1.25]), rx: g.rx * 0.3, rz: g.rx * 0.3 },
      ],
      5,
      c.guante,
      hMano,
    );

    // Hombrera.
    if (f.hombreras && p.hombrera.alto > 0) {
      const hb = p.hombrera;
      const cx = hombro[0] + s * hb.rx * 0.3;
      const y0 = hombro[1] - hb.alto * 0.7;
      m.columna(
        [
          { y: y0, cx, rx: hb.rx * 1.02, rz: hb.rz, n: 3 },
          { y: y0 + hb.alto * 0.6, cx, rx: hb.rx, rz: hb.rz, n: 3 },
          { y: y0 + hb.alto, cx: cx - s * hb.rx * 0.3, rx: hb.rx * 0.6, rz: hb.rz * 0.78, n: 3 },
        ],
        6,
        c.panelMochila,
        hBrazo,
      );
    }

    // Pierna.
    const an = (a: Anillo): Anillo => (s === 1 ? a : espejoAnillo(a));
    m.columna(p.muslo.map(an), SEG, c.traje, H[`muslo${lado}`]);
    if (p.rodilla.length) m.columna(p.rodilla.map(an), SEG, c.trajeSombra, H[`espinilla${lado}`]);
    m.columna(p.espinilla.map(an), SEG, c.traje, H[`espinilla${lado}`]);
    const ultimaBanda = p.bota.length - 2;
    m.columna(p.bota.map(an), SEG, c.bota, H[`pie${lado}`], { colorBanda: (i) => (i === ultimaBanda ? c.suela : undefined) });
  }

  construirEquipo(m, f, zLuz);
}

function construirEquipo(m: ConstructorMalla, f: Ficha, zPecho: number): void {
  const p = f.proporciones;
  const c = f.paleta;

  // Antena: auricular, varilla y bola, a la derecha del personaje.
  const a = p.antena;
  const u = p.craneo.alto;
  m.caja([a.x, a.yCaja, a.z], [u * 0.07, u * 0.12, u * 0.07], c.equipo, H.cabeza, 0.3);
  m.tubo(
    [
      { p: [a.x, a.yCaja + u * 0.1, a.z], rx: u * 0.022, rz: u * 0.022 },
      { p: [a.x, a.yBola, a.z], rx: u * 0.018, rz: u * 0.018 },
    ],
    5,
    c.equipo,
    H.cabeza,
    { n: 2 },
  );
  m.bola([a.x, a.yBola + u * 0.03, a.z], [u * 0.075, u * 0.075, u * 0.075], 1, 0xfbeee6, H.cabeza);

  if (f.emblema === "herramienta") {
    // Llave en Y bajo la luz del pecho.
    const y = p.luz.y - 0.062;
    const z = zPecho + 0.004;
    const tira = (x0: number, y0: number, x1: number, y1: number, g: number) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const l = Math.hypot(dx, dy);
      const nx = (-dy / l) * g;
      const ny = (dx / l) * g;
      m.cuad([x0 - nx, y0 - ny, z], [x1 - nx, y1 - ny, z], [x1 + nx, y1 + ny, z], [x0 + nx, y0 + ny, z], c.panelMochila, H.torso, [0, y, z - 1]);
    };
    tira(-0.004, y - 0.024, -0.004, y, 0.006);
    tira(-0.004, y - 0.002, -0.022, y + 0.018, 0.006);
    tira(-0.004, y - 0.002, 0.014, y + 0.018, 0.006);
  }
  if (f.emblema === "sol") {
    const x = 0.05;
    const y = p.luz.y;
    const z = frenteAprox(zPecho, x);
    // Sol con ocho rayos.
    for (let i = 0; i < 8; i++) {
      const t = (i * Math.PI) / 4;
      const u = t + Math.PI / 2;
      m.tri(
        [x + Math.cos(t) * 0.036, y + Math.sin(t) * 0.036, z + 0.004],
        [x + Math.cos(t) * 0.02 + Math.cos(u) * 0.008, y + Math.sin(t) * 0.02 + Math.sin(u) * 0.008, z + 0.004],
        [x + Math.cos(t) * 0.02 - Math.cos(u) * 0.008, y + Math.sin(t) * 0.02 - Math.sin(u) * 0.008, z + 0.004],
        0xf2a93b,
        H.torso,
        [x, y, z - 1],
      );
    }
    m.disco([x, y, z + 0.006], 0.021, 0.021, 8, 0xffc94a, H.torso, 1, Math.PI / 8);
  }

  if (p.cinturon) {
    // Todos llevan cinturón con un bolsillo del color de acento y hebilla gris; la Ingeniera suma un segundo bolsillo.
    const aro = p.cinturon[1]!;
    const k = aro.rx / 0.098;
    const y = aro.y;
    const zc = puntoAnillo(aro, Math.PI / 8)[2];
    m.caja([-0.052 * k, y - 0.006 * k, zc + 0.014 * k], [0.03 * k, 0.03 * k, 0.018 * k], c.panelMochila, H.pelvis, 0.3);
    m.caja([0.018 * k, y, zc + 0.006 * k], [0.02 * k, 0.015 * k, 0.008 * k], 0x9b8f9a, H.pelvis, 0.3);
    if (f.rinoneras) m.caja([-aro.rx - 0.008, y - 0.004, 0.006], [0.018, 0.032, 0.032], c.panelMochila, H.pelvis, 0.3);
  }

  if (f.bolso) {
    // Bandolera: del hombro izquierdo a la cadera derecha, por delante y por detrás.
    const t = p.torso;
    const zf = (y: number) => frenteTorso(t, y, 8) + 0.006;
    const banda = (z: (y: number) => number, signo: 1 | -1) => {
      const pts: V3[] = [];
      for (let i = 0; i <= 5; i++) {
        const k = i / 5;
        const y = 0.705 - k * 0.2;
        pts.push([0.085 - k * 0.185, y, signo * z(y)]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const q0 = pts[i]!;
        const q1 = pts[i + 1]!;
        m.cuad(
          [q0[0]! - 0.015, q0[1]! + 0.014, q0[2]!],
          [q1[0]! - 0.015, q1[1]! + 0.014, q1[2]!],
          [q1[0]! + 0.015, q1[1]! - 0.014, q1[2]!],
          [q0[0]! + 0.015, q0[1]! - 0.014, q0[2]!],
          c.panelMochila,
          H.torso,
          [0, q0[1]!, 0],
        );
      }
    };
    banda(zf, 1);
    banda((y) => zf(y) * 0.92, -1);
    const cb: V3 = [-0.094, 0.44, zf(0.53) + 0.016];
    m.caja(cb, [0.04, 0.044, 0.022], c.panelMochila, H.pelvis, 0.3);
    // Escudo marfil sobre la solapa.
    const z = cb[2] + 0.024;
    const esc: V3[] = [
      [cb[0] - 0.02, cb[1] + 0.022, z],
      [cb[0] + 0.02, cb[1] + 0.022, z],
      [cb[0] + 0.02, cb[1] - 0.004, z],
      [cb[0], cb[1] - 0.026, z],
      [cb[0] - 0.02, cb[1] - 0.004, z],
    ];
    for (let i = 1; i < esc.length - 1; i++) m.tri(esc[0]!, esc[i]!, esc[i + 1]!, 0xf6e6dc, H.pelvis, [cb[0], cb[1], z - 1]);
  }
}

/** El pecho se curva hacia los costados: retrasa un poco lo que no va en el centro. */
const frenteAprox = (zCentro: number, x: number) => zCentro - Math.abs(x) * 0.06;

const materialCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0 });
// El tinte lila va solo en la mitad de atrás del casco (es el fondo de la cabeza): por delante no hay
// malla, así la cara y el pelo no se lavan y el casco cuesta una sola llamada de dibujo.
const materialCasco = new THREE.MeshStandardMaterial({
  color: 0xd3aeea,
  transparent: true,
  opacity: 0.58,
  roughness: 0.7,
  metalness: 0,
  flatShading: true,
  depthWrite: false,
  side: THREE.BackSide,
});

export function crearPersonaje(id: IdPersonaje): Personaje {
  const f = FICHAS[id];
  const p = f.proporciones;
  const m = new ConstructorMalla();

  construirCuerpo(m, f);

  const craneo = crearCraneo(p.craneo.ancho, p.craneo.mejillas);
  const u = p.craneo.alto;
  const aMundo = (q: V3): V3 => [q[0] * u, p.craneo.y + q[1] * u, q[2] * u];
  construirCabeza(m, f, craneo, aMundo, H.cabeza);
  // Equipo de mano: huesos propios para mostrarlo por gesto sin nuevas llamadas de dibujo.
  const c=f.paleta;
  const mano=espejoX(p.muneca);
  const cajaEquipo=(c:V3,r:V3,color:number,h:number)=>m.loft([-1,1].map(z=>[
    [c[0]-r[0],c[1]-r[1],c[2]+z*r[2]], [c[0]+r[0],c[1]-r[1],c[2]+z*r[2]],
    [c[0]+r[0],c[1]+r[1],c[2]+z*r[2]], [c[0]-r[0],c[1]+r[1],c[2]+z*r[2]],
  ] as V3[]),color,h);
  cajaEquipo([mano[0],mano[1]+0.025,mano[2]+0.038],[0.045,0.055,0.007],c.equipo,H.tableta);
  cajaEquipo([mano[0],mano[1]+0.025,mano[2]+0.046],[0.037,0.047,0.001],0x30255f,H.tableta);
  if(id==="ingeniera") {
    cajaEquipo([mano[0],mano[1]+0.025,mano[2]+0.03],[0.008,0.05,0.007],c.panelMochila,H.llave);
    for(const x of [-0.014,0.014])cajaEquipo([mano[0]+x,mano[1]+0.075,mano[2]+0.03],[0.008,0.022,0.007],c.panelMochila,H.llave);
  }
  if(id==="meteorologa") {
    cajaEquipo([mano[0],mano[1],mano[2]+0.07],[0.018,0.018,0.075],c.equipo,H.catalejo);
    m.disco([mano[0],mano[1],mano[2]+0.147],0.016,0.016,8,0x73d4e1,H.catalejo);
  }
  // El pelo lleva más contraste entre facetas: es lo que le da lectura de mechones tallados.
  m.variacion = 0.2;
  construirPelo(m, f, craneo, aMundo, H.cabeza);
  m.variacion = 0.035;
  if (f.gafas) construirGafas(m, f, craneo, aMundo, H.cabeza);

  // Esqueleto en pose de reposo (brazos en A). Las posiciones son las articulaciones medidas.
  const articulacion: Record<NombreHueso, V3> = {
    pelvis: [0, p.cadera[1] + 0.03, 0],
    torso: [0, p.torso[0]!.y, 0],
    cabeza: [0, p.cuello.y0 + 0.01, 0],
    brazoI: p.hombro,
    antebrazoI: p.codo,
    manoI: p.muneca,
    brazoD: espejoX(p.hombro),
    antebrazoD: espejoX(p.codo),
    manoD: espejoX(p.muneca),
    musloI: p.cadera,
    espinillaI: p.articulacionRodilla,
    pieI: p.tobillo,
    musloD: espejoX(p.cadera),
    espinillaD: espejoX(p.articulacionRodilla),
    pieD: espejoX(p.tobillo),
    tableta: espejoX(p.muneca),
    llave: espejoX(p.muneca),
    catalejo: espejoX(p.muneca),
  };
  const padre: Partial<Record<NombreHueso, NombreHueso>> = {
    torso: "pelvis",
    cabeza: "torso",
    brazoI: "torso",
    antebrazoI: "brazoI",
    manoI: "antebrazoI",
    brazoD: "torso",
    antebrazoD: "brazoD",
    manoD: "antebrazoD",
    musloI: "pelvis",
    espinillaI: "musloI",
    pieI: "espinillaI",
    musloD: "pelvis",
    espinillaD: "musloD",
    pieD: "espinillaD",
    tableta: "manoD",
    llave: "manoD",
    catalejo: "manoD",
  };
  const huesos = {} as Record<NombreHueso, THREE.Bone>;
  for (const n of HUESOS) {
    const b = new THREE.Bone();
    b.name = n;
    huesos[n] = b;
  }
  for (const n of HUESOS) {
    const pa = padre[n];
    const a = articulacion[n];
    if (pa) {
      const o = articulacion[pa];
      huesos[n].position.set(a[0] - o[0], a[1] - o[1], a[2] - o[2]);
      huesos[pa].add(huesos[n]);
    } else {
      huesos[n].position.set(a[0], a[1], a[2]);
    }
  }

  const escala = new THREE.Group();
  escala.scale.setScalar(f.altura);
  escala.add(huesos.pelvis);
  const grupo = new THREE.Group();
  grupo.name = `personaje-${id}`;
  grupo.add(escala);
  grupo.updateMatrixWorld(true);

  const geometria = m.geometria(true);
  const cuerpo = new THREE.SkinnedMesh(geometria, materialCuerpo);
  cuerpo.name = "cuerpo";
  cuerpo.frustumCulled = false;
  cuerpo.castShadow = true;
  cuerpo.receiveShadow = true;
  escala.add(cuerpo);
  grupo.updateMatrixWorld(true);
  const esqueleto=new THREE.Skeleton(HUESOS.map((n) => huesos[n]));
  cuerpo.bind(esqueleto);
  for(const n of ["tableta","llave","catalejo"] as const)huesos[n].scale.setScalar(0);
  let liberado=false;

  // Casco: fijo al torso, para que la cabeza pueda girar dentro.
  const gCasco = new THREE.IcosahedronGeometry(1, 1);
  const casco = new THREE.Mesh(gCasco, materialCasco);
  casco.name = "casco";
  casco.renderOrder = 1;
  casco.scale.set(p.casco.rx, p.casco.ry, p.casco.rz);
  casco.position.set(0, p.casco.y - articulacion.torso[1], 0);
  huesos.torso.add(casco);

  const rostro = crearRostro(f, craneo);
  rostro.grupo.scale.setScalar(u);
  rostro.grupo.position.set(0, p.craneo.y - articulacion.cabeza[1], 0);
  huesos.cabeza.add(rostro.grupo);

  return {
    id,
    grupo,
    huesos,
    rostro,
    altura: f.altura,
    proporciones: p,
    reposoPelvis: huesos.pelvis.position.y,
    expresion: (e) => rostro.expresion(e),
    liberar() {
      if(liberado)return;liberado=true;esqueleto.dispose();
      geometria.dispose();
      gCasco.dispose();
      rostro.grupo.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    },
  };
}
