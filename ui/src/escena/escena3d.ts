/**
 * Escena 3D del exterior de Jezero: un solo `WebGLRenderer`, ciclo de vida, calidad y pérdida de
 * contexto (APLICACION §2 y §8). Sin React: `EscenaBase.tsx` la monta en un <canvas>.
 *
 * La escena solo lee `VistaEscena` y los `EventoFeedback` del último tick; nunca `GameState` ni el
 * motor. El armado (mallas) vive en `armado.ts` para medirlo y probarlo sin WebGL; el movimiento
 * del niño e Iris, en `movimientoBase.ts`. Aquí se junta todo en un único bucle de animación:
 * entrada (teclado, ratón y `EntradaTactil`) → movimiento → actores → cámara → render.
 */
import * as THREE from "three";
import urlDem from "../../../data/terreno/jezero/elevacion.bin?url";
import type { CalidadGrafica } from "../juego/ajustes";
import type { EventoFeedback } from "../juego/eventos";
import { CLARO, MALLA_JEZERO, ROCAS_PRIMER_PLANO, armarEscena, huellasRocas, radioRoca, rejillaJezero, type EscenaArmada } from "./armado";
import { AJUSTE_CALIDAD, MAS_BAJA } from "./calidad";
import type { Cielo } from "./cielo";
import type { ActorId, PedidoEscena } from "./frontera";
import { irisGuiaAlObjetivo } from "../juego/pedidoEscena";
import { crearMateriales, type Materiales } from "./materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "./liberar";
import { crearContorno } from "./contorno";
import { crearGuantes } from "./guantes";
import { ANCLAJES_EXPERTAS, RADIO_EXPERTA, lugar, lugarCercano, type LugarId } from "./mundo";
import type { EstadoModulo, VistaEscena } from "./vista";
import { MODULOS_BASE, type ModuloBase } from "./activos/modulos";
import { PRESUPUESTO, aplanarClaro, contarRender, type CuentaRender } from "./activos/terreno";
import { huellasBase } from "./activos/baseExterior";
import { huellasModulos } from "./activos/modulosArmados";
import { EntradaTactil, type DeltaCamaraTactil } from "./entradaTactil";
import {
  TecladoMovimiento,
  crearMovimiento,
  direccionMundo,
  distanciaCaja,
  girarHacia,
  solidosDeHuellas,
  type HuellaPlanta,
  type Solidos,
  type TipoEventoDestino,
} from "./movimientoBase";

import { crearMedidorRender, type MedicionRender } from "./medicion";

export type CamaraEscena = "tercera" | "primera";

/**
 * Lo que un sistema de la escena puede leer y usar (bloque 0 de PLAN-JUGABILIDAD §2). Es un solo
 * objeto que la escena reescribe en cada fotograma: léanlo dentro de `montar`/`actualizar`, no lo
 * guarden por partes.
 */
export interface ContextoSistema {
  readonly escena: THREE.Scene;
  readonly camara: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly materiales: Materiales;
  readonly cielo: Cielo;
  readonly calidad: CalidadGrafica;
  readonly reducido: boolean;
  /** Última vista del motor (`null` hasta el primer `actualizar`). Solo lectura: la escena no decide reglas. */
  readonly vista: VistaEscena | null;
  /** Lo último que pidió la pantalla (`objetivo`, `iris`, `globo`, `hablando`, `sala`). */
  readonly pedido: PedidoEscena;
  /** Grupos de los actores en escena (el niño es `nino`), para anclar globos o mirar hacia ellos. Solo lectura. */
  readonly actores: Readonly<Partial<Record<ActorId, THREE.Object3D>>>;
  /** Posición (metros de juego) y rumbo (rad) del niño en este fotograma. */
  readonly jugador: Readonly<{ x: number; z: number; rumbo: number }>;
  /** Marca de tiempo del fotograma (ms, `performance.now`). */
  readonly ahora: number;
}

/**
 * Un sistema que se suma a la escena sin editar `escena3d.ts`: marcadores (frente C), ciclo de día
 * (frente D), etc. `montar` se llama una vez, `actualizar` en cada fotograma antes del render, y
 * `dispose` al quitarlo o al liberar la escena (libera lo que creó; materiales compartidos no).
 * Si un sistema lanza, la escena lo desmonta y sigue: nunca tumba el bucle.
 * Lo que agregue a `ctx.escena` cuenta en el presupuesto de la vista (80 draw calls, 80 000 triángulos).
 */
export interface SistemaEscena {
  readonly id: string;
  montar(ctx: ContextoSistema): void;
  actualizar(dt: number, ctx: ContextoSistema): void;
  dispose(): void;
}

/**
 * Sistemas que se montan solos: cada archivo de `escena/sistemas/` (uno por frente y por sistema)
 * exporta `crearSistema(): SistemaEscena`. Así C y D suman el suyo sin editar este archivo ni
 * `EscenaBase.tsx`. Las pruebas (`*.test.ts`) quedan fuera.
 */
const MODULOS_SISTEMA = import.meta.glob<{ crearSistema?: () => SistemaEscena }>(["./sistemas/*.ts", "!./sistemas/*.test.ts"], { eager: true });

/** Sistemas automáticos de `escena/sistemas/`, en orden de nombre de archivo. */
export function sistemasAutomaticos(): SistemaEscena[] {
  return Object.keys(MODULOS_SISTEMA)
    .sort()
    .flatMap((ruta) => {
      const crear = MODULOS_SISTEMA[ruta]?.crearSistema;
      return crear ? [crear()] : [];
    });
}

/**
 * Lista de sistemas montados con errores aislados. Sin WebGL: la escena le pasa el contexto.
 * `alFallar` recibe el sistema que lanzó (ya desmontado).
 */
export function crearRegistroSistemas(ctx: ContextoSistema, alFallar: (id: string, error: unknown) => void = avisarFallo) {
  const montados: SistemaEscena[] = [];
  const quitar = (s: SistemaEscena): void => {
    const i = montados.indexOf(s);
    if (i < 0) return;
    montados.splice(i, 1);
    try {
      s.dispose();
    } catch (e) {
      alFallar(s.id, e);
    }
  };
  return {
    agregar(s: SistemaEscena): () => void {
      if (montados.some((m) => m.id === s.id)) throw new Error(`Sistema repetido: ${s.id}`);
      try {
        s.montar(ctx);
      } catch (e) {
        alFallar(s.id, e);
        try {
          s.dispose();
        } catch {
          // ya avisado
        }
        return () => undefined;
      }
      montados.push(s);
      return () => quitar(s);
    },
    actualizar(dt: number): void {
      for (const s of [...montados]) {
        try {
          s.actualizar(dt, ctx);
        } catch (e) {
          alFallar(s.id, e);
          quitar(s);
        }
      }
    },
    ids(): string[] {
      return montados.map((s) => s.id);
    },
    dispose(): void {
      for (const s of [...montados].reverse()) quitar(s);
    },
  };
}

function avisarFallo(id: string, error: unknown): void {
  console.error(`[escena] el sistema "${id}" falló y se desmontó`, error);
}

export interface OpcionesEscena3D {
  /** Activa muestras del render para diagnóstico; desactivado en el juego por defecto. */
  medir?: boolean;
  calidad: CalidadGrafica;
  movimientoReducido: boolean;
  /** El navegador perdió el contexto WebGL: la pantalla pasa al respaldo 2D. */
  alPerderContexto?: () => void;
  /** La escena no rinde (presupuesto o fotogramas lentos): propone este nivel. Una vez por nivel. */
  alExceso?: (nivel: CalidadGrafica) => void;
  /** Escucha teclado (`WASD`/flechas, `E`, `V`) y arrastre/rueda del ratón. Por defecto, sí. */
  entrada?: boolean;
  /** El lugar al alcance cambió (incluye volver a null). */
  alLugarCercano?: (lugar: LugarId | null) => void;
  /** Tecla `E` (o Enter fuera de un botón) con un lugar al alcance. */
  alUsar?: (lugar: LugarId) => void;
  /** Tecla `V`: la pantalla decide la cámara y llama a `fijarCamara`. */
  alCambiarCamara?: () => void;
  /** Posición del jugador en metros de juego: al moverse (≤ 5 por segundo) y al detenerse. */
  alPosicion?: (posicion: { x: number; z: number }) => void;
  /** La ruta al destino terminó. */
  alDestino?: (tipo: TipoEventoDestino, lugar: LugarId) => void;
  /** Sistemas extra (p. ej. prototipos en `vistaPrevia.ts`), además de los de `escena/sistemas/`. */
  sistemas?: readonly SistemaEscena[];
  /** `false`: no monta los de `escena/sistemas/` (pruebas). Por defecto, sí. */
  sistemasAutomaticos?: boolean;
}

export interface Escena3D {
  actualizar(vista: VistaEscena, eventos: readonly EventoFeedback[]): void;
  fijarCamara(camara: CamaraEscena): void;
  fijarCalidad(nivel: CalidadGrafica): void;
  fijarMovimientoReducido(reducido: boolean): void;
  /** Camina hasta el punto de uso del lugar (ruta planeada); `null` suelta el destino sin evento. */
  fijarDestino(destino: LugarId | null): void;
  /** Diálogo, panel o campo abierto: sin caminar ni usar; se sueltan teclas y joystick. */
  fijarBloqueado(bloqueado: boolean): void;
  /** Lo que pide la pantalla (frontera.ts). Los sistemas lo leen en `ctx.pedido`. */
  fijarPedido(pedido: PedidoEscena): void;
  /** Monta un sistema y devuelve cómo quitarlo. Lanza si ya hay uno con el mismo `id`. */
  agregarSistema(sistema: SistemaEscena): () => void;
  /** Gestos táctiles de esta escena; la capa táctil de la pantalla le pasa los punteros. */
  readonly entradaTactil: EntradaTactil;
  redimensionar(ancho: number, alto: number): void;
  /** Cota alta de draw calls y triángulos de la vista (recorrido, sin WebGL). */
  contar(): CuentaRender;
  /** Contadores del renderer y FPS dibujados; null si no se activó la medición. */
  medicion(): (MedicionRender & { calidad: CalidadGrafica }) | null;
  /** Lugar al alcance de la posición actual del jugador. */
  lugarCercano(): LugarId | null;
  /** Posición actual del jugador (metros de juego). */
  posicionJugador(): { x: number; z: number };
  /** Se resuelve cuando el terreno de Jezero está montado. */
  listo: Promise<void>;
  dispose(): void;
}

/** Punto de uso de la mesa: solo para el encuadre de referencia `CAMARAS` (pruebas de composición). */
const FOCO = { x: lugar("mesa").x, z: lugar("mesa").z } as const;

/**
 * Encuadre de referencia de la lámina `mundo/01` desde la mesa (ESCENAS §3.1), en coordenadas
 * absolutas. Lo usan las pruebas de composición del decorado (torre, rocas, horizonte). El juego ya
 * no usa una cámara fija: sigue al jugador con `CAMARA_TERCERA` y `CAMARA_PRIMERA`.
 */
export const CAMARAS: Readonly<Record<CamaraEscena, { pos: [number, number, number]; mira: [number, number, number] }>> = {
  tercera: { pos: [FOCO.x - 2.2, 5.4, FOCO.z + 6.6], mira: [FOCO.x - 1.1, 1.0, FOCO.z - 10.6] },
  primera: { pos: [FOCO.x, 1.1, FOCO.z + 3.4], mira: [FOCO.x, 1.2, FOCO.z - 8] },
};

/**
 * Tercera persona que sigue al niño (ESCENAS §3.1, `mundo/01`; celular: `02_Celular/01`). Órbita
 * alrededor de un pivote a la altura del pecho, detrás del niño: `distancia` al pivote,
 * `inclinacion` (rad, mirando hacia abajo), `hombro` (m, el pivote se corre a la derecha de la
 * cámara para dejar al niño en el tercio izquierdo) y `adelante` (m, la mirada apunta por delante
 * del niño: así queda entero en el tercio inferior, con la consola y la base por delante y el
 * horizonte arriba). Hay un encuadre apaisado (3:2 o más ancho) y uno vertical (390×844); entre
 * ambos se interpola por aspecto, porque `fovParaAspecto` abre el campo visual en cuadros altos.
 * Calibrado con capturas en 1440×900, 1024×683, 844×390 y 390×844. [E]
 */
export const CAMARA_TERCERA = {
  apaisado: { distancia: 3.27, inclinacion: 0.41, adelante: 4.1, hombro: 0.8 },
  vertical: { distancia: 3.46, inclinacion: 0.46, adelante: 8.1, hombro: 0 },
  /** Aspecto del encuadre vertical de referencia (390×844). */
  aspectoVertical: 390 / 844,
  /** Rueda y pellizco: factor sobre la distancia del encuadre. */
  zoomMin: 0.7,
  zoomMax: 2.2,
  /** Arrastre vertical: inclinación final permitida (rad). */
  inclinacionMin: 0.08,
  inclinacionMax: 1.0,
  pivote: 1.0,
  alturaMira: 0.55,
  /** Distancia mínima a la que la cámara se acerca para no quedar dentro de un sólido. */
  distanciaColision: 1.2,
  /** Margen de la cámara contra las huellas (pantallas inclinadas y aleros salen de la huella). */
  margenColision: 0.45,
} as const;

export interface Encuadre {
  distancia: number;
  inclinacion: number;
  adelante: number;
  hombro: number;
}

/** Encuadre de tercera persona para un aspecto (ancho / alto) del cuadro. Escribe en `salida`. */
export function encuadreTercera(aspecto: number, salida: Encuadre = { distancia: 0, inclinacion: 0, adelante: 0, hombro: 0 }): Encuadre {
  const a = CAMARA_TERCERA.apaisado, v = CAMARA_TERCERA.vertical;
  const f = aspecto > 0 ? Math.min(1, Math.max(0, (ASPECTO_BASE - aspecto) / (ASPECTO_BASE - CAMARA_TERCERA.aspectoVertical))) : 0;
  salida.distancia = a.distancia + (v.distancia - a.distancia) * f;
  salida.inclinacion = a.inclinacion + (v.inclinacion - a.inclinacion) * f;
  salida.adelante = a.adelante + (v.adelante - a.adelante) * f;
  salida.hombro = a.hombro + (v.hombro - a.hombro) * f;
  return salida;
}

/** Primera persona: a la altura de los ojos del niño (1,18 m de alto), con los guantes. */
export const CAMARA_PRIMERA = { ojos: 1.08, inclinacion: 0.12, inclinacionMin: -0.6, inclinacionMax: 0.75 } as const;

/** Sensibilidad de giro por píxel arrastrado (ratón y dedo). */
const GIRO_POR_PX = 0.0055;
/** Seguimiento suave: constante de tiempo inversa (1/s). */
const SEGUIMIENTO = 9;
/** Detrás del niño: la cámara vuelve a su espalda a este ritmo (rad/s) al caminar, si nadie la giró. */
const REGRESO_ESPALDA = 1.3;
const MS_SIN_REGRESO = 1800;
/** Subida de la cámara por encima de un obstáculo: pasos de inclinación que se prueban. */
const PASOS_SUBIDA = 4;
const SUBIDA_POR_PASO = 0.14;
/** Cadencia de `alPosicion` y de los atributos de prueba mientras se camina. */
const MS_POSICION = 200;

/** Campo visual vertical base (grados) de la tercera persona, válido hasta `ASPECTO_BASE`. */
const FOV_TERCERA = 60;
const ASPECTO_BASE = 1.5;
const FOV_MAXIMO = 90;

/**
 * Campo visual vertical según el aspecto del cuadro (ESCENAS §2.7): en apaisado se queda en el base;
 * en cuadros más altos que 3:2 se abre (con tope) para que el hábitat y la consola sigan dentro.
 * En primera persona no se adapta (70°).
 */
export function fovParaAspecto(camara: CamaraEscena, aspecto: number): number {
  if (camara === "primera") return 70;
  if (!(aspecto > 0)) return FOV_TERCERA;
  const k = Math.max(1, ASPECTO_BASE / aspecto) ** 0.6;
  const fov = 2 * Math.atan(Math.tan((FOV_TERCERA * Math.PI) / 360) * k) * (180 / Math.PI);
  return Math.min(FOV_MAXIMO, fov);
}

/** Interpolación de cámara (APLICACION §7): 300 ms; con movimiento reducido, corte directo. */
const MS_CAMARA = 300;
/** Fotograma lento sostenido: por encima de esto (≈ 28 fps) se propone bajar la calidad. */
const MS_FOTOGRAMA_LENTO = 36;

/** Módulos que existen en el mundo (y por eso chocan): todo menos ausente. */
const CONSTRUIDO: Readonly<Record<EstadoModulo, boolean>> = { ausente: false, instalando: true, funcionando: true, averiado: true };

/**
 * Sólidos reales de la base: las huellas que monta `armado.ts` (hábitat, consolas, paneles de la
 * mesa, estaciones, decorado, balizas), las rocas, la Ingeniera y SOLO los módulos construidos.
 * Las cajas siguen siendo cajas (no se aproximan por círculos).
 */
export function solidosBase(modulos: Partial<Record<ModuloBase, EstadoModulo>>, rocas: readonly HuellaPlanta[] | null): Solidos {
  const ingeniera = ANCLAJES_EXPERTAS.ingeniera;
  const primerPlano = ROCAS_PRIMER_PLANO.map((r) => ({ x: r.posicion[0], z: r.posicion[2], r: radioRoca(r) }));
  const huellas: HuellaPlanta[] = [
    ...huellasBase(),
    ...huellasModulos().filter((h) => {
      const id = h.id.slice("modulo:".length) as ModuloBase;
      const e = modulos[id];
      return e !== undefined && CONSTRUIDO[e];
    }),
    ...(rocas ?? primerPlano),
    { x: ingeniera.x, z: ingeniera.z, r: RADIO_EXPERTA },
  ];
  return solidosDeHuellas(huellas);
}

/** Huella con la altura aproximada de lo que hay encima: la cámara pasa por arriba de lo bajo. */
export type ObstaculoCamara = { readonly alto: number } & (
  | { readonly x: number; readonly z: number; readonly r: number }
  | { readonly x: number; readonly z: number; readonly ancho: number; readonly fondo: number; readonly giro: number }
);

/**
 * Alto aproximado (m) de cada huella por su id, solo para la cámara (no es colisión del jugador).
 * Módulos: un poco menos que la altura de su marcador (`my`). [E]
 */
function altoDeHuella(id: string): number {
  if (id.startsWith("modulo:")) return lugar(id.slice("modulo:".length) as LugarId).my - 0.4;
  if (id === "habitat") return lugar("habitat").my - 0.4;
  if (id.startsWith("consola:")) return 2;
  if (id.startsWith("panel_mesa:")) return 1.7;
  if (id.startsWith("baliza:")) return 0.9;
  if (id.startsWith("roca_primer_plano:")) {
    // La roca maestra mide ~1,2 m de alto por unidad de escala vertical.
    const r = ROCAS_PRIMER_PLANO[Number(id.slice("roca_primer_plano:".length))];
    return r ? r.escala[1] * 1.2 : 2.2;
  }
  if (id.startsWith("roca")) return 3;
  if (id.startsWith("estacion:")) return 4.5;
  return 9;
}

/** Obstáculos de la cámara con los mismos módulos construidos y rocas que `solidosBase`. */
export function obstaculosCamara(modulos: Partial<Record<ModuloBase, EstadoModulo>>, rocas: readonly (HuellaPlanta & { id?: string })[] | null): ObstaculoCamara[] {
  const primerPlano = ROCAS_PRIMER_PLANO.map((r, i) => ({ id: `roca_primer_plano:${i}`, x: r.posicion[0], z: r.posicion[2], r: radioRoca(r) }));
  const huellas: (HuellaPlanta & { id?: string })[] = [
    ...huellasBase(),
    ...huellasModulos().filter((h) => {
      const e = modulos[h.id.slice("modulo:".length) as ModuloBase];
      return e !== undefined && CONSTRUIDO[e];
    }),
    ...(rocas ?? primerPlano),
  ];
  return huellas.map((h) => ({ ...h, alto: altoDeHuella(h.id ?? "roca") }));
}

/** ¿El punto (con margen) cae dentro de un obstáculo más alto que `y`? */
function tapaCamara(x: number, y: number, z: number, margen: number, obstaculos: readonly ObstaculoCamara[]): boolean {
  for (const o of obstaculos) {
    if (y > o.alto + 0.1) continue;
    if ("r" in o ? Math.hypot(x - o.x, z - o.z) < o.r + margen : distanciaCaja(x, z, o) < margen) return true;
  }
  return false;
}

const suave = (p: number) => p * p * (3 - 2 * p);

/**
 * Pose de la tercera persona sin obstáculos ni suavizado: posición y punto de mira para el niño en
 * (px, py, pz), con la cámara mirando hacia `yaw` (0 = hacia −Z). Escribe en `pos` y `mira`.
 */
export function poseTercera(
  px: number, py: number, pz: number, yaw: number, inclinacion: number, distancia: number,
  adelante: number, hombro: number, pos: THREE.Vector3, mira: THREE.Vector3,
): void {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw); // adelante de la cámara
  const rx = Math.cos(yaw), rz = -Math.sin(yaw); // derecha de la cámara
  const bx = px + rx * hombro, bz = pz + rz * hombro, by = py + CAMARA_TERCERA.pivote;
  const ch = Math.cos(inclinacion), sh = Math.sin(inclinacion);
  pos.set(bx - fx * ch * distancia, by + sh * distancia, bz - fz * ch * distancia);
  mira.set(bx + fx * adelante, py + CAMARA_TERCERA.alturaMira, bz + fz * adelante);
}

/** Altura del centro del cuerpo del niño, para conservar su lugar en el cuadro. */
const CENTRO_NINO = 0.6;

/**
 * `adelante` que conserva el ángulo entre el niño y el centro del cuadro cuando la cámara pasa de
 * (inclinación, distancia) del encuadre a (incE, dE) por un obstáculo. Sin cambio, el del encuadre.
 */
export function adelanteEquivalente(e: Encuadre, inc: number, dist: number, incE: number, dE: number): number {
  if (Math.abs(incE - inc) < 1e-6 && Math.abs(dE - dist) < 1e-6) return e.adelante;
  const p = CAMARA_TERCERA.pivote, m = CAMARA_TERCERA.alturaMira;
  const b = dist * Math.cos(inc), h = p + dist * Math.sin(inc);
  const delta = Math.atan2(h - CENTRO_NINO, b) - Math.atan2(h - m, b + e.adelante);
  const b2 = dE * Math.cos(incE), h2 = p + dE * Math.sin(incE);
  const angulo = Math.atan2(h2 - CENTRO_NINO, b2) - delta;
  if (angulo <= 0.05) return e.adelante;
  return Math.max(0, (h2 - m) / Math.tan(angulo) - b2);
}

export function crearEscena3D(canvas: HTMLCanvasElement, opciones: OpcionesEscena3D): Escena3D {
  let calidad = opciones.calidad;
  let reducido = opciones.movimientoReducido;
  let liberada = false;
  const medidor = opciones.medir ? crearMedidorRender() : null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: AJUSTE_CALIDAD[calidad].antialias, powerPreference: "high-performance" });
  const materiales: Materiales = crearMateriales();
  const armada: EscenaArmada = armarEscena(materiales, null, null, calidad === "alta" ? "alta" : "baja");
  armada.cielo.aplicarRenderer(renderer);
  const { tripulacion } = armada;

  // --- Movimiento: el niño, Iris y los sólidos reales ---
  const modulosVistos: Partial<Record<ModuloBase, EstadoModulo>> = {};
  let rocas: (HuellaPlanta & { id?: string })[] | null = null;
  let solidos = solidosBase(modulosVistos, rocas);
  let obstaculos = obstaculosCamara(modulosVistos, rocas);
  const jugadorInicial = tripulacion.jugador.grupo.position;
  const irisInicial = tripulacion.iris.grupo.position;
  const mov = crearMovimiento(solidos, {
    inicio: { x: jugadorInicial.x, z: jugadorInicial.z },
    rumbo: tripulacion.jugador.grupo.rotation.y,
    iris: { x: irisInicial.x, z: irisInicial.z },
    alDestino: (tipo, l) => {
      // Al llegar, la cámara se pone a la espalda del niño, que mira al lugar.
      if (tipo === "llego" && camaraActual === "tercera") yawLlegada = mov.rumbo - Math.PI;
      opciones.alDestino?.(tipo, l);
    },
  });
  const teclado = new TecladoMovimiento();
  /** Giro pendiente de la cámara al llegar a un destino (null = ninguno). */
  let yawLlegada: number | null = null;
  let bloqueado = false;

  // --- Cámara ---
  const camara = new THREE.PerspectiveCamera(FOV_TERCERA, 1, 0.1, 600);
  const contorno = crearContorno(materiales);
  const guantes = crearGuantes(materiales);
  armada.escena.add(contorno.malla, camara);
  camara.add(guantes.raiz);

  // --- Sistemas (ganchos del bloque 0): un contexto reutilizado y errores aislados ---
  const jugadorCtx = { x: mov.jugador.x, z: mov.jugador.z, rumbo: mov.rumbo };
  const ctx: { -readonly [K in keyof ContextoSistema]: ContextoSistema[K] } = {
    escena: armada.escena,
    camara,
    renderer,
    materiales,
    cielo: armada.cielo,
    calidad,
    reducido,
    vista: null,
    pedido: {},
    actores: { nino: tripulacion.jugador.grupo, ingeniera: tripulacion.ingeniera.grupo, iris: tripulacion.iris.grupo },
    jugador: jugadorCtx,
    ahora: 0,
  };
  const sistemas = crearRegistroSistemas(ctx);
  let camaraActual: CamaraEscena = "tercera";
  /** 0 = tercera persona, 1 = primera; se anima entre `mezclaDesde` y el destino. */
  let mezcla = 0;
  let mezclaDesde = 0;
  let inicioCamara = -Infinity;
  /** Hacia dónde mira la cámara (0 = hacia −Z), arranca a la espalda del niño. */
  let yaw = tripulacion.jugador.grupo.rotation.y - Math.PI;
  /** Ajustes del jugador sobre el encuadre: giro vertical (rad) y acercamiento (factor). */
  let ajusteInclinacion = 0;
  let zoom = 1;
  let inclinacionPrimera: number = CAMARA_PRIMERA.inclinacion;
  const encuadre = encuadreTercera(1.5);
  let ultimoGiroManual = -Infinity;
  const pivote = new THREE.Vector3(jugadorInicial.x, 0, jugadorInicial.z);
  /** Distancia efectiva tras la colisión: se acerca de golpe y se aleja suave. */
  let distanciaEfectiva = -1;
  let inclinacionEfectiva = -1;
  const posTercera = new THREE.Vector3();
  const miraTercera = new THREE.Vector3();
  const posPrimera = new THREE.Vector3();
  const miraPrimera = new THREE.Vector3();
  const mira = new THREE.Vector3();
  const delta: DeltaCamaraTactil = { x: 0, y: 0, zoom: 0 };
  const direccion = { x: 0, z: 0 };
  /** Entrada de este fotograma relativa a la cámara (+1 adelante, +1 derecha). */
  let entradaAdelante = 0, entradaLado = 0;
  let arrastreX = 0, arrastreY = 0, rueda = 0;
  let arrastre: { id: number; x: number; y: number } | null = null;

  const recentrar = () => {
    yaw = mov.rumbo - Math.PI;
    ajusteInclinacion = 0;
    inclinacionPrimera = CAMARA_PRIMERA.inclinacion;
    zoom = 1;
    ultimoGiroManual = -Infinity;
  };
  const entradaTactil = new EntradaTactil({ onRecentrar: recentrar, permiteZoom: () => camaraActual === "tercera" });

  // --- Proximidad, posición y atributos de prueba ---
  let ultimoLugar: LugarId | null = lugarCercano(mov.jugador.x, mov.jugador.z);
  contorno.colocar(ultimoLugar);
  let ultimaPosicion = -Infinity;
  let caminaba = false;
  const marcar = () => {
    canvas.dataset.jugadorX = mov.jugador.x.toFixed(2);
    canvas.dataset.jugadorZ = mov.jugador.z.toFixed(2);
    canvas.dataset.camara = camaraActual;
    canvas.dataset.lugarCercano = ultimoLugar ?? "";
  };
  const emitirPosicion = (ahora: number) => {
    ultimaPosicion = ahora;
    marcar();
    // Como mucho 5 objetos por segundo: el mapa puede guardarlos sin que se reescriban.
    opciones.alPosicion?.({ x: mov.jugador.x, z: mov.jugador.z });
  };
  marcar();

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

  function actualizarSolidos(): void {
    solidos = solidosBase(modulosVistos, rocas);
    obstaculos = obstaculosCamara(modulosVistos, rocas);
    mov.fijarSolidos(solidos);
  }

  /** Acorta la distancia si entre el pivote y la cámara hay un obstáculo más alto que el rayo. */
  function distanciaLibre(px: number, pz: number, dx: number, dz: number, alturaPivote: number, dy: number, d: number): number {
    const n = 16;
    for (let i = 1; i <= n; i++) {
      const t = (i / n) * d;
      const y = alturaPivote + dy * t;
      if (tapaCamara(px + dx * t, y, pz + dz * t, CAMARA_TERCERA.margenColision, obstaculos)) {
        return Math.max(CAMARA_TERCERA.distanciaColision, ((i - 1) / n) * d);
      }
    }
    return d;
  }

  function moverCamara(dt: number, ahora: number): void {
    // Giro manual (ratón y dedo) y acercamiento (rueda y pellizco, solo en tercera).
    entradaTactil.consumirCamara(delta);
    const gx = arrastreX + delta.x, gy = arrastreY + delta.y;
    arrastreX = arrastreY = 0;
    if (gx !== 0 || gy !== 0) {
      yaw -= gx * GIRO_POR_PX;
      if (camaraActual === "primera") {
        inclinacionPrimera = Math.min(CAMARA_PRIMERA.inclinacionMax, Math.max(CAMARA_PRIMERA.inclinacionMin, inclinacionPrimera + gy * GIRO_POR_PX));
      } else {
        ajusteInclinacion += gy * GIRO_POR_PX;
      }
      ultimoGiroManual = ahora;
    }
    const pedido = rueda + (camaraActual === "tercera" ? -delta.zoom : 0);
    rueda = 0;
    if (pedido !== 0 && camaraActual === "tercera") {
      zoom = Math.min(CAMARA_TERCERA.zoomMax, Math.max(CAMARA_TERCERA.zoomMin, zoom * Math.exp(pedido)));
    }
    encuadreTercera(camara.aspect, encuadre);
    // El arrastre vertical queda dentro de los límites de inclinación del encuadre actual.
    ajusteInclinacion = Math.min(CAMARA_TERCERA.inclinacionMax - encuadre.inclinacion, Math.max(CAMARA_TERCERA.inclinacionMin - encuadre.inclinacion, ajusteInclinacion));
    const inclinacion = encuadre.inclinacion + ajusteInclinacion;
    const distancia = encuadre.distancia * zoom;

    const j = mov.jugador;
    // La cámara vuelve sola a la espalda del niño cuando se le pide ir hacia delante (o sigue una
    // ruta). De costado o hacia atrás no gira: si girara, mantener A o D haría caminar en círculos.
    // Se decide por la entrada, no por el movimiento: al deslizar contra un sólido no se realimenta.
    const haciaDelante = mov.destino !== null || (entradaAdelante > 0 && Math.abs(entradaLado) <= entradaAdelante * 0.6);
    if (!reducido && haciaDelante && camaraActual === "tercera" && mov.velocidad > 0.3 && ahora - ultimoGiroManual > MS_SIN_REGRESO) {
      const espalda = mov.rumbo - Math.PI;
      const alineado = Math.cos(espalda - yaw);
      if (alineado > 0.35) yaw = girarHacia(yaw, espalda, REGRESO_ESPALDA * dt * alineado * Math.min(1, mov.velocidad / 2));
    }
    if (yawLlegada !== null) {
      if (gx !== 0 || gy !== 0 || mov.velocidad > 0.05 || reducido) {
        if (reducido && gx === 0 && gy === 0) yaw = yawLlegada;
        yawLlegada = null;
      } else {
        yaw = girarHacia(yaw, yawLlegada, 2.5 * dt);
        if (Math.cos(yaw - yawLlegada) > 0.9999) yawLlegada = null;
      }
    }
    if (camaraActual === "primera" && mezcla > 0.5) mov.fijarRumbo(yaw + Math.PI);

    // Pivote suavizado (con movimiento reducido, sin retraso).
    const k = reducido || dt <= 0 ? 1 : 1 - Math.exp(-SEGUIMIENTO * dt);
    pivote.x += (j.x - pivote.x) * k;
    pivote.z += (j.z - pivote.z) * k;
    pivote.y += (j.y - pivote.y) * k;

    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const fx = -sy, fz = -cy; // adelante de la cámara
    const rx = cy, rz = -sy; // derecha de la cámara
    const hombro = encuadre.hombro;
    const bx = pivote.x + rx * hombro, bz = pivote.z + rz * hombro;
    const by = pivote.y + CAMARA_TERCERA.pivote;
    // Si algo tapa la cámara, primero sube por encima (más inclinación); si no alcanza, se acerca.
    let inc = inclinacion;
    let libre = distanciaLibre(bx, bz, -fx * Math.cos(inc), -fz * Math.cos(inc), by, Math.sin(inc), distancia);
    for (let paso = 1; paso <= PASOS_SUBIDA && libre < distancia; paso++) {
      const otra = Math.min(CAMARA_TERCERA.inclinacionMax, inclinacion + paso * SUBIDA_POR_PASO);
      const l = distanciaLibre(bx, bz, -fx * Math.cos(otra), -fz * Math.cos(otra), by, Math.sin(otra), distancia);
      if (l >= distancia) {
        inc = otra;
        libre = l;
      }
    }
    const suaviza = (actual: number, meta: number, sube: boolean) =>
      actual < 0 || sube || reducido ? meta : actual + (meta - actual) * (1 - Math.exp(-4 * dt));
    inclinacionEfectiva = suaviza(inclinacionEfectiva, inc, inc > inclinacionEfectiva);
    distanciaEfectiva = suaviza(distanciaEfectiva, libre, libre < distanciaEfectiva);
    const d = distanciaEfectiva;

    // Con la cámara subida o acercada, la mirada se acerca para que el niño siga en el mismo lugar
    // del cuadro (mismo ángulo entre el niño y el centro que en el encuadre sin obstáculos).
    const adelante = adelanteEquivalente(encuadre, inclinacion, distancia, inclinacionEfectiva, d);
    poseTercera(pivote.x, pivote.y, pivote.z, yaw, inclinacionEfectiva, d, adelante, hombro, posTercera, miraTercera);

    const ojos = j.y + CAMARA_PRIMERA.ojos;
    const cp = Math.cos(inclinacionPrimera);
    posPrimera.set(j.x, ojos, j.z);
    miraPrimera.set(j.x + fx * cp * 10, ojos - Math.sin(inclinacionPrimera) * 10, j.z + fz * cp * 10);

    const objetivo = camaraActual === "primera" ? 1 : 0;
    const p = reducido ? 1 : Math.min(1, Math.max(0, (ahora - inicioCamara) / MS_CAMARA));
    mezcla = mezclaDesde + (objetivo - mezclaDesde) * suave(p);
    camara.position.lerpVectors(posTercera, posPrimera, mezcla);
    mira.lerpVectors(miraTercera, miraPrimera, mezcla);
    camara.lookAt(mira);
    // El cuerpo se oculta al entrar a primera persona y vuelve al salir (ni la cámara atraviesa el casco).
    tripulacion.jugador.grupo.visible = !(camaraActual === "primera" && mezcla > 0.02) && !(camaraActual === "tercera" && mezcla > 0.9);
    guantes.mostrar(camaraActual === "primera" && mezcla > 0.98);
  }

  function leerEntrada(): void {
    entradaAdelante = entradaLado = 0;
    if (bloqueado) {
      mov.fijarEntrada(0, 0);
      return;
    }
    const t = entradaTactil.estado;
    const adelante = teclado.eje - t.moverZ;
    const lado = teclado.lado + t.moverX;
    entradaAdelante = adelante;
    entradaLado = lado;
    if (adelante === 0 && lado === 0) {
      mov.fijarEntrada(0, 0);
      return;
    }
    direccionMundo(adelante, lado, yaw, direccion);
    mov.fijarEntrada(direccion.x, direccion.z);
  }

  // Medición de fotogramas (APLICACION §8.1: leer renderer.info después de render()).
  let ultimo = -1;
  let acumulado = 0;
  let fotogramas = 0;
  let arranque = -1;

  function fotograma(ahora: number): void {
    if (arranque < 0) arranque = ahora;
    // Al volver de una pestaña oculta `ultimo` es −1: el primer paso no acumula el tiempo perdido.
    const dt = ultimo >= 0 ? Math.max(0, (ahora - ultimo) / 1000) : 0;

    leerEntrada();
    mov.avanzar(dt, reducido);
    const j = mov.jugador;
    const g = tripulacion.jugador.grupo;
    g.position.set(j.x, j.y, j.z);
    g.rotation.y = mov.rumbo;
    const iris = mov.iris;
    tripulacion.iris.grupo.position.set(iris.x, 0, iris.z);
    tripulacion.iris.grupo.rotation.y = iris.rumbo;
    tripulacion.actores.caminando = mov.velocidad > 0.2;
    tripulacion.actores.velocidadIris = mov.velocidadIris;
    tripulacion.actores.modoIris = iris.modo;

    const l = lugarCercano(j.x, j.z);
    if (l !== ultimoLugar) {
      ultimoLugar = l;
      contorno.colocar(l);
      marcar();
      opciones.alLugarCercano?.(l);
    }
    const camina = mov.velocidad > 0.05;
    if ((camina && ahora - ultimaPosicion >= MS_POSICION) || (!camina && caminaba)) emitirPosicion(ahora);
    caminaba = camina;

    moverCamara(dt, ahora);
    armada.animar(ahora, reducido);
    jugadorCtx.x = j.x;
    jugadorCtx.z = j.z;
    jugadorCtx.rumbo = mov.rumbo;
    ctx.ahora = ahora;
    ctx.calidad = calidad;
    ctx.reducido = reducido;
    sistemas.actualizar(dt);
    renderer.render(armada.escena, camara);

    const info = renderer.info.render;
    medidor?.registrar(ahora, { drawCalls: info.calls, triangulos: info.triangles });
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

  // --- Entrada de escritorio ---
  const soltarTodo = () => {
    teclado.soltarTodo();
    entradaTactil.cancelar();
    arrastreX = arrastreY = rueda = 0;
    arrastre = null;
  };
  const escribiendo = (t: EventTarget | null): boolean => {
    const el = t as HTMLElement | null;
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ""));
  };
  const alBajarTecla = (e: KeyboardEvent) => {
    if (escribiendo(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (bloqueado) return;
    if (teclado.presionar(e.code)) return;
    if (e.repeat) return;
    if (e.code === "KeyV" || e.key === "v" || e.key === "V") {
      opciones.alCambiarCamara?.();
      return;
    }
    const usar = e.key === "e" || e.key === "E" || e.code === "KeyE";
    // Enter sobre un botón es del botón; E siempre es "usar".
    if (!usar && !(e.key === "Enter" && (e.target as HTMLElement | null)?.tagName !== "BUTTON")) return;
    const l = lugarCercano(mov.jugador.x, mov.jugador.z);
    if (l) opciones.alUsar?.(l);
  };
  const alSoltarTecla = (e: KeyboardEvent) => {
    teclado.soltar(e.code);
  };
  const alApuntar = (e: PointerEvent) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  };
  const alMoverPuntero = (e: PointerEvent) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    arrastreX += e.clientX - arrastre.x;
    arrastreY += e.clientY - arrastre.y;
    arrastre.x = e.clientX;
    arrastre.y = e.clientY;
  };
  const alSoltarPuntero = (e: PointerEvent) => {
    if (arrastre?.id === e.pointerId) arrastre = null;
  };
  const alRueda = (e: WheelEvent) => {
    if (camaraActual !== "tercera") return;
    e.preventDefault();
    rueda += Math.max(-1, Math.min(1, e.deltaY / 400));
  };
  const conEntrada = opciones.entrada !== false;
  if (conEntrada) {
    window.addEventListener("keydown", alBajarTecla);
    window.addEventListener("keyup", alSoltarTecla);
    window.addEventListener("blur", soltarTodo);
    canvas.addEventListener("pointerdown", alApuntar);
    canvas.addEventListener("pointermove", alMoverPuntero);
    canvas.addEventListener("pointerup", alSoltarPuntero);
    canvas.addEventListener("pointercancel", alSoltarPuntero);
    canvas.addEventListener("wheel", alRueda, { passive: false });
  }

  // El bucle usa requestAnimationFrame (vía setAnimationLoop) y se pausa con la pestaña oculta.
  const arrancar = () => {
    ultimo = -1;
    renderer.setAnimationLoop(fotograma);
  };
  const parar = () => {
    renderer.setAnimationLoop(null);
    medidor?.reiniciar();
  };
  const alVisibilidad = () => {
    if (document.hidden) {
      soltarTodo();
      parar();
    } else arrancar();
  };
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
  // Primer encuadre sin interpolar.
  inicioCamara = -Infinity;
  moverCamara(0, 0);
  const iniciales = [...(opciones.sistemasAutomaticos === false ? [] : sistemasAutomaticos()), ...(opciones.sistemas ?? [])];
  for (const s of iniciales) sistemas.agregar(s);
  if (!document.hidden) arrancar();

  const listo = fetch(urlDem)
    .then((r) => {
      if (!r.ok) throw new Error(`DEM ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buffer) => {
      if (liberada) return;
      const rejilla = rejillaJezero(buffer);
      armada.ponerTerreno(rejilla);
      // Las rocas grandes del borde del claro también chocan (misma semilla y rejilla que el armado).
      rocas = huellasRocas(aplanarClaro(rejilla, MALLA_JEZERO, CLARO.radio, CLARO.borde).rejilla);
      actualizarSolidos();
    });
  // Sin DEM la base se sigue viendo (sin relieve); quien espere `listo` recibe el error.
  listo.catch(() => undefined);

  return {
    listo,
    entradaTactil,
    actualizar(vista, eventos) {
      armada.aplicarVista(vista);
      ctx.vista = vista;
      let cambio = false;
      for (const id of MODULOS_BASE) {
        const antes = modulosVistos[id];
        const ahora = vista.modulos[id];
        if (antes === undefined || CONSTRUIDO[antes] !== CONSTRUIDO[ahora]) cambio = true;
        modulosVistos[id] = ahora;
      }
      if (cambio) actualizarSolidos();
      const ahora = performance.now();
      for (const e of eventos) {
        if (vistos.has(e.id)) continue; // cada evento se anima una sola vez
        vistos.add(e.id);
        if (e.tipo === "averia" && (MODULOS_BASE as readonly string[]).includes(e.equipo)) armada.pulsar(e.equipo as ModuloBase, ahora);
      }
    },
    fijarCamara(c) {
      if (c === camaraActual) return;
      camaraActual = c;
      mezclaDesde = mezcla;
      inicioCamara = performance.now();
      camara.fov = fovParaAspecto(c, camara.aspect);
      camara.updateProjectionMatrix();
      if (c === "primera") {
        inclinacionPrimera = CAMARA_PRIMERA.inclinacion;
        yaw = mov.rumbo - Math.PI;
      }
      marcar();
    },
    fijarCalidad(nivel) {
      calidad = nivel;
      medidor?.reiniciar();
      aplicarCalidad(nivel);
    },
    fijarMovimientoReducido(r) {
      reducido = r;
    },
    fijarDestino(d) {
      mov.irA(d);
    },
    fijarBloqueado(b) {
      if (b === bloqueado) return;
      bloqueado = b;
      if (b) soltarTodo();
      mov.fijarBloqueado(b);
    },
    fijarPedido(pedido) {
      ctx.pedido = pedido;
      // A2: Iris rueda delante del niño hacia el objetivo cuando señala; en `pistas` solo acompaña.
      mov.guiarIrisA(irisGuiaAlObjetivo(pedido) ? pedido.objetivo!.lugar : null);
      tripulacion.actores.errorIris = pedido.iris?.cara === "error";
    },
    agregarSistema(s) {
      if (liberada) return () => undefined;
      return sistemas.agregar(s);
    },
    redimensionar(ancho, alto) {
      if (ancho <= 0 || alto <= 0) return;
      renderer.setSize(ancho, alto, false);
      camara.aspect = ancho / alto;
      camara.fov = fovParaAspecto(camaraActual, camara.aspect);
      camara.updateProjectionMatrix();
      guantes.anclar(camara.aspect, 70);
    },
    medicion() {
      return medidor ? { ...medidor.leer(), calidad } : null;
    },
    contar() {
      return contarRender(armada.escena);
    },
    lugarCercano() {
      return lugarCercano(mov.jugador.x, mov.jugador.z);
    },
    posicionJugador() {
      return { x: mov.jugador.x, z: mov.jugador.z };
    },
    dispose() {
      if (liberada) return;
      liberada = true;
      parar();
      soltarTodo();
      if (conEntrada) {
        window.removeEventListener("keydown", alBajarTecla);
        window.removeEventListener("keyup", alSoltarTecla);
        window.removeEventListener("blur", soltarTodo);
        canvas.removeEventListener("pointerdown", alApuntar);
        canvas.removeEventListener("pointermove", alMoverPuntero);
        canvas.removeEventListener("pointerup", alSoltarPuntero);
        canvas.removeEventListener("pointercancel", alSoltarPuntero);
        canvas.removeEventListener("wheel", alRueda);
      }
      canvas.removeEventListener("webglcontextlost", alPerder);
      canvas.removeEventListener("webglcontextrestored", alRecuperar);
      document.removeEventListener("visibilitychange", alVisibilidad);
      sistemas.dispose();
      armada.liberar();
      liberarEscena(armada.escena, { compartidos: true });
      liberarMateriales(Object.values(materiales));
      liberarCache();
      renderer.dispose();
    },
  };
}
