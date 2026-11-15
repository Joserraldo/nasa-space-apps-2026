import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import { LogoSolarShield } from "./base/LogoSolarShield.js";
import { Retrato } from "./base/Retrato.js";
import "./base/inicio.css";

/**
 * Pantalla de carga (inicio/03, DISEÑO §6): fondo ámbar, logo, "Preparing your mission", indicador
 * INDETERMINADO (tres puntos, nunca un porcentaje inventado) y un consejo de entrenamiento.
 * El consejo lo elige quien la monta (por ejemplo, el número de nivel): sin azar.
 */
export const TOTAL_CONSEJOS = 4;

export function Carga({ consejo = 0, sonido, onSonido, onSaltar }: {
  consejo?: number;
  sonido?: boolean | undefined;
  onSonido?: (() => void) | undefined;
  /** Si existe, muestra "Skip" para pasar sin esperar (FLUJO §7.2: la carga se puede saltar). */
  onSaltar?: (() => void) | undefined;
}) {
  const { t } = useT();
  const n = (((Math.round(consejo) % TOTAL_CONSEJOS) + TOTAL_CONSEJOS) % TOTAL_CONSEJOS) + 1;
  return (
    <section className="carga" role="status" aria-busy="true" aria-labelledby="carga-titulo">
      <div className="carga-marca"><LogoSolarShield className="carga-logo" /></div>
      {onSonido && (
        <div className="carga-sonido">
          <FacetButton labelKey={sonido ? "ui.portada.sonido_on" : "ui.portada.sonido_off"} icon={sonido ? "sonido_on" : "sonido_off"} onClick={onSonido} />
        </div>
      )}
      <div className="carga-iconos" aria-hidden="true">
        {(["energia", "pulmones", "escudo"] as const).map((ic) => <span key={ic} className="carga-icono"><Icono nombre={ic} tam={40} /></span>)}
      </div>
      {/* El niño mira la tableta mientras se prepara la misión (inicio/03). */}
      <div className="carga-nino" aria-hidden="true"><Retrato persona="nino" expresion="feliz" tam={200} parpadear /></div>
      <div className="fc carga-panel">
        <div className="fc-cara carga-cara">
          <h2 id="carga-titulo">{t("ui.carga.titulo")}</h2>
          <span className="carga-puntos" aria-hidden="true"><i /><i /><i /></span>
          <p className="carga-estado">{t("ui.carga.estado")}</p>
          <div className="carga-consejo">
            <span className="carga-chip">{t("ui.carga.consejo")}</span>
            <p>{t(`ui.carga.consejos.${n}`)}</p>
          </div>
          {onSaltar && <FacetButton labelKey="ui.carga.saltar" onClick={onSaltar} />}
        </div>
      </div>
    </section>
  );
}
