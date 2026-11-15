/**
 * Iris, el rover guía (DISEÑO §4 fila Iris; láminas `mundo/01`, `inicio/02` viñeta 03 y
 * `personajes/07` viñeta 04). Rover solar compacto de 4 ruedas: cuerpo marfil en caja con
 * chaflanes, pantalla frontal oscura con dos ojos cian, panel solar en el techo, antena corta con
 * bola y ruedas oscuras gruesas. No humanoide, no vuela.
 *
 * Mira hacia +Z (como `rumbo` de `guia.ts`): la escena solo mueve `raiz` y llama a `animar`.
 * Árbol de pivotes: `Iris > Rig > Cuerpo > (Antena)` y `Rig > Rueda_0..3` (cada rueda gira en su eje).
 *
 * Niveles de NIVELES §5, visibles en la pantalla y en la postura:
 * - `tutorial`: ojos abiertos y atentos.
 * - `pistas`: ojos tranquilos (arcos).
 * - `danada` (o equipo averiado): cara `error` con interferencia y faro en color de alerta.
 * - `offline`: pantalla apagada y faro apagado (la escena la deja en `DOCK_IRIS`).
 *
 * Presupuesto: 9 mallas (draw calls) y menos de 700 triángulos. Colores solo por tokens.
 */
import * as THREE from "three";
import type { BaseAiLevel } from "@solar-shield/contracts";
import type { GestoIris } from "@solar-shield/agents";

import { colorToken, geometriaBase, type Materiales } from "../materiales";
import { COLORES } from "../../estilos/tokens";
import { fusionar } from "./fusionar";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";

export type { GestoIris };

/** Cara que dibuja la pantalla. */
export type CaraPantalla = "atenta" | "tranquila" | "error" | "apagada";

export interface EstadoIris {
  nivel: BaseAiLevel;
  /** El equipo de la IA de la base está averiado (`VistaEscena.iris.averiada`). */
  averiada: boolean;
}

export interface OpcionesAnimar {
  /** Velocidad de avance en m/s (la de `guia.ts`); hace girar las ruedas. */
  velocidad: number;
  /** `prefers-reduced-motion`: posturas fijas, sin balanceo, parpadeo ni interferencia animada. */
  movimientoReducido: boolean;
}

export interface ModeloIris {
  raiz: THREE.Group;
  pivotes: { rig: THREE.Group; cuerpo: THREE.Group; antena: THREE.Group; ruedas: readonly THREE.Group[] };
  fijarEstado(estado: EstadoIris): void;
  /** Gesto del rover (`GuiaLugar.gesto`); `null` = reposo. */
  fijarGesto(gesto: GestoIris | null): void;
  /** Avanza la animación `dt` segundos. No reconstruye mallas: solo rota pivotes y redibuja la cara si cambió. */
  animar(dt: number, opciones: OpcionesAnimar): void;
  /** Cara que se ve ahora (para tests y accesibilidad de la escena). */
  cara(): CaraPantalla;
  /** Libera lo propio (textura de la pantalla, materiales clonados, geometrías fusionadas). */
  liberar(): void;
}

/** Lienzo mínimo que usa la pantalla (un `HTMLCanvasElement`, un `OffscreenCanvas` o un doble de prueba). */
export interface LienzoCara {
  width: number;
  height: number;
  getContext(tipo: "2d"): ContextoCara | null;
}

/** Subconjunto de `CanvasRenderingContext2D` que usa `dibujarCara`. */
export type ContextoCara = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "strokeStyle" | "lineWidth" | "lineCap" | "fillRect" | "beginPath" | "moveTo" | "lineTo" | "arc" | "stroke" | "fill" | "closePath"
>;

export interface OpcionesIris {
  /** Fábrica del lienzo de la pantalla. Por defecto, un `<canvas>` si hay `document`; si no, pantalla lisa. */
  lienzo?: () => LienzoCara | null;
}

/** Cara según el nivel (NIVELES §5). La avería manda sobre `tutorial` y `pistas`; `offline` apaga todo. */
export function caraIris({ nivel, averiada }: EstadoIris): CaraPantalla {
  if (nivel === "offline") return "apagada";
  if (nivel === "danada" || averiada) return "error";
  return nivel === "tutorial" ? "atenta" : "tranquila";
}

export const ANCHO_CARA = 128;
export const ALTO_CARA = 64;

/**
 * Dibuja la pantalla. `parpadeo` cierra los ojos (línea); `fase` mueve las bandas de interferencia
 * de la cara `error`. Pura respecto del contexto: mismo argumento, mismo dibujo.
 */
export function dibujarCara(ctx: ContextoCara, cara: CaraPantalla, parpadeo: boolean, fase: number): void {
  const w = ANCHO_CARA, h = ALTO_CARA;
  ctx.fillStyle = COLORES.espacio;
  ctx.fillRect(0, 0, w, h);
  if (cara === "apagada") return;
  const ojos = [w * 0.32, w * 0.68];
  const y = h * 0.5;
  ctx.lineCap = "round";
  if (cara === "error") {
    // Interferencia: tres bandas horizontales que se corren con la fase.
    ctx.fillStyle = COLORES["indigo-texto"];
    for (let i = 0; i < 3; i++) ctx.fillRect(0, ((fase * 7 + i * 23) % h), w, 4 + i * 2);
    ctx.strokeStyle = COLORES.error;
    ctx.lineWidth = 7;
    for (const x of ojos) {
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 9);
      ctx.lineTo(x + 9, y + 9);
      ctx.moveTo(x + 9, y - 9);
      ctx.lineTo(x - 9, y + 9);
      ctx.stroke();
    }
    return;
  }
  ctx.strokeStyle = COLORES.cian;
  ctx.fillStyle = COLORES.cian;
  ctx.lineWidth = 7;
  for (const x of ojos) {
    ctx.beginPath();
    if (parpadeo) {
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
    } else if (cara === "tranquila") {
      // Arco hacia arriba: mirada tranquila.
      ctx.arc(x, y + 6, 12, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      // Atenta: ojo alto y redondeado (píldora vertical como `personajes/07`).
      ctx.moveTo(x - 8, y - 12);
      ctx.lineTo(x + 8, y - 12);
      ctx.lineTo(x + 8, y + 12);
      ctx.lineTo(x - 8, y + 12);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------------------------------------
// Medidas (m). Rover a la altura de la cintura del niño, como `mundo/01`.
// ------------------------------------------------------------------------------------------
const R_RUEDA = 0.14;
const ANCHO_RUEDA = 0.12;
const EJE_X = 0.32;
const EJE_Z = 0.22;
const CUERPO = { w: 0.62, h: 0.36, d: 0.6, y: 0.41 };
const TECHO = CUERPO.y + CUERPO.h / 2;
const FRENTE = CUERPO.d / 2;

const PERIODO_PARPADEO = 4.2;
const DURACION_PARPADEO = 0.14;
const PASO_INTERFERENCIA = 1 / 6;

function lienzoPorDefecto(): LienzoCara | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  return c as unknown as LienzoCara;
}

/** Postura objetivo de cada gesto: inclinación del cuerpo (x adelante, z costado) y de la antena. */
const POSTURA: Readonly<Record<GestoIris | "reposo", { cx: number; cz: number; ax: number; az: number }>> = {
  reposo: { cx: 0, cz: 0, ax: 0, az: 0 },
  mirar: { cx: 0.05, cz: 0, ax: 0.15, az: 0 },
  senalar: { cx: 0.09, cz: 0, ax: 0.75, az: 0 },
  explicar: { cx: -0.03, cz: 0, ax: -0.1, az: 0.2 },
  pedir_reparacion: { cx: 0.06, cz: 0.07, ax: -0.5, az: -0.6 },
};

export function crearIris(m: Materiales, opciones: OpcionesIris = {}): ModeloIris {
  // --- Cuerpo fusionado por material (SuitBase y Boots), sin la pantalla ni el faro.
  const armado = grupo(
    "IrisArmado",
    parte(m, "SuitBase", chaflan(CUERPO.w, CUERPO.h, CUERPO.d, 0.08), [0, CUERPO.y, 0], "casco"),
    // Bisel oscuro de la pantalla (octógono, firma de la familia).
    parte(m, "Boots", chaflan(0.5, 0.24, 0.03, 0.06), [0, CUERPO.y + 0.02, FRENTE], "bisel"),
    // Bajo del chasis y paragolpes oscuros.
    parte(m, "Boots", caja(0.5, 0.07, 0.5), [0, CUERPO.y - CUERPO.h / 2 - 0.02, 0], "chasis"),
    // Pedestal y panel solar del techo, con su rejilla marfil.
    parte(m, "SuitBase", caja(0.12, 0.05, 0.12), [0, TECHO + 0.025, -0.02], "pedestal"),
    parte(m, "Boots", caja(0.56, 0.035, 0.46), [0, TECHO + 0.065, -0.02], "panel"),
    parte(m, "SuitBase", caja(0.57, 0.04, 0.02), [0, TECHO + 0.067, -0.02], "rejillaX"),
    parte(m, "SuitBase", caja(0.02, 0.04, 0.47), [0, TECHO + 0.067, -0.02], "rejillaZ"),
  );
  const cuerpoFusionado = fusionar(armado, "IrisCuerpo");

  // --- Pantalla con la cara en un lienzo (textura propia de esta instancia).
  const lienzo = (opciones.lienzo ?? lienzoPorDefecto)();
  const ctx = lienzo?.getContext("2d") ?? null;
  let textura: THREE.CanvasTexture | null = null;
  if (lienzo && ctx) {
    lienzo.width = ANCHO_CARA;
    lienzo.height = ALTO_CARA;
    textura = new THREE.CanvasTexture(lienzo as unknown as HTMLCanvasElement);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.name = "IrisCara";
  }
  const matPantalla = new THREE.MeshBasicMaterial({ color: textura ? 0xffffff : colorToken("espacio"), map: textura });
  matPantalla.name = "IrisPantalla";
  const pantalla = new THREE.Mesh(
    geometriaBase("iris-pantalla", () => new THREE.PlaneGeometry(0.42, 0.19)),
    matPantalla,
  );
  pantalla.name = "IrisPantalla";
  pantalla.position.set(0, CUERPO.y + 0.02, FRENTE + 0.016);

  // --- Faro frontal (abajo a la izquierda, `mundo/01`). Material propio: cambia a alerta o se apaga.
  const matFaro = m.Emissive.clone();
  matFaro.name = "IrisFaro";
  matFaro.userData = {};
  const faro = new THREE.Mesh(
    geometriaBase("iris-faro", () => {
      const g = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8);
      g.rotateX(Math.PI / 2);
      return g;
    }),
    matFaro,
  );
  faro.name = "IrisFaro";
  faro.position.set(-0.17, CUERPO.y - 0.14, FRENTE + 0.01);

  // --- Antena con bola, atrás a la derecha, en su pivote (base del mástil).
  const antenaFusionada = fusionar(
    grupo(
      "AntenaArmada",
      parte(m, "SuitBase", tronco(0.014, 0.018, 0.28, 6), [0, 0.14, 0], "mastil"),
      parte(m, "SuitBase", geometriaBase("iris-bola", () => new THREE.IcosahedronGeometry(0.045, 0)), [0, 0.3, 0], "bola"),
    ),
    "IrisAntena",
  );
  const antena = grupo("Antena", antenaFusionada);
  antena.position.set(0.22, TECHO + 0.08, -0.2);

  const cuerpo = grupo("Cuerpo", cuerpoFusionado, pantalla, faro, antena);

  // --- Ruedas: cada una en su pivote sobre el eje.
  const geoRueda = geometriaBase("iris-rueda", () => {
    const g = new THREE.CylinderGeometry(R_RUEDA, R_RUEDA, ANCHO_RUEDA, 10, 1);
    g.rotateZ(Math.PI / 2);
    return g;
  });
  const ejes: readonly (readonly [number, number])[] = [
    [-EJE_X, EJE_Z], [EJE_X, EJE_Z], [-EJE_X, -EJE_Z], [EJE_X, -EJE_Z],
  ];
  const ruedas = ejes.map(([x, z], i) => {
    const llanta = new THREE.Mesh(geoRueda, m.Boots);
    llanta.name = `Llanta_${i}`;
    llanta.castShadow = true;
    const p = grupo(`Rueda_${i}`, llanta);
    p.position.set(x, R_RUEDA, z);
    return p;
  });

  const rig = grupo("Rig", cuerpo, ...ruedas);
  const raiz = grupo("Iris", rig);

  // --- Estado.
  let estado: EstadoIris = { nivel: "pistas", averiada: false };
  let gesto: GestoIris | null = null;
  let t = 0;
  let dibujada = "";

  function redibujar(movimientoReducido: boolean): void {
    if (!ctx || !textura) return;
    const c = caraIris(estado);
    const parpadeo = !movimientoReducido && (c === "atenta" || c === "tranquila") && t % PERIODO_PARPADEO < DURACION_PARPADEO;
    const fase = c === "error" && !movimientoReducido ? Math.floor(t / PASO_INTERFERENCIA) : 0;
    const clave = `${c}|${parpadeo}|${fase}`;
    if (clave === dibujada) return; // La textura se re-sube solo si cambió (APLICACION §8).
    dibujada = clave;
    dibujarCara(ctx, c, parpadeo, fase);
    textura.needsUpdate = true;
  }

  function aplicarEstado(): void {
    const c = caraIris(estado);
    faro.visible = c !== "apagada";
    const tono = colorToken(c === "error" ? "error" : "cian");
    matFaro.color.copy(tono);
    matFaro.emissive.copy(tono);
  }

  aplicarEstado();
  redibujar(true);

  return {
    raiz,
    pivotes: { rig, cuerpo, antena, ruedas },
    fijarEstado(e) {
      estado = { ...e };
      aplicarEstado();
      redibujar(true);
    },
    fijarGesto(g) {
      gesto = g;
    },
    animar(dt, { velocidad, movimientoReducido }) {
      t += dt;
      // Ruedas: rodar sin deslizar (giro positivo en x avanza hacia +Z).
      const giro = (velocidad * dt) / R_RUEDA;
      for (const r of ruedas) r.rotation.x += giro;
      // Postura del gesto; la avería pide reparación aunque nadie lo pida.
      const clave = caraIris(estado) === "error" ? "pedir_reparacion" : gesto ?? "reposo";
      const p = POSTURA[clave];
      const vivo = movimientoReducido ? 0 : 1;
      const onda = (f: number) => vivo * Math.sin(t * f);
      cuerpo.rotation.x = p.cx + 0.015 * onda(2.2);
      cuerpo.rotation.z = p.cz + (clave === "pedir_reparacion" ? 0.02 * onda(9) : 0);
      cuerpo.position.y = 0.006 * onda(3.1) + (velocidad !== 0 ? 0.004 * onda(18) : 0);
      antena.rotation.x = p.ax + (clave === "senalar" ? 0.1 * onda(5) : 0);
      antena.rotation.z = p.az + (clave === "explicar" ? 0.25 * onda(6) : 0.03 * onda(1.7));
      redibujar(movimientoReducido);
    },
    cara: () => caraIris(estado),
    liberar() {
      textura?.dispose();
      matPantalla.dispose();
      matFaro.dispose();
      for (const o of [cuerpoFusionado, antenaFusionada]) {
        o.traverse((x) => {
          if (x instanceof THREE.Mesh) x.geometry.dispose();
        });
      }
    },
  };
}
