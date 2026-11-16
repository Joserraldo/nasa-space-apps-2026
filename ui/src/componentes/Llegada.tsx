import { useEffect } from "react";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { FondoPortada } from "./base/FondoPortada.js";
import "./base/inicio.css";

/** Cuánto dura la llegada si nadie toca "Skip": un respiro corto, como la carga. */
export const DURACION_LLEGADA_MS = 2500;

/**
 * E8, momento 03 de `inicio/04` ("Orbit to Mars"): después de elegir el sitio, la nave llega a Jezero.
 * Fondo espacial de la portada (F), el rótulo "Arriving at Jezero" y `Skip`. Avanza sola. No toca el
 * motor: el aterrizaje ya lo aplicó el reductor al elegir el sitio. El ojo de buey con el niño de la
 * lámina es la parte visual de F (F6); aquí va el flujo con el estilo actual.
 */
export function Llegada({ onSeguir }: { onSeguir(): void }) {
  const { t } = useT();
  useEffect(() => {
    const id = window.setTimeout(onSeguir, DURACION_LLEGADA_MS);
    return () => window.clearTimeout(id);
  }, [onSeguir]);
  return (
    <section className="portada llegada" role="status" aria-labelledby="llegada-titulo">
      <FondoPortada />
      <div className="fc carga-panel">
        <div className="fc-cara carga-cara">
          <h2 id="llegada-titulo">{t("ui.llegada.titulo")}</h2>
          <FacetButton labelKey="ui.carga.saltar" icon="jugar" onClick={onSeguir} />
        </div>
      </div>
    </section>
  );
}
