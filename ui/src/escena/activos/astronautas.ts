/**
 * El niño astronauta (láminas `personajes/08` proporciones y poses, `09` rostros, `10` luz).
 * Proporción infantil propia: casco grande con vidrio lila, cabeza ancha facetada, traje marfil,
 * cuello y guantes teal, botas índigo, luz cian en el pecho, mochila y antena con bola en el casco.
 *
 * Una malla rígida con huesos (`rigido.ts`): 3 draw calls (cuerpo, rostro, vidrio del casco).
 * Pivotes: `Astronauta > Rig > Huesos > Cadera > (Torso > Cabeza, Hombro_D/I, Tableta) y
 * (Muslo_D/I > Rodilla_D/I)`. Mira hacia +Z; "derecho" es el lado −X del niño.
 * Gestos de `personajes/08`: idle, walk, wave, inspect (con tableta), kneel, talk.
 * Rostros de `personajes/09`: neutral, happy, curious, concerned, talk closed/open/round y blink.
 * Movimiento reducido: posturas fijas, sin balanceo, sin parpadeo ni boca animada.
 */
import * as THREE from "three";

import { COLORES } from "../../estilos/tokens";
import { geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, tronco } from "./piezasComunes";
import { hueso, mallaRigida, materialFacetado, type Pieza } from "./rigido";

export type GestoAstronauta = "idle" | "walk" | "wave" | "inspect" | "kneel" | "talk";
export type ExpresionAstronauta = "neutral" | "happy" | "curious" | "concerned";
export type Boca = "sonrisa" | "feliz" | "o" | "preocupada" | "abierta" | "redonda";

export interface Rostro {
  expresion: ExpresionAstronauta;
  boca: Boca;
  parpadeo: boolean;
}

export interface OpcionesAnimarAstronauta {
  /** Velocidad de avance en m/s: por encima de 0,05 camina aunque el gesto sea idle. */
  velocidad: number;
  movimientoReducido: boolean;
}

export interface ModeloAstronauta {
  raiz: THREE.Group;
  pivotes: {
    rig: THREE.Group;
    cadera: THREE.Bone;
    torso: THREE.Bone;
    cabeza: THREE.Bone;
    hombros: readonly [THREE.Bone, THREE.Bone];
    muslos: readonly [THREE.Bone, THREE.Bone];
    rodillas: readonly [THREE.Bone, THREE.Bone];
    tableta: THREE.Bone;
  };
  fijarGesto(gesto: GestoAstronauta): void;
  fijarExpresion(expresion: ExpresionAstronauta): void;
  animar(dt: number, opciones: OpcionesAnimarAstronauta): void;
  /** Gesto que se ve (walk si se mueve). */
  gesto(): GestoAstronauta;
  rostro(): Rostro;
  /** Libera lo propio, incluida la textura de huesos que `liberarEscena` no ve. */
  liberar(): void;
}

export interface LienzoRostro {
  width: number;
  height: number;
  getContext(tipo: "2d"): ContextoRostro | null;
}

export type ContextoRostro = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "strokeStyle" | "lineWidth" | "lineCap" | "clearRect" | "beginPath" | "moveTo" | "lineTo" | "arc" | "ellipse" | "stroke" | "fill" | "closePath"
>;

export interface OpcionesAstronauta {
  /** Fábrica del lienzo del rostro. Por defecto un `<canvas>` si hay `document`; si no, sin rostro. */
  lienzo?: () => LienzoRostro | null;
}

export const ANCHO_ROSTRO = 128;
export const ALTO_ROSTRO = 96;

const BOCA_DE: Readonly<Record<ExpresionAstronauta, Boca>> = { neutral: "sonrisa", happy: "feliz", curious: "o", concerned: "preocupada" };
/** Ciclo de la boca al hablar (`talk / closed`, `open`, `round`). */
const CICLO_HABLA: readonly Boca[] = ["sonrisa", "abierta", "redonda", "abierta"];

/** Rostro que corresponde al gesto, la expresión y el tiempo. Pura. */
export function rostroDe(gesto: GestoAstronauta, expresion: ExpresionAstronauta, t: number, movimientoReducido: boolean): Rostro {
  const parpadeo = !movimientoReducido && t % 3.7 < 0.12;
  const boca = gesto === "talk" && !movimientoReducido ? CICLO_HABLA[Math.floor(t / 0.16) % CICLO_HABLA.length]! : BOCA_DE[expresion];
  return { expresion, boca, parpadeo };
}

/** Dibuja ojos, cejas y boca sobre fondo transparente (la piel es la malla de la cabeza). */
export function dibujarRostro(ctx: ContextoRostro, r: Rostro): void {
  ctx.clearRect(0, 0, ANCHO_ROSTRO, ALTO_ROSTRO);
  ctx.lineCap = "round";
  const ojos = [42, 86] as const;
  // Cejas: rectas; preocupada sube el lado de adentro; curiosa levanta una.
  ctx.strokeStyle = COLORES["cabello-nino"];
  ctx.lineWidth = 6;
  for (const [i, x] of ojos.entries()) {
    const adentro = i === 0 ? 1 : -1;
    const alzaAdentro = r.expresion === "concerned" ? -6 : 0;
    const alza = r.expresion === "curious" && i === 1 ? -5 : r.expresion === "happy" ? -2 : 0;
    ctx.beginPath();
    ctx.moveTo(x - 10 * adentro, 22 + alza);
    ctx.lineTo(x + 10 * adentro, 22 + alza + alzaAdentro);
    ctx.stroke();
  }
  // Ojos: óvalos oscuros; parpadeo = arco cerrado.
  ctx.fillStyle = COLORES.espacio;
  ctx.strokeStyle = COLORES.espacio;
  for (const x of ojos) {
    ctx.beginPath();
    if (r.parpadeo) {
      ctx.lineWidth = 4;
      ctx.arc(x, 40, 8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.ellipse(x, 44, 7, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Boca.
  const y = 72;
  ctx.fillStyle = COLORES.ciruela;
  ctx.strokeStyle = COLORES.ciruela;
  ctx.lineWidth = 4;
  ctx.beginPath();
  switch (r.boca) {
    case "sonrisa":
      ctx.arc(64, y - 6, 9, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      return;
    case "feliz":
    case "abierta": {
      const ancho = r.boca === "feliz" ? 12 : 9;
      ctx.moveTo(64 - ancho, y - 2);
      ctx.lineTo(64 + ancho, y - 2);
      ctx.arc(64, y - 2, ancho, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case "o":
    case "redonda":
      ctx.ellipse(64, y, r.boca === "o" ? 4 : 6, r.boca === "o" ? 5 : 7, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    case "preocupada":
      ctx.ellipse(64, y + 1, 7, 4, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      return;
  }
}

/** Postura de cada gesto: rotaciones (rad) de los pivotes y bajada de la cadera (m). */
interface Postura {
  caderaY: number; torsoX: number; cabezaX: number; cabezaZ: number;
  hombroDx: number; hombroDz: number; hombroIx: number; hombroIz: number;
  musloDx: number; musloIx: number; rodillaDx: number; rodillaIx: number;
  tableta: number;
}
const REPOSO: Postura = {
  caderaY: 0, torsoX: 0, cabezaX: 0, cabezaZ: 0,
  hombroDx: 0, hombroDz: -0.12, hombroIx: 0, hombroIz: 0.12,
  musloDx: 0, musloIx: 0, rodillaDx: 0, rodillaIx: 0, tableta: 0,
};

/** Postura del gesto en el tiempo `t`; `vivo` = 0 apaga toda oscilación (movimiento reducido). */
export function posturaDe(gesto: GestoAstronauta, t: number, vivo: 0 | 1): Postura {
  const s = (f: number) => vivo * Math.sin(t * f);
  const p = { ...REPOSO, caderaY: 0.004 * s(2.4) };
  switch (gesto) {
    case "idle":
      return p;
    case "walk": {
      const paso = s(8);
      return {
        ...p, caderaY: 0.012 * Math.abs(paso), torsoX: 0.05,
        musloDx: 0.5 * paso, musloIx: -0.5 * paso,
        rodillaDx: 0.6 * Math.max(0, -paso), rodillaIx: 0.6 * Math.max(0, paso),
        hombroDx: -0.4 * paso, hombroIx: 0.4 * paso,
      };
    }
    case "wave":
      return { ...p, cabezaZ: -0.08, hombroIz: 2.5 + 0.25 * s(8), hombroIx: -0.2 };
    case "inspect":
      return { ...p, cabezaX: 0.32, hombroDx: -1.1, hombroDz: 0.28, hombroIx: -1.1, hombroIz: -0.28, tableta: 1 };
    case "kneel":
      return {
        ...p, caderaY: -0.14, torsoX: 0.22, cabezaX: 0.15,
        musloIx: -1.45, rodillaIx: 1.45, musloDx: 0.15, rodillaDx: 1.5,
        hombroIx: -0.9 + 0.05 * s(2), hombroIz: 0.1, hombroDx: -0.2,
      };
    case "talk":
      return { ...p, cabezaZ: 0.04 * s(1.5), hombroIx: -0.6, hombroIz: 0.55 + 0.1 * s(3) };
  }
}

function lienzoPorDefecto(): LienzoRostro | null {
  if (typeof document === "undefined") return null;
  return document.createElement("canvas") as unknown as LienzoRostro;
}

const icosa = (r: number, d: number) => geometriaBase(`astronauta-icosa-${r}-${d}`, () => new THREE.IcosahedronGeometry(r, d));

export function crearAstronauta(m: Materiales, opciones: OpcionesAstronauta = {}): ModeloAstronauta {
  // --- Huesos (posiciones de la pose de reposo, relativas al padre).
  const huesos = hueso("Huesos", [0, 0, 0]);
  const cadera = hueso("Cadera", [0, 0.29, 0], huesos);
  const torso = hueso("Torso", [0, 0.05, 0], cadera);
  const cabeza = hueso("Cabeza", [0, 0.2, 0], torso);
  const hombroD = hueso("Hombro_D", [-0.165, 0.17, 0], torso);
  const hombroI = hueso("Hombro_I", [0.165, 0.17, 0], torso);
  const tableta = hueso("Tableta", [0, 0.06, 0.18], torso);
  const musloD = hueso("Muslo_D", [-0.065, -0.02, 0], cadera);
  const musloI = hueso("Muslo_I", [0.065, -0.02, 0], cadera);
  const rodillaD = hueso("Rodilla_D", [0, -0.11, 0], musloD);
  const rodillaI = hueso("Rodilla_I", [0, -0.11, 0], musloI);

  // --- Piezas en el espacio del niño (y = 0 en el suelo). Alto total ≈ 1 m con el casco.
  const piezas: Pieza[] = [];
  for (const [s, muslo, rodilla, hombro] of [[-1, musloD, rodillaD, hombroD], [1, musloI, rodillaI, hombroI]] as const) {
    const x = s * 0.065;
    piezas.push(
      { geo: caja(0.1, 0.1, 0.11), color: "traje-marfil", hueso: muslo, pos: [x, 0.205, 0] },
      { geo: caja(0.095, 0.08, 0.1), color: "traje-marfil", hueso: rodilla, pos: [x, 0.115, 0] },
      { geo: chaflan(0.11, 0.08, 0.15, 0.025), color: "indigo-botas", hueso: rodilla, pos: [x, 0.04, 0.015] },
      { geo: caja(0.09, 0.17, 0.095), color: "traje-marfil", hueso: hombro, pos: [s * 0.188, 0.43, 0] },
      { geo: chaflan(0.095, 0.085, 0.095, 0.02), color: "teal", hueso: hombro, pos: [s * 0.192, 0.31, 0.01] },
      { geo: caja(0.03, 0.065, 0.05), color: "piel-nino", hueso: cabeza, pos: [s * 0.16, 0.7, 0] },
    );
  }
  piezas.push(
    { geo: caja(0.24, 0.08, 0.16), color: "traje-marfil", hueso: cadera, pos: [0, 0.28, 0] },
    { geo: chaflan(0.3, 0.22, 0.18, 0.05), color: "traje-marfil", hueso: torso, pos: [0, 0.43, 0] },
    { geo: chaflan(0.22, 0.2, 0.08, 0.03), color: "traje-marfil", hueso: torso, pos: [0, 0.45, -0.13] },
    { geo: tronco(0.145, 0.155, 0.045, 10), color: "teal", hueso: torso, pos: [0, 0.555, 0] },
    // Luz del pecho: aro teal y centro cian.
    { geo: tronco(0.034, 0.034, 0.02, 8), color: "teal", hueso: torso, pos: [0, 0.45, 0.093], rot: [Math.PI / 2, 0, 0] },
    { geo: tronco(0.024, 0.024, 0.02, 8), color: "cian", hueso: torso, pos: [0, 0.45, 0.098], rot: [Math.PI / 2, 0, 0] },
    // Tableta de `inspect` (escala 0 fuera del gesto): marco ciruela, pantalla índigo y Sol ámbar.
    { geo: chaflan(0.17, 0.12, 0.015, 0.02), color: "ciruela", hueso: tableta, pos: [0, 0.4, 0.18] },
    { geo: caja(0.13, 0.085, 0.01), color: "indigo-botas", hueso: tableta, pos: [0, 0.4, 0.19] },
    { geo: icosa(0.018, 0), color: "ambar", hueso: tableta, pos: [0, 0.4, 0.196] },
    // Cabeza ancha facetada, cuello, pelo (masa arriba y atrás) y antena del casco.
    { geo: tronco(0.06, 0.06, 0.05, 6), color: "piel-nino", hueso: cabeza, pos: [0, 0.57, 0] },
    { geo: chaflan(0.3, 0.25, 0.25, 0.06), color: "piel-nino", hueso: cabeza, pos: [0, 0.71, 0.005] },
    { geo: icosa(0.19, 1), color: "cabello-nino", hueso: cabeza, pos: [0, 0.81, -0.02], esc: [1, 0.66, 0.95] },
    { geo: caja(0.3, 0.17, 0.09), color: "cabello-nino", hueso: cabeza, pos: [0, 0.74, -0.095] },
    { geo: caja(0.035, 0.07, 0.05), color: "traje-marfil", hueso: cabeza, pos: [-0.2, 0.72, 0] },
    { geo: tronco(0.01, 0.01, 0.1, 6), color: "traje-marfil", hueso: cabeza, pos: [-0.2, 0.8, 0] },
    { geo: icosa(0.028, 0), color: "traje-marfil", hueso: cabeza, pos: [-0.2, 0.86, 0] },
  );
  const rig = new THREE.Group();
  rig.name = "Rig";
  const material = materialFacetado("AstronautaFacetado");
  const malla = mallaRigida("AstronautaCuerpo", rig, huesos, piezas, material);

  // --- Vidrio del casco (slot Glass compartido), hijo de la cabeza.
  const casco = new THREE.Mesh(icosa(0.27, 1), m.Glass);
  casco.name = "Casco";
  casco.position.set(0, 0.19, 0);
  casco.renderOrder = 1;

  // --- Rostro en lienzo transparente, delante de la cara.
  const lienzo = (opciones.lienzo ?? lienzoPorDefecto)();
  const ctx = lienzo?.getContext("2d") ?? null;
  let textura: THREE.CanvasTexture | null = null;
  let matRostro: THREE.MeshBasicMaterial | null = null;
  if (lienzo && ctx) {
    lienzo.width = ANCHO_ROSTRO;
    lienzo.height = ALTO_ROSTRO;
    textura = new THREE.CanvasTexture(lienzo as unknown as HTMLCanvasElement);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.name = "AstronautaRostro";
    matRostro = new THREE.MeshBasicMaterial({ map: textura, transparent: true, alphaTest: 0.1 });
    matRostro.name = "AstronautaRostro";
    const rostro = new THREE.Mesh(geometriaBase("astronauta-rostro", () => new THREE.PlaneGeometry(0.25, 0.19)), matRostro);
    rostro.name = "Rostro";
    rostro.position.set(0, 0.165, 0.1325);
    cabeza.add(rostro);
  }
  cabeza.add(casco);

  const raiz = new THREE.Group();
  raiz.name = "Astronauta";
  raiz.add(rig);

  let gesto: GestoAstronauta = "idle";
  let expresion: ExpresionAstronauta = "neutral";
  let visto: GestoAstronauta = "idle";
  let t = 0;
  let reducido = true;
  let dibujado = "";

  function redibujar(): void {
    if (!ctx || !textura) return;
    const r = rostroDe(visto, expresion, t, reducido);
    const clave = `${r.expresion}|${r.boca}|${r.parpadeo}`;
    if (clave === dibujado) return; // se re-sube solo si cambió (APLICACION §8)
    dibujado = clave;
    dibujarRostro(ctx, r);
    textura.needsUpdate = true;
  }

  function posar(p: Postura, k: number): void {
    const a = (o: THREE.Euler, eje: "x" | "z", v: number) => { o[eje] += (v - o[eje]) * k; };
    cadera.position.y += (0.29 + p.caderaY - cadera.position.y) * k;
    a(torso.rotation, "x", p.torsoX);
    a(cabeza.rotation, "x", p.cabezaX);
    a(cabeza.rotation, "z", p.cabezaZ);
    a(hombroD.rotation, "x", p.hombroDx);
    a(hombroD.rotation, "z", p.hombroDz);
    a(hombroI.rotation, "x", p.hombroIx);
    a(hombroI.rotation, "z", p.hombroIz);
    a(musloD.rotation, "x", p.musloDx);
    a(musloI.rotation, "x", p.musloIx);
    a(rodillaD.rotation, "x", p.rodillaDx);
    a(rodillaI.rotation, "x", p.rodillaIx);
    const e = tableta.scale.x + (p.tableta - tableta.scale.x) * k;
    tableta.scale.setScalar(Math.max(e, 1e-4));
    tableta.rotation.x = -0.6;
  }

  posar(posturaDe("idle", 0, 0), 1);
  redibujar();

  return {
    raiz,
    pivotes: { rig, cadera, torso, cabeza, hombros: [hombroD, hombroI], muslos: [musloD, musloI], rodillas: [rodillaD, rodillaI], tableta },
    fijarGesto(g) { gesto = g; },
    fijarExpresion(e) { expresion = e; redibujar(); },
    animar(dt, { velocidad, movimientoReducido }) {
      t += dt;
      reducido = movimientoReducido;
      visto = Math.abs(velocidad) > 0.05 && (gesto === "idle" || gesto === "talk") ? "walk" : gesto;
      // Movimiento reducido: va directo a la postura fija; si no, la alcanza suave.
      posar(posturaDe(visto, t, movimientoReducido ? 0 : 1), movimientoReducido ? 1 : 1 - Math.exp(-dt * 12));
      redibujar();
    },
    gesto: () => visto,
    rostro: () => rostroDe(visto, expresion, t, reducido),
    liberar() {
      textura?.dispose();
      matRostro?.dispose();
      material.dispose();
      malla.geometry.dispose();
      malla.skeleton.dispose();
    },
  };
}
