import type { BaseAction, GameState } from "@solar-shield/contracts";
import type { Mision } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { estimarDosis } from "../juego/dosis.js";

/** Un decimal como máximo, igual que el dosímetro. */
const unDecimal = (x: number) => Number(x.toFixed(1));

/**
 * Dosis proyectada de una acción, con la cuenta del motor (`estimarDosis`). Solo muestra la
 * radiación estimada: no hay cifras proyectadas de energía, soporte vital ni blindaje. Si la
 * acción no se puede aplicar, no pinta nada.
 */
export function DosisEstimada({ estado, accion, mision }: { estado: GameState; accion: BaseAction; mision: Mision }) {
  const { t } = useT();
  const estimacion = estimarDosis(estado, accion, mision);
  if (!estimacion) return null;
  const dosis = unDecimal(estimacion.dosis);
  const delta = unDecimal(estimacion.menosQueEsperar);
  return (
    <div className="dosis-estimada">
      <p>{t("ui.estimacion.dosis", { n: estimacion.turnos, dosis })}</p>
      {delta >= 0.1 && <p>{t("ui.estimacion.menos", { delta })}</p>}
    </div>
  );
}
