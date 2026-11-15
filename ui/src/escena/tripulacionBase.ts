import * as THREE from "three";
import { animar, crearIris, crearPersonaje, type OpcionesIris } from "./personajes";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, INICIO_JUGADOR } from "./mundo";
import type { VistaEscena } from "./vista";

/** Montaje de los modelos vigentes de develop; no redefine geometrías ni balance. */
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
  ingeniera.grupo.rotation.y = Math.atan2(INICIO_JUGADOR.x - anclaje.x, INICIO_JUGADOR.z - anclaje.z);
  iris.grupo.position.set(DOCK_IRIS.x, DOCK_IRIS.y, DOCK_IRIS.z);
  iris.grupo.rotation.y = Math.atan2(INICIO_JUGADOR.x - DOCK_IRIS.x, INICIO_JUGADOR.z - DOCK_IRIS.z);
  grupo.add(jugador.grupo, ingeniera.grupo, iris.grupo);
  // Objetos reutilizados en cada frame. La física y la cámara se conectan en el siguiente lote.
  const gesto = { quieto: true };
  const rover: OpcionesIris = { quieto: true, velocidad: 0, averiada: false, cara: "atenta" };
  let liberada = false;
  const animarTripulacion = (ahoraMs: number, reducido: boolean) => {
    if (liberada) return;
    gesto.quieto = reducido;
    rover.quieto = reducido;
    const t = ahoraMs / 1000;
    animar(jugador, "reposo", t, gesto);
    animar(ingeniera, "reposo", t, gesto);
    iris.animar(t, rover);
  };
  animarTripulacion(0, true);
  return {
    grupo, jugador, ingeniera, iris,
    aplicarVista(vista: VistaEscena) {
      const offline = vista.iris.nivel === "offline";
      rover.averiada = !offline && vista.iris.averiada;
      rover.cara = offline ? "apagada" : "atenta";
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
