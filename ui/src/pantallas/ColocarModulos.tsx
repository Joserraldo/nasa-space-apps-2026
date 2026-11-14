import type { Equipment, Resource } from "@solar-shield/contracts";
import { COSTOS_ACCION, MODULOS } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";

const ICONO: Record<Resource, string> = { energia: "⚡", soporte_vital: "🫁", blindaje: "🛡️" };

function Deltas({ d }: { d: Partial<Record<Resource, number>> }) {
  return (
    <span className="fila" style={{ gap: "0.5rem" }}>
      {(Object.entries(d) as [Resource, number][]).filter(([, v]) => v !== 0).map(([r, v]) => (
        <span key={r} className={`delta ${v > 0 ? "mas" : "menos"}`}>{ICONO[r]} {v > 0 ? "+" : ""}{v}</span>
      ))}
    </span>
  );
}

/** Paso 4: colocar módulos. Cada uno muestra su costo ahora y su beneficio después. */
export function ColocarModulos({ colocados, onColocar, onListo }: { colocados: Equipment[]; onColocar: (m: Equipment) => void; onListo: () => void }) {
  const { t } = useT();
  const faltan = MISION_JEZERO.modulosAColocar - colocados.length;
  const costo = COSTOS_ACCION.colocar_modulo.inmediato;
  return (
    <section className="tarjeta columna">
      <h2>{t("ui.paso.4.titulo", { n: MISION_JEZERO.modulosAColocar })}</h2>
      <p>{t("ui.paso.4.texto")}</p>
      <div className="modulos">
        {MISION_JEZERO.modulosDisponibles.map((m) => {
          const puesto = colocados.includes(m);
          return (
            <div key={m} className="tarjeta columna">
              <h3>{t(`agentes.equipo.${m}`)}</h3>
              <div><strong>{t("ui.paso.4.costo")}:</strong> <Deltas d={costo} /></div>
              <div><strong>{t("ui.paso.4.beneficio")}:</strong> <Deltas d={MODULOS[m]} /></div>
              <button disabled={puesto || faltan <= 0} onClick={() => onColocar(m)}>{puesto ? "✓" : t("ui.paso.4.colocar")}</button>
            </div>
          );
        })}
      </div>
      <div><button disabled={faltan > 0} onClick={onListo}>{t("ui.paso.4.listo")}</button></div>
    </section>
  );
}
