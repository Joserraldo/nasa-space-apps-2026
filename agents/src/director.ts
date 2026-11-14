import type { GameState } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import { escenaTormenta } from "./escenas.js";
import type { VistaAgente } from "./expertos.js";
import { irisDanada } from "./iris.js";

/**
 * Director de la tripulación: decide QUÉ dice la tripulación en cada paso, para que ui solo
 * pinte la cola. En la ruta dorada la tormenta está en el estado desde el tick 0 pero se revela
 * en el paso 5 (`tormentaActiva` del motor): antes de eso nadie habla de ella.
 */
export type VistaCompleta = VistaAgente & Pick<GameState, "rngEstado" | "orbita" | "iaBase">;

/** Vista que ven los expertos: esconde la tormenta mientras el motor no la haya revelado. */
export function vistaVisible(estado: GameState, tormentaActiva: boolean): VistaCompleta {
  return {
    recursos: estado.recursos,
    tripulacion: estado.tripulacion,
    equipos: estado.equipos,
    tormenta: tormentaActiva ? estado.tormenta : null,
    rngEstado: estado.rngEstado,
    orbita: estado.orbita,
    iaBase: estado.iaBase,
  };
}

export interface Momento {
  /** `tormentaActiva(estado)` del motor en el paso anterior y en este. */
  tormentaAntes: boolean;
  tormentaAhora: boolean;
  /** Cuántas veces ha fallado Iris ya en la partida (la 1.ª es el número falso). */
  vecesFallaIris?: number;
}

/**
 * Diálogos que dispara este paso, en orden. Paso 5→6 de la ruta dorada: cuando la tormenta se
 * revela, la escena de los dos expertos que se contradicen y, si Iris está dañada, su falla.
 */
export function dialogosDelPaso(estado: GameState, m: Momento): Dialogo[] {
  const v = vistaVisible(estado, m.tormentaAhora);
  if (!m.tormentaAhora || m.tormentaAntes) return [];
  const escena = escenaTormenta(v);
  if (!escena) return [];
  const iris = v.iaBase === "danada" ? [irisDanada(v, m.vecesFallaIris ?? 0)] : [];
  return [...escena.dialogos, ...iris];
}

const PESO: Record<Dialogo["prioridad"], number> = { alerta: 0, consejo: 1, charla: 2 };

/**
 * Cola de diálogos (uno a la vez, sin solaparse). Lo nuevo va al final, salvo que traiga una
 * alerta: entonces pasa delante de lo pendiente de menor prioridad, conservando su propio orden.
 */
export function encolar(cola: readonly Dialogo[], nuevos: readonly Dialogo[]): Dialogo[] {
  if (nuevos.length === 0) return [...cola];
  const urgente = Math.min(...nuevos.map((d) => PESO[d.prioridad]));
  if (urgente > 0) return [...cola, ...nuevos];
  const delante = cola.filter((d) => PESO[d.prioridad] === 0);
  const detras = cola.filter((d) => PESO[d.prioridad] > 0);
  return [...delante, ...nuevos, ...detras];
}
