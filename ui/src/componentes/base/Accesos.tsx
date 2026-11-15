import type { Resource } from "@solar-shield/contracts";
import { useT, type Vars } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import { ICONO_RECURSO } from "./Piezas.js";
import "./facetas.css";
import "./paneles.css";

/**
 * Chips de una línea de ui/04: acceso por recurso ("Energy 70") y pregunta con icono
 * ("What needs protection?"). Con `onClick` son botones (44 px mínimo, foco cian); sin él solo
 * informan. Las dos usan la misma forma hexagonal de la familia facetada.
 */
export function AccesoRecurso({ recurso, valor, onClick }: {
  recurso: Resource;
  /** Valor real del motor; se redondea. */
  valor: number;
  onClick?: (() => void) | undefined;
}) {
  const { t } = useT();
  const cuerpo = (
    <>
      <Icono nombre={ICONO_RECURSO[recurso]} tam={24} />
      <span className="chip-nombre">{t(`ui.recurso.${recurso}`)}</span>
      <span className="chip-valor">{Math.round(valor)}</span>
    </>
  );
  return (
    <span className="fc">
      {onClick
        ? <button type="button" className="fc-cara chip chip-boton" onClick={onClick}>{cuerpo}</button>
        : <span className="fc-cara chip">{cuerpo}</span>}
    </span>
  );
}

export function ChipPregunta({ icono, labelKey, labelVars, onClick, selected }: {
  icono: NombreIcono;
  labelKey: string;
  labelVars?: Vars | undefined;
  onClick(): void;
  selected?: boolean | undefined;
}) {
  const { t } = useT();
  return (
    <span className="fc">
      <button type="button" className={`fc-cara chip chip-boton chip-pregunta${selected ? " chip-sel" : ""}`} aria-pressed={selected === undefined ? undefined : selected} onClick={onClick}>
        <Icono nombre={selected ? "check" : icono} tam={22} />
        <span className="chip-nombre">{t(labelKey, labelVars)}</span>
      </button>
    </span>
  );
}
