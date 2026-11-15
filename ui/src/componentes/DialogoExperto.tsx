import type { Dialogo } from "@solar-shield/agents";
import type { BaseAction } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { describirAccion } from "./Dialogos.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import { PERSONAS, Retrato, type Persona } from "./base/Retrato.js";
import { TarjetaFuente } from "./TarjetaFuente.js";
import "./base/facetas.css";
import "./base/retratos.css";

/**
 * Diálogo de una experta en la franja inferior (ui/01 arriba; personajes/07 "Compare a plan" y
 * "Verify the warning"). Retrato facetado a la izquierda, nombre (`agentes.titulo.*`) y sus líneas;
 * a la derecha `Ask another expert` y `Continue`, que nunca cobran (MECANICAS §4). Si la experta
 * propone una acción, el botón abre el panel único de confirmación (no la aplica). Si cita un dato,
 * va su tarjeta de fuente.
 */
export function DialogoExperto({ d, irisDanada, onPlan, onOtra, onCerrar }: {
  d: Dialogo;
  irisDanada: boolean;
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
        <div className="dialogo-experto-botones">
          {plan && (
            <FacetButton variant="primary" icon="check" labelKey="ui.base.dialogo.plan" labelVars={{ plan: describirAccion(plan, t) }}
              onClick={() => onPlan(plan)} />
          )}
          <FacetButton icon="tripulacion" labelKey="ui.base.dialogo.otra" onClick={onOtra} />
          <FacetButton variant={plan ? "secondary" : "primary"} labelKey="ui.continuar" onClick={onCerrar} />
        </div>
      </div>
    </section>
  );
}
