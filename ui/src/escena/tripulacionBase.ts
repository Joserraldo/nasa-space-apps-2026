import * as THREE from "three";
import { animar, crearIris, crearPersonaje, type CaraIris, type Gesto, type OpcionesIris } from "./personajes";
import type { ModoGuia } from "./guia";
import type { FaseSalto } from "./movimientoBase";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, INICIO_JUGADOR } from "./mundo";
import type { VistaEscena } from "./vista";

/** La Ingeniera se vuelve hacia el niño cuando está a esta distancia (m). [E] */
export const DISTANCIA_ATENCION = 3.6;
/** Al acercarse el niño, saluda este tiempo y después explica. */
const MS_SALUDO = 1600;
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
  /** Opciones del niño: las del resto más la capa de salto (A5). */
  const gestoNino: { quieto: boolean; salto: { fase: FaseSalto; k: number } } = { quieto: true, salto: { fase: "suelo", k: 0 } };
  const rover: OpcionesIris = { quieto: true, velocidad: 0, averiada: false, cara: "atenta" };
  /** Lo escribe la escena en cada fotograma, después de mover a los actores (`errorIris`, al cambiar el pedido). */
  const actores = { caminando: false, salto: { fase: "suelo", k: 0 } as Readonly<{ fase: FaseSalto; k: number }>, velocidadIris: 0, modoIris: "acompana" as ModoGuia, errorIris: false };
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

    // El niño camina con el gesto de caminar; quieto, en reposo (con movimiento reducido, la pose clave).
    gestoNino.quieto = reducido;
    gestoNino.salto.fase = actores.salto.fase;
    gestoNino.salto.k = actores.salto.k;
    animar(jugador, actores.caminando ? "caminar" : "reposo", t, gestoNino);

    // La Ingeniera se vuelve hacia el niño si está cerca: saluda y después explica.
    const p = jugador.grupo.position, q = ingeniera.grupo.position;
    const cerca = Math.hypot(p.x - q.x, p.z - q.z) <= DISTANCIA_ATENCION;
    let g: Gesto = "reposo";
    let deseado = rumboIngeniera;
    if (cerca) {
      if (atendiendoDesde < 0) atendiendoDesde = ahoraMs;
      g = ahoraMs - atendiendoDesde < MS_SALUDO ? "saludar" : "explicar";
      deseado = Math.atan2(p.x - q.x, p.z - q.z);
    } else atendiendoDesde = -1;
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
