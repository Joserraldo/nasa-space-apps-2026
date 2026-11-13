import type { MissionGoal } from "@solar-shield/contracts";
import { PESOS_SITIO, RANGOS_SITIO, type CriterioSitio } from "@solar-shield/design";

/** Forma mínima de un sitio candidato tal como lo publica datos en data/terreno/<lugar>.json. */
export interface CandidatoSitio {
  id: string;
  nombreKey: string;
  puntajes: Record<CriterioSitio, number>;
}

export interface PuntajeSitio {
  id: string;
  nombreKey: string;
  /** Aporte de cada criterio ya ponderado, para la pantalla "por qué". */
  porCriterio: Record<CriterioSitio, number>;
  total: number;
  rangoKey: string;
}

/** Puntaje 0-1 de un sitio con 3 criterios, ponderados por el objetivo. Puro. */
export function puntuarSitio(candidato: CandidatoSitio, objetivo: MissionGoal): PuntajeSitio {
  const pesos = PESOS_SITIO[objetivo];
  const porCriterio = {
    plano: candidato.puntajes.plano * pesos.plano,
    luz: candidato.puntajes.luz * pesos.luz,
    blindaje: candidato.puntajes.blindaje * pesos.blindaje,
  };
  const total = Math.round((porCriterio.plano + porCriterio.luz + porCriterio.blindaje) * 1000) / 1000;
  const rango = RANGOS_SITIO.find((r) => total >= r.desde) ?? RANGOS_SITIO[RANGOS_SITIO.length - 1]!;
  return { id: candidato.id, nombreKey: candidato.nombreKey, porCriterio, total, rangoKey: rango.key };
}

/** Ordena candidatos de mejor a peor para el objetivo. Empates por id para que sea estable. */
export function ordenarSitios(candidatos: readonly CandidatoSitio[], objetivo: MissionGoal): PuntajeSitio[] {
  return candidatos
    .map((c) => puntuarSitio(c, objetivo))
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
}
