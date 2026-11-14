import type { GameState } from "@solar-shield/contracts";
import { terrenoJezero } from "@solar-shield/data";
import { ordenarSitios, type PuntajeSitio } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { FuenteTerreno } from "../componentes/TarjetaFuente.js";

const CRITERIOS = ["plano", "luz", "blindaje"] as const;

/** Paso 3: sitios candidatos reales de Jezero (Mars Trek) con 3 criterios; ninguno gana en todo. */
export function ElegirSitio({ estado, onElegir }: { estado: GameState; onElegir: (s: PuntajeSitio) => void }) {
  const { t } = useT();
  const sitios = ordenarSitios(terrenoJezero.sitios, estado.objetivo);
  const porId = new Map(terrenoJezero.sitios.map((s) => [s.id, s]));
  return (
    <section className="tarjeta columna">
      <h2>{t("ui.paso.3.titulo")}</h2>
      <p>{t("ui.paso.3.texto")}</p>
      <div className="sitios">
        {sitios.map((s) => {
          const crudo = porId.get(s.id)!;
          return (
            <div key={s.id} className="tarjeta columna">
              <h3>{t(s.nombreKey)}</h3>
              <p style={{ fontSize: 15, color: "var(--texto-2)" }}>{t(crudo.descripcionKey)}</p>
              {CRITERIOS.map((c) => (
                <div key={c} className="criterio">
                  <span>{t(`ui.paso.3.criterio.${c}`)}</span>
                  <div className="barra-c" aria-hidden="true"><div style={{ width: `${Math.round(crudo.puntajes[c] * 100)}%` }} /></div>
                  <span className="delta">{Math.round(crudo.puntajes[c] * 100)}</span>
                </div>
              ))}
              <div><strong>{t("ui.paso.3.total")}:</strong> {Math.round(s.total * 100)} <span className="etiqueta">{t(s.rangoKey)}</span></div>
              <button onClick={() => onElegir(s)}>{t("ui.paso.3.elegir")}</button>
            </div>
          );
        })}
      </div>
      <FuenteTerreno fuente={terrenoJezero.fuente} />
    </section>
  );
}
