import * as THREE from "three";
import { animar, crearIris, crearPersonaje, type CaraIris, type Gesto, type OpcionesIris } from "./personajes";
import { cadenciaCaminar } from "./personajes/animaciones";
import { VEL_JUGADOR } from "./movimientoBase";
import type { ModoGuia } from "./guia";
import type { FaseSalto } from "./movimientoBase";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, INICIO_JUGADOR } from "./mundo";
import type { VistaEscena } from "./vista";
import type { ActorId } from "./frontera";
import { gestoDe, type Reaccion, type Situacion } from "./coreografia";

/** La Ingeniera se vuelve hacia el niño cuando está a esta distancia (m). [E] */
export const DISTANCIA_ATENCION = 3.6;
/** Giro de la Ingeniera hacia el niño, rad/s. */
const GIRO_INGENIERA = 4;
/** Cara de Iris según lo que hace como guía (si no está apagada ni averiada). */
const CARA_GUIA: Readonly<Record<ModoGuia, CaraIris>> = { acompana: "atenta", guia: "atenta", espera: "pensando", llego: "feliz" };

function girarHacia(actual: number, deseado: number, max: number): number {
  const d = ((((deseado - actual + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return actual + Math.max(-max, Math.min(max, d));
}

/**
 * Montaje de los modelos vigentes de develop; no redefine geometrías ni balance. La posición del
 * niño y de Iris la escribe la escena (desde `movimientoBase`); aquí se eligen gestos, caras y el
 * giro de la Ingeniera. Sin asignaciones por fotograma.
 */
export function crearTripulacionBase() {
  const grupo = new THREE.Group();
  grupo.name = "Tripulacion_Base";
  const jugador = crearPersonaje("nino");
  const ingeniera = crearPersonaje("ingeniera");
  const iris = crearIris();
  jugador.grupo.position.set(INICIO_JUGADOR.x, 0, INICIO_JUGADOR.z);
  jugador.grupo.rotation.y = Math.PI;
  const anclaje = ANCLAJES_EXPERTAS.ingeniera;
  ingeniera.grupo.position.set(anclaje.x, anclaje.y, anclaje.z);
  const rumboIngeniera = Math.atan2(INICIO_JUGADOR.x - anclaje.x, INICIO_JUGADOR.z - anclaje.z);
  ingeniera.grupo.rotation.y = rumboIngeniera;
  iris.grupo.position.set(DOCK_IRIS.x, DOCK_IRIS.y, DOCK_IRIS.z);
  iris.grupo.rotation.y = Math.atan2(INICIO_JUGADOR.x - DOCK_IRIS.x, INICIO_JUGADOR.z - DOCK_IRIS.z);
  grupo.add(jugador.grupo, ingeniera.grupo, iris.grupo);
  // Objetos reutilizados en cada frame.
  const gesto = { quieto: true };
  /** Opciones del niño: paso según la rapidez (A4) y capa de salto (A5). */
  const gestoNino: { quieto: boolean; fase: number; ritmo: number; salto: { fase: FaseSalto; k: number } } = { quieto: true, fase: 0, ritmo: 0, salto: { fase: "suelo", k: 0 } };
  const rover: OpcionesIris = { quieto: true, velocidad: 0, averiada: false, cara: "atenta" };
  /** Lo escribe la escena en cada fotograma, después de mover a los actores (`errorIris`, al cambiar el pedido). */
  const actores = {
    caminando: false, velocidad: 0, salto: { fase: "suelo", k: 0 } as Readonly<{ fase: FaseSalto; k: number }>, velocidadIris: 0,
    modoIris: "acompana" as ModoGuia, errorIris: false,
    /** Quién habla en el diálogo abierto (A7, del pedido de la pantalla). */
    hablando: null as ActorId | null,
    /** Última reacción a un evento del motor y cuándo llegó (ms, mismo reloj que `animar`). */
    reaccion: null as { tipo: Reaccion; desdeMs: number } | null,
  };
  let vistaActual: VistaEscena | null = null;
  /** Situación de la coreografía, reutilizada en cada fotograma. */
  const situacion: Situacion = { t: 0, vista: null, hablando: null, reaccion: null, cerca: -1, caminando: false };
  const reaccionVista = { tipo: "averia" as Reaccion, hace: 0 };
  let apagada = false;
  let atendiendoDesde = -1;
  let ultimoMs = -1;
  let liberada = false;
  const animarTripulacion = (ahoraMs: number, reducido: boolean) => {
    if (liberada) return;
    gesto.quieto = reducido;
    rover.quieto = reducido;
    const t = ahoraMs / 1000;
    const dt = ultimoMs >= 0 ? Math.min(0.1, Math.max(0, (ahoraMs - ultimoMs) / 1000)) : 0;
    ultimoMs = ahoraMs;

    // Coreografía (A7): lo común a todos los actores en este fotograma.
    situacion.t = t;
    situacion.vista = vistaActual;
    situacion.hablando = actores.hablando;
    if (actores.reaccion) {
      reaccionVista.tipo = actores.reaccion.tipo;
      reaccionVista.hace = Math.max(0, (ahoraMs - actores.reaccion.desdeMs) / 1000);
      situacion.reaccion = reaccionVista;
    } else situacion.reaccion = null;

    // El niño camina con el gesto de caminar; quieto, en reposo (con movimiento reducido, la pose clave).
    // La cadencia y el largo del paso siguen a la rapidez real: arranca y frena con pasos cortos (A4).
    gestoNino.quieto = reducido;
    gestoNino.ritmo = Math.min(1, actores.velocidad / VEL_JUGADOR);
    gestoNino.fase = actores.caminando ? (gestoNino.fase + cadenciaCaminar(gestoNino.ritmo) * dt) % (Math.PI * 2) : 0;
    gestoNino.salto.fase = actores.salto.fase;
    gestoNino.salto.k = actores.salto.k;
    situacion.caminando = actores.caminando;
    situacion.cerca = -1;
    animar(jugador, gestoDe("nino", situacion), t, gestoNino);

    // La Ingeniera: la coreografía elige el gesto (saluda, explica, escucha, trabaja en su estación o
    // reacciona). Mira al niño cuando está cerca o cuando ella habla; si no, a su puesto.
    const p = jugador.grupo.position, q = ingeniera.grupo.position;
    const cerca = Math.hypot(p.x - q.x, p.z - q.z) <= DISTANCIA_ATENCION;
    if (cerca) {
      if (atendiendoDesde < 0) atendiendoDesde = ahoraMs;
    } else atendiendoDesde = -1;
    situacion.caminando = false;
    situacion.cerca = cerca ? (ahoraMs - atendiendoDesde) / 1000 : -1;
    const g: Gesto = gestoDe("ingeniera", situacion);
    const deseado = cerca || actores.hablando === "ingeniera" ? Math.atan2(p.x - q.x, p.z - q.z) : rumboIngeniera;
    ingeniera.grupo.rotation.y = reducido ? deseado : girarHacia(ingeniera.grupo.rotation.y, deseado, GIRO_INGENIERA * dt);
    animar(ingeniera, g, t, gesto);

    // Iris: ruedas con su rapidez real y cara según lo que hace.
    rover.velocidad = actores.velocidadIris;
    // La guía pide cara de error (avería revelada): la muestra aunque la vista todavía no la marque averiada.
    if (!apagada) rover.cara = actores.errorIris ? "error" : CARA_GUIA[actores.modoIris];
    iris.animar(t, rover);
  };
  animarTripulacion(0, true);
  return {
    grupo, jugador, ingeniera, iris, actores,
    aplicarVista(vista: VistaEscena) {
      vistaActual = vista;
      apagada = vista.iris.nivel === "offline";
      rover.averiada = !apagada && vista.iris.averiada;
      rover.cara = apagada ? "apagada" : CARA_GUIA[actores.modoIris];
    },
    animar: animarTripulacion,
    liberar() {
      if (liberada) return;
      liberada = true;
      // Cada fábrica libera también su esqueleto; el liberador genérico de mallas no lo hace.
      grupo.removeFromParent();
      jugador.liberar();
      ingeniera.liberar();
      iris.liberar();
    },
  };
}
export type TripulacionBase = ReturnType<typeof crearTripulacionBase>;
