import { useEffect, useRef } from "react";
import type { CalidadGrafica } from "../juego/ajustes";
import type { EventoFeedback } from "../juego/eventos";
import { crearEscena3D, type CamaraEscena, type Escena3D } from "./escena3d";
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
}

/**
 * Monta la escena 3D en un <canvas> que ocupa su contenedor.
 *
 * PROVISIONAL hasta que Camilo integre navegación y joystick: el jugador está fijo en la mesa;
 * `onLugarCercano` se emite al montar con el lugar al alcance del foco de la cámara, y `onUsar`
 * se dispara con la tecla E (o Enter) cuando hay un lugar cerca y el foco no está en un campo.
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
    const escena = crearEscena3D(canvas, {
      calidad: p.calidad,
      movimientoReducido: p.movimientoReducido,
      alPerderContexto: () => actuales.current.onWebGLPerdido(),
      alExceso: (nivel) => actuales.current.onCalidad(nivel),
    });
    escenaRef.current = escena;
    escena.fijarCamara(p.camara);
    escena.actualizar(p.vista, p.eventos);

    const medir = () => escena.redimensionar(canvas.clientWidth, canvas.clientHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(canvas);

    const cercano = escena.lugarCercano();
    actuales.current.onLugarCercano(cercano);

    const alTecla = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== "e" && e.key !== "E" && e.key !== "Enter")) return;
      const destino = e.target as HTMLElement | null;
      if (destino && (destino.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(destino.tagName))) return;
      const l = escena.lugarCercano();
      if (l) actuales.current.onUsar(l);
    };
    window.addEventListener("keydown", alTecla);

    return () => {
      window.removeEventListener("keydown", alTecla);
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

  // Decorativo para lectores de pantalla: la lista accesible de lugares lee la misma tabla LUGARES.
  return <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />;
}
