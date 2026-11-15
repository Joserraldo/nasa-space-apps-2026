import { useT } from "../../i18n.js";
import { Icono } from "./Iconos.js";
import "./facetas.css";
import "./paneles.css";

/**
 * Tarjeta de fuente compacta (ui/04 "Check the source"): icono de documento grande y
 * "NASA / Archived event". El dueño, el id y la fecha salen de los datos de la fuente y solo se
 * muestran si existen. Si el dato es estático, el tipo lo dice ("Archived event"): nunca "en vivo".
 */
export function TarjetaFuenteCompacta({ dueno, tipoKey = "ui.comun.fuente.archivado", id, fecha }: {
  dueno?: string | undefined;
  /** Tipo de fuente (clave i18n); por defecto el evento archivado. */
  tipoKey?: string | undefined;
  id?: string | undefined;
  /** Fecha de consulta, ya recortada a AAAA-MM-DD. */
  fecha?: string | undefined;
}) {
  const { t } = useT();
  const tipo = t(tipoKey);
  return (
    <div className="fc">
      <div className="fc-cara fc-chico fuente-compacta">
        <Icono nombre="documento" tam={44} />
        <p className="fuente-compacta-texto">
          <strong>{dueno ? t("ui.comun.fuente.compacta", { dueno, tipo }) : tipo}</strong>
          {id && <span>{t("ui.fuente.id", { id })}</span>}
          {fecha && <span>{t("ui.fuente.consultado", { fecha })}</span>}
        </p>
      </div>
    </div>
  );
}
