import type { Dialogo } from "@solar-shield/agents";
import type { Action } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { TarjetaFuente } from "./TarjetaFuente.js";

const SIMBOLO: Record<string, string> = {
  ingeniera: "⚡", doctora: "✚", meteorologa: "☀", matematico: "=", control_mision: "📡", ia_base: "◉",
};

export function NombreExperto({ id }: { id: string }) {
  const { t } = useT();
  return <>{t(id === "ia_base" ? "ui.iris.titulo" : `agentes.nombre.${id}`)}</>;
}

/** Pinta un Dialogo de agentes: cada línea es una clave + vars; `*Key` se traduce también. */
export function Burbuja({ d, irisDanada, onAccion }: { d: Dialogo; irisDanada?: boolean; onAccion?: (a: Action) => void }) {
  const { t } = useT();
  return (
    <div className="tripulante">
      <div className={`retrato ${d.experto} ${irisDanada && d.experto === "ia_base" ? "danada" : ""}`} aria-hidden="true">{SIMBOLO[d.experto]}</div>
      <div className={`burbuja ${d.prioridad === "alerta" ? "alerta" : ""}`}>
        <div className="nombre"><NombreExperto id={d.experto} /></div>
        {d.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
        {d.accion && onAccion && (
          <button onClick={() => onAccion(d.accion!)}>{t("ui.tripulacion.hacer")}: {describirAccion(d.accion, t)}</button>
        )}
        {d.fuente && <TarjetaFuente fuente={d.fuente} />}
      </div>
    </div>
  );
}

export function describirAccion(a: Action, t: (k: string, v?: Record<string, string | number>) => string): string {
  switch (a.tipo) {
    case "esperar": return t("ui.accion.esperar");
    case "refugiarse": return t("ui.accion.refugiarse");
    case "subir_escudo": return t("ui.accion.subir_escudo");
    case "reparar": return a.equipo === "ia_base" ? t("ui.accion.reparar_ia") : `${t("ui.causa.reparar")}: ${t(`agentes.equipo.${a.equipo}`)}`;
    case "salida_exterior": return t("ui.accion.salida_exterior");
    case "redistribuir_energia": return `${t("ui.accion.redistribuir")} (${a.cantidad})`;
    case "colocar_modulo": return `${t("ui.causa.colocar_modulo")}: ${t(`agentes.equipo.${a.modulo}`)}`;
    case "enviar_telemetria": return t("ui.paso.7.telemetria");
    case "ajustar_orbita": return t("ui.causa.ajustar_orbita");
    case "simular": return t("ui.causa.simular");
  }
}
