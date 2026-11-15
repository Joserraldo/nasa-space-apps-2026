import { useId, type ReactNode } from "react";
import { useT } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import "./facetas.css";
import "./paneles.css";

/**
 * Panel de la E7 (ui/04): tarjeta marfil con borde lila y una cinta ciruela arriba a la izquierda
 * ("01 / CHOOSE YOUR EXPERT"). La cinta es el encabezado (h2) del panel; a su derecha van las
 * `acciones` (por ejemplo el chip "Paused"). El texto de la cinta va en el idioma activo y las
 * mayúsculas las pone el CSS, no el texto.
 */
export function PanelFacetado({ tituloKey, numero, acciones, children, className }: {
  tituloKey: string;
  /** Con 1 se muestra "01 / ". Sin número, la cinta lleva solo el título. */
  numero?: number | undefined;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  const { t } = useT();
  const id = useId();
  return (
    <section className={`fc pf${className ? ` ${className}` : ""}`} aria-labelledby={id}>
      <div className="fc-cara pf-cara">
        <header className="pf-cab">
          <h2 id={id} className="pf-cinta">{numero !== undefined && <>{String(numero).padStart(2, "0")} / </>}{t(tituloKey)}</h2>
          {acciones && <div className="pf-acciones">{acciones}</div>}
        </header>
        <div className="pf-cuerpo">{children}</div>
      </div>
    </section>
  );
}

/** Chip "Paused" con el icono de pausa (dos barras): la escena está detenida mientras se decide. */
export function ChipPausa() {
  const { t } = useT();
  return (
    <span className="fc"><span className="fc-cara fc-chico fc-lila chip-pausa"><Icono nombre="pausa" tam={20} /><span>{t("ui.comun.pausado")}</span></span></span>
  );
}

/** Barra de sección lila con icono opcional ("Check the source", "Action confirmed"); es solo un rótulo, no un botón. */
export function BarraSeccion({ icono, tituloKey, className }: { icono?: NombreIcono | undefined; tituloKey: string; className?: string | undefined }) {
  const { t } = useT();
  return (
    <span className={`fc barra-seccion${className ? ` ${className}` : ""}`}>
      <span className="fc-cara fc-chico fc-lila barra-cara">{icono && <Icono nombre={icono} tam={24} />}<span>{t(tituloKey)}</span></span>
    </span>
  );
}
