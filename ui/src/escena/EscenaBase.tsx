import { useEffect, useRef } from "react";
import type { CalidadGrafica } from "../juego/ajustes";
import type { EventoFeedback } from "../juego/eventos";
import { crearEscena3D, type CamaraEscena, type Escena3D } from "./escena3d";
import type { EntradaTactil } from "./entradaTactil";
import type { LugarObjetivo, VistaEscena } from "./vista";

export type { CamaraEscena } from "./escena3d";

/**
 * Props de `EscenaBase` acordadas en el issue #190 (Daniel + José), con la adición de `eventos`.
 * Si José publica el tipo en otro archivo, este se reemplaza por el import.
 */
export interface EscenaBaseProps {
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
        alLugarCercano: (l) => actuales.current.onLugarCercano(l),
        alUsar: (l) => actuales.current.onUsar(l),
        alCambiarCamara: () => actuales.current.onCambiarCamara?.(),
        alPosicion: (pos) => actuales.current.onPosicion?.(pos),
        alDestino: (tipo, lugar) => actuales.current.onDestino?.({ tipo, lugar }),
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

    const medir = () => escena.redimensionar(canvas.clientWidth, canvas.clientHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(canvas);

    actuales.current.onLugarCercano(escena.lugarCercano());
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

  // Decorativo para lectores de pantalla: la lista accesible de lugares lee la misma tabla LUGARES.
  // `touch-action: none`: los gestos son del juego, la página no se desplaza ni hace zoom.
  return <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />;
}
