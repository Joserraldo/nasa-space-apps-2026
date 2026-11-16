import { useState } from "react";
import type { GameState } from "@solar-shield/contracts";
import { telemetriaPendiente, tormentaActiva } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { misionActiva } from "../juego/misiones.js";
import { Icono } from "./base/Iconos.js";
import "./guiaMision.css";

/**
 * Paso actual de la misión (1-8, `mision.pasos`) en el mundo 3D. Los pasos 1 a 3 (satélite, ruta y
 * aterrizaje) ya quedaron atrás al entrar a la base. Sale del motor, no de la animación.
 */
export function pasoActual(fase: "modulos" | "base" | "tormenta", estado: GameState, decidido: boolean): number {
  if (fase === "modulos") return 4;
  if (fase === "tormenta") return decidido ? 7 : 6;
  if (telemetriaPendiente(estado)) return 8;
  return tormentaActiva(estado, misionActiva()) ? 7 : 5;
}

/**
 * EXPERIMENTAL: tarjeta guía a la izquierda. Plegada dice qué toca ahora; abierta, los 8 pasos de la
 * misión con los hechos marcados. Se recuerda abierta o cerrada mientras dura la partida.
 */
export function GuiaMision({ fase, estado, decidido }: { fase: "modulos" | "base" | "tormenta"; estado: GameState; decidido: boolean }) {
  const { t } = useT();
  const [abierta, setAbierta] = useState(false);
  const m = misionActiva();
  const actual = pasoActual(fase, estado, decidido);
  const paso = m.pasos.find((p) => p.n === actual);
  return (
    <aside className={`guia${abierta ? " guia-abierta" : ""}`} aria-label={t("ui.guia.titulo")}>
      <p className="guia-mision">{t(m.nombreKey)}</p>
      <p className="guia-paso">
        <span className="guia-num">{t("ui.guia.paso", { n: actual, total: m.pasos.length })}</span>
        {paso && <strong>{t(paso.tituloKey)}</strong>}
      </p>
      {abierta && (
        <ol className="guia-lista">
          {m.pasos.map((p) => (
            <li key={p.n} data-estado={p.n < actual ? "hecho" : p.n === actual ? "ahora" : "luego"} aria-current={p.n === actual ? "step" : undefined}>
              <span className="guia-marca" aria-hidden="true">{p.n < actual ? <Icono nombre="check" tam={14} /> : p.n}</span>
              <span>{t(p.tituloKey)}</span>
              {p.n < actual && <span className="oculto-visual">{t("ui.guia.hecho")}</span>}
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="guia-boton" aria-expanded={abierta} onClick={() => setAbierta((a) => !a)}>
        {t(abierta ? "ui.guia.ocultar" : "ui.guia.ver")}
      </button>
    </aside>
  );
}
