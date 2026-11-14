import { useState } from "react";
import { clasificarConAtajos, responder, type Dialogo, type VistaAgente } from "@solar-shield/agents";
import type { Action, ClassifierOutput, Expert, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { useT } from "../i18n.js";
import { Burbuja, NombreExperto } from "./Dialogos.js";

const PREGUNTA_POR_EXPERTO: Record<Expert, ClassifierOutput["accion"]> = {
  ingeniera: "estado_energia",
  doctora: "estado_salud",
  meteorologa: "pronostico",
  matematico: "que_pasa_si",
  control_mision: "ayuda",
};

/**
 * Panel de tripulación: botones por experto y caja de texto. Todo funciona sin modelo:
 * la caja pasa por `clasificarConAtajos` (regex en/es); si no entiende, lo dice y ofrece los botones.
 */
export function Tripulacion({ estado, onAccion }: { estado: GameState; onAccion: (a: Action) => void }) {
  const { t } = useT();
  const [texto, setTexto] = useState("");
  const [charla, setCharla] = useState<Dialogo[]>([]);
  const vista: VistaAgente = estado;
  const ctx = { dosisMarte: referenciaDosis("marte-superficie") };

  function hablar(salida: ClassifierOutput) {
    const d = responder(salida, vista, ctx);
    setCharla((c) => [d, ...c].slice(0, 4));
  }
  function preguntar(e: Expert) {
    hablar({ version: "0", experto: e, accion: PREGUNTA_POR_EXPERTO[e], parametros: {}, confianza: 1, fuente: "boton" });
  }
  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const salida = clasificarConAtajos(texto);
    if (salida) hablar(salida);
    else {
      const noEntendi: Dialogo = { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "ui.tripulacion.noEntendi" }] };
      setCharla((c) => [noEntendi, ...c].slice(0, 4));
    }
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
