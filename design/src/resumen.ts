/**
 * Datos de la pantalla final "cadena de causas" (PLAN §2.5-2.6). Solo datos.
 * Rangos e insignias como claves i18n; las reglas que las otorgan están en engine/resumen.ts.
 */

/** Rango por puntaje final 0-100. */
export const RANGOS_FINAL: readonly { desde: number; key: string }[] = [
  { desde: 85, key: "rango.comandante" },
  { desde: 65, key: "rango.piloto" },
  { desde: 40, key: "rango.cadete" },
  { desde: 0, key: "rango.aprendiz" },
];

/** Peso del resultado en el puntaje final; el resto lo dan los recursos al cierre. */
export const PESO_RESULTADO = 50;

export const INSIGNIAS = {
  /** Terminó con los 3 recursos por encima de este valor. */
  equilibrio: { minRecurso: 50, key: "insignia.equilibrio" },
  /** La IA de la base llegó a "offline" sin dañarse. */
  autonomia: { key: "insignia.autonomia" },
  /** Hubo tormenta y el blindaje nunca bajó de este valor. */
  escudo: { minBlindaje: 30, key: "insignia.escudo_solar" },
  /** Reparó la IA tras dañarse. */
  mecanica: { key: "insignia.mecanica" },
  /** Usó el "¿y si...?" al menos una vez. */
  calculo: { key: "insignia.calculo" },
} as const;

/** Cuántas causas se muestran como "las que más pesaron". */
export const CAUSAS_DESTACADAS = 3;
