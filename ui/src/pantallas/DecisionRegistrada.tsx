import type { GameState, Resource } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { CostRow, Mensaje } from "../componentes/base/Piezas.js";
import "../componentes/base/facetas.css";
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
 * El niño y Iris a la izquierda; "Action confirmed", el costo aplicado y el beneficio pendiente a
 * la derecha, y "Return to exploration" para seguir.
 */
export function DecisionRegistrada({ antes, despues, onContinuar }: { antes: GameState; despues: GameState; onContinuar(): void }) {
  const { t } = useT();
  const { ahora, despuesDe, turnos } = cobradoPor(antes, despues);
  return (
    <div className="decision" role="status" aria-live="polite">
      <div className="decision-personajes">
        <ExpertPortrait persona="nino" compacto />
        <ExpertPortrait persona="ia_base" compacto />
      </div>
      <div className="decision-detalle">
        <Mensaje tipo="exito" tituloKey="ui.decision.confirmada" />
        <CostRow inmediato={ahora} retrasado={despuesDe} />
        {turnos !== null && <Mensaje tipo="pendiente" tituloKey="ui.comun.pendiente.titulo" detalleKey="ui.comun.pendiente.turnos" vars={{ n: turnos }} />}
        <FacetButton variant="primary" icon="jugar" labelKey="ui.decision.volver" onClick={onContinuar} />
      </div>
    </div>
  );
}
