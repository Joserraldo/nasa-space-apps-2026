import { useT } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import { Retrato, type Expresion, type Persona } from "./Retrato.js";
import "./facetas.css";
import "./retratos.css";

/**
 * Retrato + nombre + especialidad juntos (DISEÑO §5.3, ui/04 "Choose your expert"):
 * "Engineer / Power & repairs", "Radiation doctor / Crew protection", "Solar expert / Solar events".
 * El niño es "You (Player)" e Iris es "Iris (Guide)". Si es seleccionable, es un botón con check.
 */
const ESPECIALIDAD_ICONO: Partial<Record<Persona, NombreIcono>> = { ingeniera: "llave", doctora: "escudo", meteorologa: "sol" };

export function ExpertPortrait({ persona, expresion = "neutral", danada = false, seleccionado, onElegir, compacto = false }: {
  persona: Persona;
  expresion?: Expresion;
  danada?: boolean;
  /** Con `onElegir` se vuelve botón (elegir a quién preguntar); `seleccionado` marca la elegida. */
  seleccionado?: boolean;
  onElegir?: () => void;
  compacto?: boolean;
}) {
  const { t } = useT();
  const icono = ESPECIALIDAD_ICONO[persona];
  const contenido = (
    <>
      {seleccionado && <span className="retrato-check"><Icono nombre="check" tam={22} /></span>}
      <span className="retrato-marco"><Retrato persona={persona} expresion={expresion} danada={danada} tam={compacto ? 72 : 112} parpadear /></span>
      <span className="retrato-nombre">{t(`ui.comun.retrato.${persona}.nombre`)}</span>
      {!compacto && (
        <span className="retrato-especialidad">
          {icono && <Icono nombre={icono} tam={18} />}
          {t(`ui.comun.retrato.${persona}.especialidad`)}
        </span>
      )}
      {danada && <span className="retrato-danada"><Icono nombre="aviso" tam={16} />{t("ui.comun.retrato.danada")}</span>}
    </>
  );
  return (
    <div className="fc">
      {onElegir
        ? <button type="button" className={`fc-cara retrato-ficha retrato-boton${seleccionado ? " retrato-sel" : ""}${compacto ? " retrato-compacto" : ""}`} aria-pressed={!!seleccionado} onClick={onElegir}>{contenido}</button>
        : <div className={`fc-cara retrato-ficha${compacto ? " retrato-compacto" : ""}`}>{contenido}</div>}
    </div>
  );
}
