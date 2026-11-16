import { useEffect, useRef } from "react";
import type { BaseAction, GameState } from "@solar-shield/contracts";
import { costoDe, puedeAplicar } from "@solar-shield/engine";
import type { Mision } from "@solar-shield/missions";
import { misionActiva } from "../../juego/misiones.js";
import { useT } from "../../i18n.js";
import { describirAccion } from "../Dialogos.js";
import { FacetButton } from "./FacetButton.js";
import { CostRow } from "./Piezas.js";
import "./facetas.css";

/**
 * El único panel de confirmación del juego (APLICACION §5): construir, dilema, telemetría.
 * Los costos salen del motor (`costoDe`) y si el motor no deja hacer la acción (`puedeAplicar`)
 * el botón queda no disponible con el motivo escrito. `onConfirmar` es el único punto que pide
 * ejecutar. Al abrir: foco en la acción; `Escape` cancela.
 */
export interface ConfirmarAccionProps {
  estado: GameState;
  accion: BaseAction;
  /** Misión del nivel: los costos de los módulos pueden cambiar por misión. Por defecto, Jezero. */
  mision?: Mision;
  onCancelar(): void;
  onConfirmar(accion: BaseAction): void;
}

export function ConfirmarAccion({ estado, accion, mision = misionActiva(), onCancelar, onConfirmar }: ConfirmarAccionProps) {
  const { t } = useT();
  const panel = useRef<HTMLDivElement>(null);
  const { inmediato, retrasado } = costoDe(accion, mision);
  const permiso = puedeAplicar(estado, accion, mision);

  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCancelar]);

  const motivoKey = permiso.ok ? undefined : `ui.comun.motivo.${permiso.motivo}${permiso.recurso ? `.${permiso.recurso}` : ""}`;
  return (
    <div className="fc confirmar-entrada">
      <div ref={panel} className="fc-cara confirmar" role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo">
        <div className="confirmar-cab">
          <h3 id="confirmar-titulo">{describirAccion(accion, t)}</h3>
          {estado.pausado && <span className="confirmar-pausa">{t("ui.comun.pausado")}</span>}
        </div>
        <CostRow inmediato={inmediato} retrasado={retrasado} />
        <div className="confirmar-botones">
          <FacetButton variant="primary" icon="check" labelKey="ui.comun.confirmar" disabled={!permiso.ok} disabledReasonKey={motivoKey}
            onClick={() => onConfirmar(accion)} />
          <FacetButton labelKey="ui.comun.atras" onClick={onCancelar} />
        </div>
      </div>
    </div>
  );
}
