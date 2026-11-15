import { escenaPolvo } from "@solar-shield/agents";
import type { Action, GameState } from "@solar-shield/contracts";
import { fuenteAprobada } from "@solar-shield/data";
import { useT } from "../i18n.js";
import { Burbuja, describirAccion } from "./Dialogos.js";
import { QueSi } from "./QueSi.js";

/** Paso 4b (mala suerte): polvo en los paneles. Sin panel solar, `escenaPolvo` da null y no se pinta nada. */
export function Polvo({ estado, onElegir, onAccion }: { estado: GameState; onElegir: (a: Action) => void; onAccion: (a: Action) => void }) {
  const { t } = useT();
  const escena = escenaPolvo(estado, { insight: fuenteAprobada("insight") });
  if (!escena) return null;
  return (
    <div className="columna">
      {escena.dialogos.map((d, i) => <Burbuja key={i} d={d} />)}
      <div className="fila">
        {escena.opciones.map((a, i) => <button key={i} onClick={() => onElegir(a)}>{describirAccion(a, t)}</button>)}
      </div>
      <QueSi estado={estado} opciones={escena.opciones} onSimular={onAccion} />
    </div>
  );
}
