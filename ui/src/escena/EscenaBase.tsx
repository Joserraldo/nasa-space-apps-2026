import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import type { CalidadGrafica } from "../juego/ajustes";
import type { EventoFeedback } from "../juego/eventos";
import { crearEscena3D, type CamaraEscena, type Escena3D } from "./escena3d";
import type { EntradaTactil } from "./entradaTactil";
import { interactivoDeLugar, type AvisosEscena, type PedidoEscena } from "./frontera";
import type { LugarObjetivo, VistaEscena } from "./vista";

export type { CamaraEscena } from "./escena3d";

/**
 * Props de `EscenaBase` acordadas en el issue #190 (Daniel + José), con la adición de `eventos`.
 * Si José publica el tipo en otro archivo, este se reemplaza por el import.
 */
/**
 * `PedidoEscena` y `AvisosEscena` (frontera.ts, PLAN-JUGABILIDAD §3) suman las props del bloque 0.
 * Estado: `onInteractivo` emite lugares; actores (A6), puertas y `sala` (A8), `objetivo` (A2 + marcador C4),
 * `iris` y `globo` (A2) y `hablando` (A7) se aceptan y llegan a los sistemas en `ctx.pedido` (A0), pero la
 * escena todavía no los dibuja.
 */
export interface EscenaBaseProps extends PedidoEscena, AvisosEscena {
  // Entrada (la escena solo lee esto, nunca GameState)
  vista: VistaEscena;
  /** Los eventos del último tick; la escena anima cada uno una sola vez por su id estable. */
  eventos: readonly EventoFeedback[];
  calidad: CalidadGrafica;
  camara: CamaraEscena;
  /** De ajustes: sin bamboleo ni interpolaciones de cámara. */
  movimientoReducido: boolean;

  // Salida (la escena avisa; la pantalla decide y llama al motor)
  /** Entra o sale del radio de un lugar. */
  onLugarCercano: (lugar: LugarObjetivo | null) => void;
  /** Tecla o toque de "usar". */
  onUsar: (lugar: LugarObjetivo) => void;
  /** La escena propone bajar la calidad si no rinde. */
  onCalidad: (nivel: CalidadGrafica) => void;
  /** Se perdió el contexto WebGL: la pantalla pasa al respaldo 2D. */
  onWebGLPerdido: () => void;

  // --- Frontera A/B del plan de integración (§4): props aditivas, todas opcionales. ---
  // La pantalla (A) las pasa; el mundo (B) las implementa. Sin ellas la escena se comporta como antes.
  /**
   * Destino elegido en el mapa. La escena planea la ruta (`planearRuta`) y camina hasta el punto de
   * uso del lugar. `null` o ausente: sin destino. Moverse con el teclado o el joystick lo cancela.
   */
  destino?: LugarObjetivo | null | undefined;
  /** La ruta terminó: llegó, la canceló una entrada manual, o no hay camino hasta allí. */
  onDestino?: ((evento: EventoDestino) => void) | undefined;
  /**
   * Hay un diálogo, un panel de confirmación o un campo de texto abierto: el mundo no se mueve ni se
   * "usa". Al activarse se sueltan las teclas y se cancela el joystick; la animación sigue.
   */
  bloqueado?: boolean | undefined;
  /** Posición del jugador en metros de juego, para el mapa: al moverse (como mucho 5 veces por segundo) y al detenerse. */
  onPosicion?: ((posicion: PosicionJugador) => void) | undefined;
  /** El jugador pidió cambiar de cámara con la tecla V. La pantalla es dueña de `camara`. */
  onCambiarCamara?: (() => void) | undefined;
  /**
   * La escena es dueña de los gestos táctiles (conoce la cámara y sus límites). Al montar entrega su
   * `EntradaTactil` y al desmontar entrega `null`; la capa táctil de la pantalla le pasa los punteros
   * (`iniciar`, `mover`, `terminar`, `cancelar`) y lee `estado` para dibujar el joystick.
   */
  onEntradaTactil?: ((entrada: EntradaTactil | null) => void) | undefined;
}

/** Las props de `PedidoEscena` (frontera.ts) en un objeto nuevo: los sistemas lo leen en `ctx.pedido`. */
function pedidoDe(p: PedidoEscena): PedidoEscena {
  return { objetivo: p.objetivo, iris: p.iris, globo: p.globo, hablando: p.hablando, sala: p.sala };
}

export type PosicionJugador = Readonly<{ x: number; z: number }>;
export type EventoDestino = Readonly<{ tipo: "llego" | "cancelado" | "sin_ruta"; lugar: LugarObjetivo }>;

/**
 * Monta la escena 3D en un <canvas> que ocupa su contenedor.
 *
 * El niño camina con `WASD`/flechas (relativo a la cámara), el joystick de `EntradaTactil` o el
 * destino del mapa; `E` (o Enter fuera de un botón) usa el lugar al alcance; `V` pide cambiar de
 * cámara. `onLugarCercano` se emite al montar y cada vez que cambia el lugar al alcance.
 * `destino`: la escena planea al cambiar la prop; al terminar (`onDestino`) la pantalla debería
 * volverla a `null` para poder pedir de nuevo el mismo lugar.
 * Atributos de prueba en el canvas: `data-jugador-x`, `data-jugador-z`, `data-camara` y
 * `data-lugar-cercano`, con la cadencia de `onPosicion`.
 */
export function EscenaBase(props: EscenaBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useT();
  const [punteroBloqueado, setPunteroBloqueado] = useState(false);
  const [mouse] = useState(() => typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches);
  const escenaRef = useRef<Escena3D | null>(null);
  // Siempre las últimas props para los callbacks, sin recrear la escena.
  const actuales = useRef(props);
  actuales.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = actuales.current;
    let escena: Escena3D;
    try {
      escena = crearEscena3D(canvas, {
        calidad: p.calidad,
        movimientoReducido: p.movimientoReducido,
        alPerderContexto: () => actuales.current.onWebGLPerdido(),
        alExceso: (nivel) => actuales.current.onCalidad(nivel),
        alLugarCercano: (l) => {
          actuales.current.onLugarCercano(l);
          actuales.current.onInteractivo?.(interactivoDeLugar(l));
        },
        alUsar: (l) => actuales.current.onUsar(l),
        alCambiarCamara: () => actuales.current.onCambiarCamara?.(),
        alPosicion: (pos) => actuales.current.onPosicion?.(pos),
        alDestino: (tipo, lugar) => actuales.current.onDestino?.({ tipo, lugar }),
        alPunteroBloqueado: setPunteroBloqueado,
      });
    } catch {
      // WebGL puede fallar al crear el contexto, antes de que exista el evento de pérdida.
      // La pantalla conserva sus controles y decide cómo mostrar el respaldo.
      actuales.current.onWebGLPerdido();
      return;
    }
    escenaRef.current = escena;
    escena.fijarCamara(p.camara);
    escena.fijarBloqueado(p.bloqueado ?? false);
    escena.actualizar(p.vista, p.eventos);
    escena.fijarDestino(p.destino ?? null);
    escena.fijarPedido(pedidoDe(p));

    const medir = () => escena.redimensionar(canvas.clientWidth, canvas.clientHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(canvas);

    const cercano = escena.lugarCercano();
    actuales.current.onLugarCercano(cercano);
    actuales.current.onInteractivo?.(interactivoDeLugar(cercano));
    actuales.current.onPosicion?.(escena.posicionJugador());
    actuales.current.onEntradaTactil?.(escena.entradaTactil);

    return () => {
      actuales.current.onEntradaTactil?.(null);
      observador.disconnect();
      escena.dispose();
      escenaRef.current = null;
    };
  }, []);

  useEffect(() => {
    escenaRef.current?.actualizar(props.vista, props.eventos);
  }, [props.vista, props.eventos]);

  useEffect(() => {
    escenaRef.current?.fijarCamara(props.camara);
  }, [props.camara]);

  useEffect(() => {
    escenaRef.current?.fijarCalidad(props.calidad);
  }, [props.calidad]);

  useEffect(() => {
    escenaRef.current?.fijarMovimientoReducido(props.movimientoReducido);
  }, [props.movimientoReducido]);

  useEffect(() => {
    escenaRef.current?.fijarDestino(props.destino ?? null);
  }, [props.destino]);

  useEffect(() => {
    escenaRef.current?.fijarBloqueado(props.bloqueado ?? false);
  }, [props.bloqueado]);

  useEffect(() => {
    escenaRef.current?.fijarPedido(pedidoDe(props));
  }, [props.objetivo, props.iris, props.globo, props.hablando, props.sala]);

  // Decorativo para lectores de pantalla: la lista accesible de lugares lee la misma tabla LUGARES.
  // `touch-action: none`: los gestos son del juego, la página no se desplaza ni hace zoom.
  // A12: con mouse, mientras el puntero esté libre y el mundo no esté bloqueado, un aviso dice cómo mirar.
  // Usa la cara facetada de la base (F); no captura clics (el clic va al canvas y bloquea el puntero).
  const avisoMirar = mouse && !punteroBloqueado && !props.bloqueado;
  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
      {avisoMirar && (
        <div className="fc-cara fc-chico aviso-mirar" data-aviso="mirar"
          style={{ position: "absolute", left: "50%", top: "22%", transform: "translateX(-50%)", padding: "0.4rem 0.9rem", pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span>{t("ui.escena.mirar")}</span>
        </div>
      )}
    </>
  );
}
