import type { Cause, CauseOrigin, GameState, Resource } from "@solar-shield/contracts";
import { CAUSAS_DESTACADAS, INSIGNIAS, PESO_RESULTADO, RANGOS_FINAL } from "@solar-shield/design";

export interface TotalesPorOrigen {
  decision: number;
  mala_suerte: number;
  sistema: number;
}

export interface ResumenPartida {
  resultado: GameState["resultado"];
  seed: string;
  dias: number;
  ticks: number;
  recursos: GameState["recursos"];
  /** Suma de daño (deltas negativos) por origen, para el gráfico "decisión vs mala suerte". */
  danoPorOrigen: TotalesPorOrigen;
  /** Porcentaje del daño total que vino de decisiones (0-100). Meta de diseño: ~70. */
  pctDecision: number;
  /** Las causas con más impacto negativo, para la pantalla final. */
  causasDestacadas: Cause[];
  /**
   * Por qué terminó la partida, solo en derrota (null en victoria o en curso). Sigue el mismo orden
   * que el fin de partida del motor: recurso a cero > límite de radiación > plazo agotado.
   * Es solo para la pantalla final: no está en `estado.causas` y no cuenta como daño.
   */
  causaTerminal: Cause | null;
  /** Por recurso: daño acumulado por decisión y por mala suerte. */
  porRecurso: Record<Resource, TotalesPorOrigen>;
  puntaje: number;
  rangoKey: string;
  insigniasKeys: string[];
  /** Tarjeta de ciencia: la tormenta real jugada, si hubo. */
  tormentaId: string | null;
}

const ORIGENES: readonly CauseOrigin[] = ["decision", "mala_suerte", "sistema"];
const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];
/** Causas que terminan la partida sin recurso ni delta (no suman como daño). */
const CAUSAS_TERMINALES: readonly string[] = ["causa.limite_radiacion"];

function vacio(): TotalesPorOrigen {
  return { decision: 0, mala_suerte: 0, sistema: 0 };
}

/**
 * Motivo de una derrota, en el mismo orden que el fin de partida de `avanzarTick` (engine/src/acciones.ts):
 * un recurso a cero manda; si no, la causa de radiación que registró el motor; si no, se acabó el plazo.
 */
function causaTerminalDe(estado: GameState): Cause | null {
  if (estado.resultado !== "fallo") return null;
  const agotado = RECURSOS.find((r) => estado.recursos[r] <= 0);
  if (agotado) return { tick: estado.tick, origen: "sistema", descripcionKey: `causa.recurso_agotado.${agotado}` };
  const radiacion = [...estado.causas].reverse().find((c) => CAUSAS_TERMINALES.includes(c.descripcionKey));
  if (radiacion) return radiacion;
  return { tick: estado.tick, origen: "sistema", descripcionKey: "causa.plazo_agotado" };
}

/** Orden de las causas destacadas: primero el delta más negativo; empate, el tick más temprano. */
function porDano(a: Cause, b: Cause): number {
  return (a.delta ?? 0) - (b.delta ?? 0) || a.tick - b.tick;
}

/** Resumen puro de una partida terminada (o en curso) a partir del registro de causas. */
export function resumenPartida(estado: GameState): ResumenPartida {
  const danoPorOrigen = vacio();
  const porRecurso = { energia: vacio(), soporte_vital: vacio(), blindaje: vacio() };

  for (const c of estado.causas) {
    if (c.delta === undefined || c.delta >= 0 || !c.recurso) continue;
    const d = -c.delta;
    danoPorOrigen[c.origen] += d;
    porRecurso[c.recurso][c.origen] += d;
  }
  const danoJugado = danoPorOrigen.decision + danoPorOrigen.mala_suerte;
  const pctDecision = danoJugado === 0 ? 0 : Math.round((danoPorOrigen.decision / danoJugado) * 100);

  const causasDestacadas = estado.causas
    .filter((c) => c.delta !== undefined && c.delta < 0 && c.origen !== "sistema")
    .sort(porDano)
    .slice(0, CAUSAS_DESTACADAS);

  // El daño de la tormenta no puede tapar todas las decisiones del niño: si ninguna de las
  // destacadas es una decisión y hay decisiones con daño, la última cede su lugar a la peor.
  if (!causasDestacadas.some((c) => c.origen === "decision")) {
    const decisionMasDura = estado.causas
      .filter((c) => c.origen === "decision" && c.delta !== undefined && c.delta < 0)
      .sort(porDano)[0];
    if (decisionMasDura && causasDestacadas.length > 0) {
      causasDestacadas[causasDestacadas.length - 1] = decisionMasDura;
      causasDestacadas.sort(porDano);
    }
  }

  const causaTerminal = causaTerminalDe(estado);

  const mediaRecursos = RECURSOS.reduce((acc, r) => acc + estado.recursos[r], 0) / RECURSOS.length;
  const puntaje = Math.round(
    (estado.resultado === "exito" ? PESO_RESULTADO : 0) + (mediaRecursos / 100) * (100 - PESO_RESULTADO),
  );
  const rango = RANGOS_FINAL.find((r) => puntaje >= r.desde) ?? RANGOS_FINAL[RANGOS_FINAL.length - 1]!;

  const keys = estado.causas.map((c) => c.descripcionKey);
  const minBlindajeHistorico = minimoHistorico(estado, "blindaje");
  const insigniasKeys: string[] = [];
  if (RECURSOS.every((r) => estado.recursos[r] >= INSIGNIAS.equilibrio.minRecurso)) insigniasKeys.push(INSIGNIAS.equilibrio.key);
  if (estado.iaBase === "offline" && !keys.includes("ia.danada_por_radiacion")) insigniasKeys.push(INSIGNIAS.autonomia.key);
  if (estado.tormenta && minBlindajeHistorico >= INSIGNIAS.escudo.minBlindaje) insigniasKeys.push(INSIGNIAS.escudo.key);
  if (keys.includes("ia.reparada")) insigniasKeys.push(INSIGNIAS.mecanica.key);
  if (keys.includes("causa.simular")) insigniasKeys.push(INSIGNIAS.calculo.key);

  return {
    resultado: estado.resultado,
    seed: estado.seed,
    dias: estado.dia,
    ticks: estado.tick,
    recursos: estado.recursos,
    danoPorOrigen,
    pctDecision,
    causasDestacadas,
    causaTerminal,
    porRecurso,
    puntaje,
    rangoKey: rango.key,
    insigniasKeys,
    tormentaId: estado.tormenta?.id ?? null,
  };
}

/**
 * Reconstruye el mínimo histórico de un recurso desde las causas (el estado no guarda historial).
 * Recorre los deltas hacia atrás desde el valor final; el tope 100 y el piso 0 ya se aplicaron al jugar,
 * así que es una aproximación conservadora: nunca reporta un mínimo más alto que el real.
 */
export function minimoHistorico(estado: GameState, recurso: Resource): number {
  let valor = estado.recursos[recurso];
  let minimo = valor;
  for (let i = estado.causas.length - 1; i >= 0; i--) {
    const c = estado.causas[i]!;
    if (c.recurso !== recurso || c.delta === undefined) continue;
    valor = Math.min(100, valor - c.delta);
    minimo = Math.min(minimo, valor);
  }
  return Math.max(0, minimo);
}

export { ORIGENES };
