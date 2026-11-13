import type { BaseAiLevel, GameState } from "@solar-shield/contracts";
import { BLINDAJE_DANA_IA, IA } from "@solar-shield/design";

/** Orden de autonomía: cuanto más a la derecha, menos ayuda. "danada" va aparte. */
const ESCALERA: readonly BaseAiLevel[] = ["tutorial", "pistas", "offline"];

function subir(nivel: BaseAiLevel): BaseAiLevel {
  const i = ESCALERA.indexOf(nivel);
  return i < 0 ? nivel : (ESCALERA[Math.min(i + 1, ESCALERA.length - 1)] as BaseAiLevel);
}
function bajar(nivel: BaseAiLevel): BaseAiLevel {
  const i = ESCALERA.indexOf(nivel);
  return i < 0 ? nivel : (ESCALERA[Math.max(i - 1, 0)] as BaseAiLevel);
}

/**
 * Actualiza rendimiento y nivel de la IA al cierre de un tick. Puro, por reglas.
 * - Todos los recursos sanos: racha sube. Alguno en peligro: error y racha a 0.
 * - Racha alta: la IA sube un nivel (se apaga antes). Errores o quietud: baja un nivel.
 * - Radiación: tormenta activa con blindaje bajo daña la IA (código, no modelo).
 */
export function actualizarIa(estado: GameState, huboDecision: boolean, senalTormenta: number): GameState {
  const r = estado.rendimiento;
  const valores = Object.values(estado.recursos);
  const sano = valores.every((v) => v >= IA.umbralSano);
  const peligro = valores.some((v) => v < IA.umbralPeligro);

  let rachaAciertos = sano ? r.rachaAciertos + 1 : 0;
  let erroresRecientes = peligro ? r.erroresRecientes + 1 : r.erroresRecientes;
  if (!peligro && estado.tick % IA.ticksParaOlvidarError === 0 && erroresRecientes > 0) erroresRecientes--;
  let ticksSinAccion = huboDecision ? 0 : r.ticksSinAccion + 1;

  let iaBase = estado.iaBase;
  const causas = [...estado.causas];

  if (iaBase !== "danada") {
    if (senalTormenta > 0 && estado.recursos.blindaje < BLINDAJE_DANA_IA[estado.dificultad]) {
      iaBase = "danada";
      causas.push({ tick: estado.tick, origen: "mala_suerte", descripcionKey: "ia.danada_por_radiacion" });
    } else if (rachaAciertos >= IA.aciertosParaSubir && iaBase !== "offline") {
      iaBase = subir(iaBase);
      rachaAciertos = 0;
      causas.push({ tick: estado.tick, origen: "sistema", descripcionKey: "ia.sube_nivel" });
    } else if (
      (erroresRecientes >= IA.erroresParaBajar || ticksSinAccion >= IA.ticksQuietoParaBajar) &&
      iaBase !== "tutorial"
    ) {
      iaBase = bajar(iaBase);
      erroresRecientes = 0;
      ticksSinAccion = 0;
      causas.push({ tick: estado.tick, origen: "sistema", descripcionKey: "ia.baja_nivel" });
    }
  }

  return { ...estado, iaBase, causas, rendimiento: { rachaAciertos, erroresRecientes, ticksSinAccion } };
}

/** La Ingeniera repara la IA: vuelve a "pistas" y el equipo queda ok. */
export function repararIa(estado: GameState): GameState {
  if (estado.iaBase !== "danada") return estado;
  return {
    ...estado,
    iaBase: "pistas",
    equipos: { ...estado.equipos, ia_base: "ok" },
    causas: [...estado.causas, { tick: estado.tick, origen: "decision", descripcionKey: "ia.reparada" }],
  };
}
