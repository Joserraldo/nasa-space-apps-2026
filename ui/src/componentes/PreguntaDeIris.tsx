import { useState } from "react";
import { preguntaIris, responderPreguntaIris, type Dialogo, type TemaPregunta } from "@solar-shield/agents";
import type { BaseAiLevel } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { Burbuja } from "./Dialogos.js";

/** Iris nivel 2: pregunta de 3 opciones que nunca bloquea (siempre se puede saltar). Fuera de "pistas" no pinta nada. */
export function PreguntaDeIris({ tema, nivel }: { tema: TemaPregunta; nivel: BaseAiLevel }) {
  const { t } = useT();
  const [respuesta, setRespuesta] = useState<Dialogo | null>(null);
  const p = preguntaIris(tema, nivel);
  if (!p) return null;
  return (
    <div className="columna">
      <Burbuja d={p.dialogo} />
      {respuesta ? <Burbuja d={respuesta} /> : (
        <div className="fila">
          {p.opcionesKeys.map((k, i) => (
            <button key={k} className="secundario" onClick={() => setRespuesta(responderPreguntaIris(p, i as 0 | 1 | 2))}>{t(k)}</button>
          ))}
          <button className="secundario" onClick={() => setRespuesta(responderPreguntaIris(p, null))}>{t("ui.iris.saltar")}</button>
        </div>
      )}
    </div>
  );
}
