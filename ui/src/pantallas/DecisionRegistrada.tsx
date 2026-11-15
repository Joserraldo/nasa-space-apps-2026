import type { GameState, Resource } from "@solar-shield/contracts";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { TarjetaDecision } from "../componentes/base/TarjetaDecision.js";
import "./decision.css";

type Deltas = Partial<Record<Resource, number>>;
const sumar = (d: Deltas, r: Resource, v: number) => { d[r] = (d[r] ?? 0) + v; };

/**
 * Lo que el motor cobró entre `antes` y `despues`: causas nuevas de la decisión (costo ahora) y
 * efectos pendientes nuevos (después). Sin recalcular nada a mano; los números son los del estado.
 */
export function cobradoPor(antes: GameState, despues: GameState) {
  const ahora: Deltas = {};
  for (const c of despues.causas.slice(antes.causas.length)) if (c.origen === "decision" && c.recurso && c.delta) sumar(ahora, c.recurso, c.delta);
  const viejos = new Set(antes.efectosPendientes.map((e) => e.id));
  const nuevos = despues.efectosPendientes.filter((e) => !viejos.has(e.id));
  const despuesDe: Deltas = {};
  for (const e of nuevos) if (!e.oculto) sumar(despuesDe, e.recurso, e.delta);
  const turnos = nuevos.length ? Math.max(0, Math.min(...nuevos.map((e) => e.aplicaEnTick)) - despues.tick) : null;
  return { ahora, despuesDe, turnos };
}

/**
 * Panel 04 de ui/04 "Decision recorded": tarjeta reutilizable tras toda acción confirmada (E7 y E6).
 * El niño y Iris a la izquierda y, a la derecha, la `TarjetaDecision` con el costo que cobró el motor.
 */
export function DecisionRegistrada({ antes, despues, onContinuar }: { antes: GameState; despues: GameState; onContinuar(): void }) {
  const { ahora, despuesDe } = cobradoPor(antes, despues);
  return (
    <div className="decision">
      <div className="decision-personajes">
        <ExpertPortrait persona="nino" expresion="feliz" compacto />
        <ExpertPortrait persona="ia_base" compacto />
      </div>
      <TarjetaDecision aplicado={ahora} retrasado={despuesDe} onVolver={onContinuar} />
    </div>
  );
}
