import { useId, type ReactNode } from "react";
import { useT, type Vars } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import "./facetado.css";

/**
 * El único botón del juego (APLICACION §5): familia facetada de `ui/02` y `ui/03`.
 * - Botón nativo. La superficie hexagonal se recorta POR DENTRO; el anillo de foco y la caja táctil
 *   quedan por fuera, así el chaflán nunca los corta (DISEÑO §5.3).
 * - `disabled` NO usa el atributo nativo: queda enfocable, se anuncia con `aria-disabled` y lleva
 *   el motivo escrito debajo (nunca un botón apagado sin explicación).
 * - Textos solo por clave i18n.
 */
export interface FacetButtonProps {
  variant?: "primary" | "secondary";
  labelKey: string;
  labelVars?: Vars;
  icon?: NombreIcono;
  disabled?: boolean;
  disabledReasonKey?: string;
  busy?: boolean;
  /** Texto mientras procesa; si falta, "Working…". El ancho no cambia. */
  busyLabelKey?: string;
  selected?: boolean;
  onClick(): void;
  type?: "button" | "submit";
  className?: string;
  /** Contenido extra a la derecha (por ejemplo una tecla `[E]`). */
  extra?: ReactNode;
}

export function FacetButton({
  variant = "secondary", labelKey, labelVars, icon, disabled = false, disabledReasonKey, busy = false,
  busyLabelKey, selected, onClick, type = "button", className, extra,
}: FacetButtonProps) {
  const { t } = useT();
  const idMotivo = useId();
  const bloqueado = disabled || busy;
  const etiqueta = t(labelKey, labelVars);
  const icono = selected ? "check" : icon;
  return (
    <span className={`fb-caja${className ? ` ${className}` : ""}`}>
      <button
        type={type}
        className={`fb fb-${variant}${selected ? " fb-sel" : ""}${busy ? " fb-ocupado" : ""}`}
        aria-disabled={bloqueado || undefined}
        aria-busy={busy || undefined}
        aria-pressed={selected === undefined ? undefined : selected}
        aria-describedby={disabled && disabledReasonKey ? idMotivo : undefined}
        onClick={() => { if (!bloqueado) onClick(); }}
      >
        <span className="fb-sombra" aria-hidden="true" />
        <span className="fb-superficie">
          {icono && <Icono nombre={icono} tam={variant === "primary" ? 26 : 22} className="fb-icono" />}
          {/* Mientras procesa se dibujan las dos etiquetas superpuestas para que el ancho no salte. */}
          <span className="fb-texto">
            <span className={busy ? "fb-oculta" : undefined}>{etiqueta}</span>
            {busy && <span className="fb-encima">{t(busyLabelKey ?? "ui.comun.ocupado")}</span>}
          </span>
          {extra}
        </span>
      </button>
      {disabled && disabledReasonKey && <span id={idMotivo} className="fb-motivo">{t(disabledReasonKey)}</span>}
    </span>
  );
}
