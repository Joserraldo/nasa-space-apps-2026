import type { Action, Expert, SourceCard } from "@solar-shield/contracts";

/**
 * Lo que agentes entrega a ui. ui solo pinta: resuelve cada clave en i18n y rellena `{var}`.
 * Convención: una variable cuyo nombre termina en `Key` es otra clave i18n que ui también traduce.
 * Las cifras de `vars` salen del GameState o de data/ (con `fuente`), nunca del modelo.
 */
export interface Linea {
  clave: string;
  vars?: Record<string, string | number>;
}

export interface Dialogo {
  experto: Expert | "ia_base";
  /** alerta interrumpe a consejo y a charla (cola de diálogos, P3). */
  prioridad: "alerta" | "consejo" | "charla";
  lineas: Linea[];
  /** Fuente del dato citado; ui muestra la tarjeta. Ausente = la cifra es del estado del juego. */
  fuente?: SourceCard;
  /** Acción propuesta para que el jugador la confirme; agentes nunca la aplica solo. */
  accion?: Action;
}

/** Dosis de referencia que pasa quien integra (sale de `radiacion` en @solar-shield/data). */
export interface ReferenciaDosis {
  valor: number;
  unidad: "mSv/día";
  fuente: SourceCard;
}
