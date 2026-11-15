import { useId, useState } from "react";
import datosEn from "../../../data/i18n/en.json";
import { useT } from "../i18n.js";
import "./base/facetas.css";
import "./base/datos.css";

/**
 * Glosario (DISEÑO §5, RETO: términos explicados en contexto). Las palabras y definiciones son de
 * data/ (`datos.glosario.<id>.palabra` y `.def`, en y es). Dos formas:
 * - `<Termino id="dosis">` dentro de un texto: la palabra se puede tocar y abre su definición al lado.
 * - `<Glosario />`: la lista completa, ordenada como la escribió datos.
 */
export const TERMINOS_GLOSARIO: readonly string[] = Object.keys(datosEn)
  .filter((k) => k.startsWith("datos.glosario.") && k.endsWith(".palabra"))
  .map((k) => k.slice("datos.glosario.".length, -".palabra".length));

export function Termino({ id, children }: { id: string; children?: React.ReactNode }) {
  const { t } = useT();
  const [abierto, setAbierto] = useState(false);
  const idDef = useId();
  return (
    <span className="termino">
      <button type="button" className="termino-boton" aria-expanded={abierto} aria-controls={idDef}
        onClick={() => setAbierto((a) => !a)} onKeyDown={(e) => { if (e.key === "Escape") setAbierto(false); }}>
        {children ?? t(`datos.glosario.${id}.palabra`)}
      </button>
      {abierto && <span id={idDef} role="note" className="termino-def">{t(`datos.glosario.${id}.def`)}</span>}
    </span>
  );
}

export function Glosario() {
  const { t } = useT();
  return (
    <section className="fc glosario" aria-labelledby="glosario-titulo">
      <div className="fc-cara datos-cara">
        <h2 id="glosario-titulo">{t("ui.glosario.titulo")}</h2>
        <dl className="glosario-lista">
          {TERMINOS_GLOSARIO.map((id) => (
            <div key={id}>
              <dt>{t(`datos.glosario.${id}.palabra`)}</dt>
              <dd>{t(`datos.glosario.${id}.def`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
