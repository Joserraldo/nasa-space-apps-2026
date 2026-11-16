import type { Dialogo } from "@solar-shield/agents";
import type { BaseAction } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { describirAccion } from "./Dialogos.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import { PERSONAS, Retrato, type Persona } from "./base/Retrato.js";
import type { ActorId } from "../escena/frontera.js";
import { TarjetaFuente } from "./TarjetaFuente.js";
import "./base/facetas.css";
import "./base/retratos.css";

/** Dónde se dice una conversación (E5): línea corta en el globo sobre el actor o franja con retrato. */
export type FormaDialogo = "globo" | "franja";

/**
 * E5 (PLAN-JUGABILIDAD §4): el globo es para lo corto; la franja con el retrato B, para lo largo.
 * Va a la franja si tiene más de 2 líneas, propone una acción, cita una fuente o es una alerta.
 */
export function formaDeDialogo(d: Dialogo): FormaDialogo {
  return d.lineas.length <= 2 && !d.accion && !d.fuente && d.prioridad !== "alerta" ? "globo" : "franja";
}

/**
 * Actores que hoy están montados en la escena (`escena/tripulacionBase.ts`): el globo necesita a quién
 * anclarse. La Doctora y la Meteoróloga llegan con A6 (#382); al fusionarlo se suman aquí. Mientras
 * tanto lo que dicen va a la franja, como antes de E5.
 */
export const ACTORES_CON_GLOBO: readonly ActorId[] = ["iris", "ingeniera"];

/** Actor de la escena que dice el diálogo, o `null` si no está en el mundo y no puede llevar globo. */
export function actorDeExperto(experto: string): ActorId | null {
  const actor = (experto === "ia_base" ? "iris" : experto) as ActorId;
  return ACTORES_CON_GLOBO.includes(actor) ? actor : null;
}

/** Tiempo de lectura del globo para 7 a 10 años: 3 s más 60 ms por letra, entre 4 y 9 s. */
export function duracionGlobo(texto: string): number {
  return Math.min(9000, Math.max(4000, 3000 + 60 * texto.length));
}

/**
 * Diálogo de una experta en la franja inferior (ui/01 arriba; personajes/07 "Compare a plan" y
 * "Verify the warning"). Retrato facetado a la izquierda, nombre (`agentes.titulo.*`) y sus líneas;
 * a la derecha `Ask another expert` y `Continue`, que nunca cobran (MECANICAS §4). Si la experta
 * propone una acción, el botón abre el panel único de confirmación (no la aplica). Si cita un dato,
 * va su tarjeta de fuente.
 */
export function DialogoExperto({ d, irisDanada, soloTexto = false, onPlan, onOtra, onCerrar }: {
  d: Dialogo;
  irisDanada: boolean;
  /** Con el plan ya abierto debajo (lámina de tableta: la experta encima de la decisión), sin botones propios. */
  soloTexto?: boolean;
  /** Abre `ConfirmarAccion` con la acción propuesta. */
  onPlan(a: BaseAction): void;
  onOtra(): void;
  onCerrar(): void;
}) {
  const { t } = useT();
  const persona = (PERSONAS as readonly string[]).includes(d.experto) ? (d.experto as Persona) : null;
  const plan = d.accion && d.accion.tipo !== "simular" ? d.accion : null;
  const alerta = d.prioridad === "alerta";
  return (
    <section className="fc dialogo-experto" aria-labelledby="dialogo-experto-nombre" aria-live="polite">
      <div className={`fc-cara fc-lila dialogo-experto-cara${alerta ? " dialogo-experto-alerta" : ""}`}>
        <span className="dialogo-experto-retrato" aria-hidden="true">
          {persona
            ? <Retrato persona={persona} expresion={alerta ? "preocupada" : "habla_abierta"} danada={persona === "ia_base" && irisDanada} tam={72} />
            : <Icono nombre="tripulacion" tam={44} />}
        </span>
        <div className="dialogo-experto-texto">
          <h3 id="dialogo-experto-nombre">{t(`agentes.titulo.${d.experto}`)}</h3>
          {d.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
          {d.fuente && <TarjetaFuente fuente={d.fuente} />}
        </div>
        {!soloTexto && <div className="dialogo-experto-botones">
          {plan && (
            <FacetButton variant="primary" icon="check" labelKey="ui.base.dialogo.plan" labelVars={{ plan: describirAccion(plan, t) }}
              onClick={() => onPlan(plan)} />
          )}
          <FacetButton icon="tripulacion" labelKey="ui.base.dialogo.otra" onClick={onOtra} />
          <FacetButton variant={plan ? "secondary" : "primary"} labelKey="ui.continuar" onClick={onCerrar} />
        </div>}
      </div>
    </section>
  );
}
