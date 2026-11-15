import type { Resource } from "@solar-shield/contracts";
import { useT } from "../../i18n.js";
import { FacetButton } from "./FacetButton.js";
import { BarraSeccion } from "./PanelFacetado.js";
import { CostRow } from "./Piezas.js";
import "./facetas.css";
import "./paneles.css";

/**
 * Tarjeta "Decision recorded" (ui/04 panel 04): "Action confirmed", el costo que de verdad se
 * aplicó (`CostRow`), "Benefit pending" si hay algo por llegar y la acción para volver a explorar.
 * Solo pinta lo que recibe: los números son los del motor. "View decision log" aparece solo si se
 * pasa `onVerRegistro` (el registro es opcional).
 */
type Delta = Partial<Record<Resource, number>>;

export function TarjetaDecision({ aplicado, retrasado, beneficioPendiente, onVolver, onVerRegistro }: {
  /** Costo ya aplicado al confirmar (el `inmediato` del motor). */
  aplicado: Delta;
  /** Efecto que llega después; si trae algo, se muestra "Benefit pending". */
  retrasado?: Delta | undefined;
  /** Fuerza o apaga "Benefit pending"; por defecto, hay algo en `retrasado`. */
  beneficioPendiente?: boolean | undefined;
  onVolver(): void;
  onVerRegistro?: (() => void) | undefined;
}) {
  const { t } = useT();
  const pendiente = beneficioPendiente ?? Object.values(retrasado ?? {}).some((v) => v);
  return (
    <div className="fc td" role="status" aria-label={t("ui.comun.decision.confirmada")}>
      <div className="fc-cara fc-chico td-cara">
        <BarraSeccion icono="check_exito" tituloKey="ui.comun.decision.confirmada" className="td-titulo" />
        <CostRow inmediato={aplicado} compacta />
        {pendiente && <BarraSeccion icono="reloj" tituloKey="ui.comun.pendiente.titulo" className="td-pendiente" />}
        <div className="td-botones">
          <FacetButton icon="flecha_derecha" labelKey="ui.comun.decision.volver" onClick={onVolver} />
          {onVerRegistro && <FacetButton icon="libro" labelKey="ui.comun.decision.registro" onClick={onVerRegistro} />}
        </div>
      </div>
    </div>
  );
}
