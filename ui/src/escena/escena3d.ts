/**
 * Escena 3D del exterior de Jezero: un solo `WebGLRenderer`, ciclo de vida, calidad y pérdida de
 * contexto (APLICACION §2 y §8). Sin React: `EscenaBase.tsx` la monta en un <canvas>.
 *
 * La escena solo lee `VistaEscena` y los `EventoFeedback` del último tick; nunca `GameState` ni el
 * motor. El armado (mallas) vive en `armado.ts` para medirlo y probarlo sin WebGL.
 */
import * as THREE from "three";
import urlDem from "../../../data/terreno/jezero/elevacion.bin?url";
import type { CalidadGrafica } from "../juego/ajustes";
import type { EventoFeedback } from "../juego/eventos";
import { armarEscena, rejillaJezero, type EscenaArmada } from "./armado";
import { LUZ } from "./cielo";
import { crearMateriales, type Materiales } from "./materiales";
import { liberarCache, liberarEscena } from "./liberar";
import { lugar, lugarCercano, type LugarId } from "./mundo";
import type { VistaEscena } from "./vista";
import { MODULOS_BASE, type ModuloBase } from "./activos/modulos";
import { PRESUPUESTO, contarRender, type CuentaRender } from "./activos/terreno";

export type CamaraEscena = "tercera" | "primera";

export interface OpcionesEscena3D {
  calidad: CalidadGrafica;
  movimientoReducido: boolean;
  /** El navegador perdió el contexto WebGL: la pantalla pasa al respaldo 2D. */
  alPerderContexto?: () => void;
  /** La escena no rinde (presupuesto o fotogramas lentos): propone este nivel. Una vez por nivel. */
  alExceso?: (nivel: CalidadGrafica) => void;
}

export interface Escena3D {
  actualizar(vista: VistaEscena, eventos: readonly EventoFeedback[]): void;
  fijarCamara(camara: CamaraEscena): void;
  fijarCalidad(nivel: CalidadGrafica): void;
  fijarMovimientoReducido(reducido: boolean): void;
  redimensionar(ancho: number, alto: number): void;
  /** Cota alta de draw calls y triángulos de la vista (recorrido, sin WebGL). */
  contar(): CuentaRender;
  /**
   * Lugar al alcance del foco de la cámara. PROVISIONAL: el jugador está fijo en la mesa hasta que
   * Camilo integre navegación y joystick; entonces el foco será la posición del jugador.
   */
  lugarCercano(): LugarId | null;
  /** Se resuelve cuando el terreno de Jezero está montado. */
  listo: Promise<void>;
  dispose(): void;
}

/** DPR máximo y sombras por calidad (APLICACION §8, MARTE §5). */
export const AJUSTE_CALIDAD: Readonly<Record<CalidadGrafica, { dpr: number; sombra: number | null; antialias: boolean }>> = {
  alta: { dpr: 1.5, sombra: LUZ.tamanoSombra.alta, antialias: true },
  media: { dpr: 1.25, sombra: LUZ.tamanoSombra.baja, antialias: true },
  baja: { dpr: 1, sombra: null, antialias: false },
};

const MAS_BAJA: Readonly<Record<CalidadGrafica, CalidadGrafica | null>> = { alta: "media", media: "baja", baja: null };

/** Jugador fijo en el punto de uso de la mesa (provisional, ver `lugarCercano`). */
const FOCO = { x: lugar("mesa").x, z: lugar("mesa").z } as const;

/**
 * Cámaras de juego (ESCENAS §3.1, `mundo/01` y `mundo/02`). [E] a calibrar con Camilo.
 * Tercera persona: baja y cerca, detrás del jugador en la mesa, con una picada de ~10° para que el
 * horizonte quede en el tercio superior como en la lámina.
 */
export const CAMARAS: Readonly<Record<CamaraEscena, { pos: [number, number, number]; mira: [number, number, number] }>> = {
  tercera: { pos: [FOCO.x - 1.6, 3.4, FOCO.z + 7.0], mira: [FOCO.x + 0.6, 0.3, FOCO.z - 9] },
  primera: { pos: [FOCO.x, 1.45, FOCO.z], mira: [FOCO.x, 1.2, FOCO.z - 8] },
};
/** Interpolación de cámara (APLICACION §7): 300 ms; con movimiento reducido, corte directo. */
const MS_CAMARA = 300;
/** Fotograma lento sostenido: por encima de esto (≈ 28 fps) se propone bajar la calidad. */
const MS_FOTOGRAMA_LENTO = 36;

export function crearEscena3D(canvas: HTMLCanvasElement, opciones: OpcionesEscena3D): Escena3D {
  let calidad = opciones.calidad;
  let reducido = opciones.movimientoReducido;
  let liberada = false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: AJUSTE_CALIDAD[calidad].antialias, powerPreference: "high-performance" });
  const materiales: Materiales = crearMateriales();
  const armada: EscenaArmada = armarEscena(materiales, null, null, calidad === "alta" ? "alta" : "baja");
  armada.cielo.aplicarRenderer(renderer);

  const camara = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
  const posDesde = new THREE.Vector3();
  const miraDesde = new THREE.Vector3();
  const posHacia = new THREE.Vector3(...CAMARAS.tercera.pos);
  const miraHacia = new THREE.Vector3(...CAMARAS.tercera.mira);
  const mira = new THREE.Vector3().copy(miraHacia);
  camara.position.copy(posHacia);
  camara.lookAt(mira);
  let inicioCamara = -Infinity;

  const vistos = new Set<string>();
  const avisados = new Set<CalidadGrafica>();

  function aplicarCalidad(nivel: CalidadGrafica): void {
    const a = AJUSTE_CALIDAD[nivel];
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, a.dpr));
    const sol = armada.cielo.sol;
    const conSombra = a.sombra !== null;
    if (renderer.shadowMap.enabled !== conSombra) {
      renderer.shadowMap.enabled = conSombra;
      for (const m of Object.values(materiales)) m.needsUpdate = true;
    }
    sol.castShadow = conSombra;
    if (a.sombra !== null && sol.shadow.mapSize.x !== a.sombra) {
      sol.shadow.mapSize.set(a.sombra, a.sombra);
      sol.shadow.map?.dispose();
      sol.shadow.map = null;
    }
  }
  aplicarCalidad(calidad);

  function proponer(nivel: CalidadGrafica | null): void {
    if (!nivel || avisados.has(nivel)) return;
    avisados.add(nivel);
    opciones.alExceso?.(nivel);
  }

  // Medición de fotogramas (APLICACION §8.1: leer renderer.info después de render()).
  let ultimo = -1;
  let acumulado = 0;
  let fotogramas = 0;
  let arranque = -1;

  function fotograma(ahora: number): void {
    if (arranque < 0) arranque = ahora;
    const p = reducido ? 1 : Math.min(1, (ahora - inicioCamara) / MS_CAMARA);
    const k = p * p * (3 - 2 * p);
    camara.position.lerpVectors(posDesde, posHacia, k);
    mira.lerpVectors(miraDesde, miraHacia, k);
    camara.lookAt(mira);
    armada.animar(ahora, reducido);
    renderer.render(armada.escena, camara);

    const info = renderer.info.render;
    if (info.calls > PRESUPUESTO.drawCalls || info.triangles > PRESUPUESTO.triangulos) proponer(MAS_BAJA[calidad]);
    if (ultimo >= 0 && ahora - arranque > 2000) {
      acumulado += ahora - ultimo;
      if (++fotogramas === 120) {
        if (acumulado / fotogramas > MS_FOTOGRAMA_LENTO) proponer(MAS_BAJA[calidad]);
        acumulado = 0;
        fotogramas = 0;
      }
    }
    ultimo = ahora;
  }

  // El bucle usa requestAnimationFrame (vía setAnimationLoop) y se pausa con la pestaña oculta.
  const arrancar = () => {
    ultimo = -1;
    renderer.setAnimationLoop(fotograma);
  };
  const parar = () => renderer.setAnimationLoop(null);
  const alVisibilidad = () => (document.hidden ? parar() : arrancar());
  const alPerder = (e: Event) => {
    e.preventDefault();
    parar();
    opciones.alPerderContexto?.();
  };
  const alRecuperar = () => {
    if (!liberada) arrancar();
  };
  canvas.addEventListener("webglcontextlost", alPerder);
  canvas.addEventListener("webglcontextrestored", alRecuperar);
  document.addEventListener("visibilitychange", alVisibilidad);
  posDesde.copy(posHacia);
  miraDesde.copy(miraHacia);
  if (!document.hidden) arrancar();

  const listo = fetch(urlDem)
    .then((r) => {
      if (!r.ok) throw new Error(`DEM ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buffer) => {
      if (!liberada) armada.ponerTerreno(rejillaJezero(buffer));
    });
  // Sin DEM la base se sigue viendo (sin relieve); quien espere `listo` recibe el error.
  listo.catch(() => undefined);

  return {
    listo,
    actualizar(vista, eventos) {
      armada.aplicarVista(vista);
      const ahora = performance.now();
      for (const e of eventos) {
        if (vistos.has(e.id)) continue; // cada evento se anima una sola vez
        vistos.add(e.id);
        if (e.tipo === "averia" && (MODULOS_BASE as readonly string[]).includes(e.equipo)) armada.pulsar(e.equipo as ModuloBase, ahora);
      }
    },
    fijarCamara(c) {
      posDesde.copy(camara.position);
      miraDesde.copy(mira);
      posHacia.set(...CAMARAS[c].pos);
      miraHacia.set(...CAMARAS[c].mira);
      inicioCamara = performance.now();
    },
    fijarCalidad(nivel) {
      calidad = nivel;
      aplicarCalidad(nivel);
    },
    fijarMovimientoReducido(r) {
      reducido = r;
    },
    redimensionar(ancho, alto) {
      if (ancho <= 0 || alto <= 0) return;
      renderer.setSize(ancho, alto, false);
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
    },
    contar() {
      return contarRender(armada.escena);
    },
    lugarCercano() {
      return lugarCercano(FOCO.x, FOCO.z);
    },
    dispose() {
      if (liberada) return;
      liberada = true;
      parar();
      canvas.removeEventListener("webglcontextlost", alPerder);
      canvas.removeEventListener("webglcontextrestored", alRecuperar);
      document.removeEventListener("visibilitychange", alVisibilidad);
      armada.liberar();
      liberarEscena(armada.escena, { compartidos: true });
      for (const m of Object.values(materiales)) m.dispose();
      liberarCache();
      renderer.dispose();
    },
  };
}
