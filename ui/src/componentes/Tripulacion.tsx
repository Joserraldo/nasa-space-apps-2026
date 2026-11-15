import { useState } from "react";
import { conversar, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Action, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { tormentaActiva } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { Burbuja, NombreExperto } from "./Dialogos.js";

/**
 * Panel de tripulación: botones por experto y caja de texto. Todo funciona sin modelo:
 * `conversar` (agentes) resuelve atajos/regex, esconde la tormenta antes del paso 5,
 * aclara si no entiende e Iris dañada responde con su falla.
 */
export function Tripulacion({ estado, onAccion }: { estado: GameState; onAccion: (a: Action) => void }) {
  const { t } = useT();
  const [texto, setTexto] = useState("");
  const [charla, setCharla] = useState<Dialogo[]>([]);
  const [fallasIris, setFallasIris] = useState(0);

  function hablar(entrada: Entrada) {
    const d = conversar(entrada, estado, { tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris });
    if ("falla" in d) setFallasIris((n) => n + 1);
    setCharla((c) => [d, ...c].slice(0, 4));
  }
  function preguntar(e: GameState["tripulacion"][number]["id"]) {
    hablar({ experto: e });
  }
  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    hablar({ texto });
    setTexto("");
  }

  const disponibles = estado.tripulacion.filter((m) => m.disponible);
  return (
    <section className="tarjeta columna" aria-label={t("ui.tripulacion.titulo")}>
      <h2>{t("ui.tripulacion.titulo")}</h2>
      <div className="botones-expertos">
        {disponibles.map((m) => (
          <button key={m.id} className="secundario" onClick={() => preguntar(m.id)} aria-label={t("ui.tripulacion.preguntar", { nombre: t(`agentes.nombre.${m.id}`) })}>
            <NombreExperto id={m.id} />
          </button>
        ))}
      </div>
      <form className="fila" onSubmit={enviar}>
        <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t("ui.tripulacion.escribe")} aria-label={t("ui.tripulacion.escribe")} />
        <button type="submit" className="secundario">{t("ui.tripulacion.enviar")}</button>
      </form>
      <div className="columna" aria-live="polite">
        {charla.map((d, i) => <Burbuja key={i} d={d} irisDanada={estado.iaBase === "danada"} onAccion={onAccion} />)}
      </div>
    </section>
  );
}
