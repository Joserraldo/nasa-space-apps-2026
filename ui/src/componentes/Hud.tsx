import type { GameState, Resource } from "@solar-shield/contracts";
import { useT } from "../i18n.js";

const ICONO: Record<Resource, string> = { energia: "⚡", soporte_vital: "🫁", blindaje: "🛡️" };
const RECURSOS: Resource[] = ["energia", "soporte_vital", "blindaje"];

export function Hud({ estado }: { estado: GameState }) {
  const { t } = useT();
  return (
    <section className="hud" aria-label={t("ui.recurso.energia") + ", " + t("ui.recurso.soporte_vital") + ", " + t("ui.recurso.blindaje")}>
      {RECURSOS.map((r) => {
        const v = Math.round(estado.recursos[r]);
        return (
          <div key={r} className={`medidor ${r} ${v < 25 ? "bajo" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={t(`ui.recurso.${r}`)}>
            <div className="nombre">
              <span><span className="icono" aria-hidden="true">{ICONO[r]}</span> {t(`ui.recurso.${r}`)}</span>
              <span className="valor">{v}%</span>
            </div>
            <div className="pista"><div className="relleno" style={{ width: `${v}%` }} /></div>
          </div>
        );
      })}
    </section>
  );
}
