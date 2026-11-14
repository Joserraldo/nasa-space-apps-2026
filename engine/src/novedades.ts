import type { Cause, GameState } from "@solar-shield/contracts";
import { tormentaActiva } from "./dorada.js";

/**
 * Qué pasó entre dos estados consecutivos, para que ui pause y muestre lo correcto
 * (ORQUESTACION: pausa automática en tormenta, avería y consejo). Puro: compara, no cambia nada.
 */
export interface Novedades {
  tormentaLlego: boolean;
  /** Equipos que pasaron de ok a averiado/destruido en este paso. */
  averiasNuevas: GameState["tripulacion"][number]["id"][] | string[];
  /** Causas registradas en este paso (consumo, efectos que llegaron, mala suerte, IA). */
  causasNuevas: Cause[];
  /** Efectos con retraso que llegaron ahora (beneficio de una decisión anterior o telemetría). */
  efectosLlegaron: Cause[];
  malaSuerte: Cause[];
  iaCambio: { de: GameState["iaBase"]; a: GameState["iaBase"] } | null;
  termino: GameState["resultado"] | null;
  /** true si alguna de las anteriores merece pausar el reloj. */
  pausar: boolean;
}

export function novedades(antes: GameState, despues: GameState): Novedades {
  const causasNuevas = despues.causas.slice(antes.causas.length);
  const averiasNuevas = (Object.keys(despues.equipos) as (keyof GameState["equipos"])[]).filter(
    (e) => antes.equipos[e] === "ok" && despues.equipos[e] !== "ok",
  );
  const tormentaLlego = !tormentaActiva(antes) && tormentaActiva(despues);
  const efectosLlegaron = causasNuevas.filter(
    (c) => c.origen === "decision" && c.tick === despues.tick && (c.delta ?? 0) > 0,
  );
  const malaSuerte = causasNuevas.filter((c) => c.origen === "mala_suerte");
  const iaCambio = antes.iaBase === despues.iaBase ? null : { de: antes.iaBase, a: despues.iaBase };
  const termino = antes.resultado === "en_curso" && despues.resultado !== "en_curso" ? despues.resultado : null;
  const pausar =
    tormentaLlego || averiasNuevas.length > 0 || malaSuerte.length > 0 || iaCambio !== null || termino !== null;
  return { tormentaLlego, averiasNuevas, causasNuevas, efectosLlegaron, malaSuerte, iaCambio, termino, pausar };
}

/** Avanza y, si hubo algo que merezca atención, deja el estado en pausa. ui decide cuándo reanudar. */
export function conPausaAutomatica(antes: GameState, despues: GameState): GameState {
  return novedades(antes, despues).pausar ? { ...despues, pausado: true } : despues;
}
