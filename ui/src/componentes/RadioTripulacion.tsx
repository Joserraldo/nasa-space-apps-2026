import { useEffect } from "react";
import type { Dialogo } from "@solar-shield/agents";
import type { Action } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { describirAccion } from "./Dialogos.js";
import { Icono } from "./base/Iconos.js";
import { PERSONAS, Retrato, type Persona } from "./base/Retrato.js";
import { TarjetaFuente } from "./TarjetaFuente.js";
import "./radio.css";

/** Cuánto se queda en pantalla un aviso que no es alerta (ms). La alerta espera a "Got it". */
export const DURACION_RADIO: Record<Dialogo["prioridad"], number | null> = { alerta: null, consejo: 14000, charla: 8000 };

/**
 * canal de radio. Una card a la vez (la primera de la cola), con el retrato de quien
 * habla. Las alertas se quedan hasta "Got it" (sin pausar el reloj); consejos y charlas se van solos. Si el aviso trae una acción,
 * se puede hacer desde aquí (el motor decide si se puede).
 */
export function RadioTripulacion({ cola, onCerrar, onAccion }: {
  cola: readonly Dialogo[];
  onCerrar(): void;
  onAccion(a: Action): void;
}) {
  const { t } = useT();
  const d = cola[0];
  useEffect(() => {
    if (!d) return;
    const ms = DURACION_RADIO[d.prioridad];
    if (ms === null) return;
    const id = setTimeout(onCerrar, ms);
    return () => clearTimeout(id);
  }, [d, onCerrar]);
  if (!d) return null;
  const nombre = d.experto === "ia_base" ? t("ui.iris.titulo")
    : d.experto === "control_mision" ? t("ui.radio.nombre.control_mision") : t(`agentes.nombre.${d.experto}`);
  const alerta = d.prioridad === "alerta";
  return (
    <aside className={`radio${alerta ? " radio-alerta" : ""}`} role={alerta ? "alert" : "status"} aria-label={t("ui.radio.titulo")} data-experto={d.experto}>
      <div className="radio-cab">
        <span className="radio-retrato" aria-hidden="true">
          {(PERSONAS as readonly string[]).includes(d.experto)
            ? <Retrato persona={d.experto as Persona} expresion="habla_abierta" tam={52} />
            : <Icono nombre="satelite" tam={32} />}
        </span>
        <div>
          <p className="radio-canal"><Icono nombre="microfono" tam={14} />{t("ui.radio.titulo")}</p>
          <p className="radio-nombre">{nombre.charAt(0).toUpperCase() + nombre.slice(1)}</p>
        </div>
      </div>
      {d.lineas.map((l, i) => <p key={i} className="radio-linea">{t(l.clave, l.vars)}</p>)}
      {d.fuente && <TarjetaFuente fuente={d.fuente} />}
      <div className="radio-botones">
        {d.accion && (
          <button type="button" className="radio-boton radio-hacer" onClick={() => { onAccion(d.accion!); onCerrar(); }}>
            {t("ui.tripulacion.hacer")}: {describirAccion(d.accion, t)}
          </button>
        )}
        <button type="button" className="radio-boton" onClick={onCerrar}>{t("ui.radio.entendido")}</button>
        {cola.length > 1 && <span className="radio-mas">{t("ui.radio.mas", { n: cola.length - 1 })}</span>}
      </div>
    </aside>
  );
}
