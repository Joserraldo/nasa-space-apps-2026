import { lazy, Suspense, useCallback, useState } from "react";
import { hayGraficos3D } from "../escena/soporte.js";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import { LogoSolarShield } from "./base/LogoSolarShield.js";
import { Retrato } from "./base/Retrato.js";
import "./base/inicio.css";

const IlustracionCarga = lazy(() => import("./base/inicio3d/carga3d.js"));

/**
 * Pantalla de carga (inicio/03, DISEÑO §6): fondo ámbar, logo, "Preparing your mission", indicador
 * INDETERMINADO (tres puntos, nunca un porcentaje inventado) y un consejo de entrenamiento. Detrás, la
 * capa 3D (`base/inicio3d/carga3d.ts`) con los tres módulos del juego y el niño con la tableta; sin
 * WebGL, el retrato del niño. Las insignias de los módulos son DOM, encima de cada uno.
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
  const [con3D, setCon3D] = useState(hayGraficos3D);
  const sin3D = useCallback(() => setCon3D(false), []);
  return (
    <section className="carga" role="status" aria-busy="true" aria-labelledby="carga-titulo">
      <div className="carga-marca"><LogoSolarShield className="carga-logo" /></div>
      {onSonido && (
        <div className="carga-sonido">
          <FacetButton labelKey={sonido ? "ui.portada.sonido_on" : "ui.portada.sonido_off"} icon={sonido ? "sonido_on" : "sonido_off"} onClick={onSonido} />
        </div>
      )}
      <div className="carga-fondo" aria-hidden="true">
        {con3D ? (
          <Suspense fallback={null}><IlustracionCarga onFallo={sin3D} /></Suspense>
        ) : (
          <div className="carga-nino"><Retrato persona="nino" expresion="feliz" tam={200} parpadear /></div>
        )}
      </div>
      {/* Una insignia sobre cada módulo: energía (panel), hoja (invernadero) y escudo (domo), como inicio/03. */}
      <div className="carga-iconos" aria-hidden="true">
        {(["energia", "vida", "escudo"] as const).map((ic) => <span key={ic} className="carga-icono"><span className="carga-placa"><Icono nombre={ic} tam={30} /></span></span>)}
      </div>
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
