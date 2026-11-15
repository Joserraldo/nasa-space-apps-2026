import type { ReactNode } from "react";
import { useT, type Vars } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import "./facetas.css";
import "./pildoras.css";

/**
 * Píldoras flotantes del HUD de `mundo/01` (DISEÑO §5.2): una línea, extremos en punta, marfil con
 * borde lila. `PildoraBoton` dibuja 36 px pero su caja táctil mide 44 px (DISEÑO §5.3).
 */

/** Píldora de solo lectura (día y turno, objetivo). */
export function Pildora({ children, anillo = false, className }: { children: ReactNode; anillo?: boolean; className?: string }) {
  return (
    <span className="fc">
      <span className={`fc-cara pildora${className ? ` ${className}` : ""}`}>
        {anillo && <span className="pildora-anillo" aria-hidden="true" />}
        {children}
      </span>
    </span>
  );
}

/** Objetivo actual: anillo cian y texto. Se anuncia sin interrumpir. */
export function PildoraObjetivo({ labelKey, vars }: { labelKey: string; vars?: Vars }) {
  const { t } = useT();
  return <p className="pildora-objetivo" role="status"><Pildora anillo><span>{t(labelKey, vars)}</span></Pildora></p>;
}

export interface PildoraBotonProps {
  labelKey: string;
  labelVars?: Vars | undefined;
  icon?: NombreIcono | undefined;
  /** Tecla de atajo en su cuadrito: `accion` (E, borde cian) o `camara` (V, ciruela). */
  tecla?: { letra: string; tono: "accion" | "camara" } | undefined;
  onClick(): void;
  className?: string | undefined;
}

export function PildoraBoton({ labelKey, labelVars, icon, tecla, onClick, className }: PildoraBotonProps) {
  const { t } = useT();
  return (
    <button type="button" className={`pb${tecla?.tono === "accion" ? " pb-accion" : ""}${className ? ` ${className}` : ""}`}
      aria-keyshortcuts={tecla?.letra} onClick={onClick}>
      <span className="fc">
        <span className="fc-cara pildora">
          {icon && <Icono nombre={icon} tam={22} />}
          {tecla && <span className={`pildora-tecla pildora-tecla-${tecla.tono}`} aria-hidden="true">{tecla.letra}</span>}
          <span>{t(labelKey, labelVars)}</span>
        </span>
      </span>
    </button>
  );
}
