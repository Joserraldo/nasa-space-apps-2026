import { useEffect, useRef, useState } from "react";
import type { GameState } from "@solar-shield/contracts";
import { dosisMaximaTripulacion, enRefugio, factorEscudo, tormentaActiva } from "@solar-shield/engine";
import type { Mision } from "@solar-shield/missions";

/**
 * Tasa observada de dosis entre dos lecturas consecutivas del HUD. Solo hay tasa si la lectura
 * anterior existe y es del turno justo anterior; el resultado nunca es negativo (el motor puede
 * bajar la dosis de un tripulante al cambiar quién está disponible).
 */
export function calcularTasa(
  previa: { tick: number; dosis: number } | null,
  actual: { tick: number; dosis: number },
): number | undefined {
  if (previa === null || actual.tick !== previa.tick + 1) return undefined;
  return Math.max(0, actual.dosis - previa.dosis);
}

/** Lo que pinta el dosímetro del HUD: lectura actual, límite de entrenamiento, tasa y protección. */
export interface DatosDosimetro {
  dosis: number;
  limite?: number | undefined;
  tasa?: number | undefined;
  protegido: boolean;
}

/**
 * Dosímetro del HUD (issue de radiación): lee la dosis máxima de la tripulación con el motor y la
 * tasa observada turno a turno. Solo tiene datos mientras hay tormenta; antes de eso devuelve
 * `undefined` y el HUD no lo pinta. El límite es el de entrenamiento de la misión, no un umbral médico.
 */
export function useDosimetro(estado: GameState, mision: Mision): DatosDosimetro | undefined {
  const dosis = dosisMaximaTripulacion(estado);
  const anterior = useRef<{ tick: number; dosis: number } | null>(null);
  const [tasa, setTasa] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Solo una lectura por turno: dentro del mismo tick el ref no se mueve.
    if (anterior.current?.tick === estado.tick) return;
    setTasa(calcularTasa(anterior.current, { tick: estado.tick, dosis }));
    anterior.current = { tick: estado.tick, dosis };
  }, [estado.tick, dosis]);

  if (!tormentaActiva(estado, mision)) return undefined;
  return {
    dosis,
    limite: mision.limiteDosisMSv,
    tasa,
    // Lo que protege el turno siguiente: refugio ya activo o escudo que reduce la dosis.
    protegido: enRefugio({ causas: estado.causas, tick: estado.tick + 1 }) || factorEscudo({ causas: estado.causas, tick: estado.tick + 1 }) < 1,
  };
}
