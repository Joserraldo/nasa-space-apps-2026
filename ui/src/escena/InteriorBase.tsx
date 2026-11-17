import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import type { CalidadGrafica } from "../juego/ajustes";
import { montarSalaJugable, type EspacioJugable } from "./salaJugable";

/**
 * Inside the base: the airlock, the corridor, the workshop and the habitat, walked with the kid
 * (`salaJugable`). The habitat building's door opens into the airlock; the airlock leads to the corridor,
 * and the corridor to the two rooms. Only the way out reaches the game (`onSalir`); moving between the
 * inside spaces stays here.
 *
 * Presentational shell: one canvas over the outdoor scene and the "[E] ..." hint, worded with the same
 * interaction verbs as the outdoor HUD (Enter, Exit, Use).
 */
export interface InteriorBaseProps {
  calidad: CalidadGrafica;
  onSalir: () => void;
}

type Lugar = Readonly<{ espacio: EspacioJugable; desde: string }>;

/** Verb key of the hint for what is within reach (null = nothing). */
export function verboInterior(id: string | null): string | null {
  if (id === null) return null;
  if (id === "puerta:base") return "ui.interaccion.salir";
  if (id.startsWith("puerta:")) return "ui.interaccion.entrar";
  return "ui.interaccion.usar";
}

export function InteriorBase({ calidad, onSalir }: InteriorBaseProps) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lugar, setLugar] = useState<Lugar>({ espacio: "esclusa", desde: "base" });
  const [cercano, setCercano] = useState<string | null>(null);
  const salir = useRef(onSalir);
  salir.current = onSalir;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCercano(null);
    const sala = montarSalaJugable(canvas, lugar.espacio, {
      calidad,
      desde: lugar.desde,
      alCercano: setCercano,
      alSalir: (destino) => {
        if (destino === "base") salir.current();
        else setLugar({ espacio: destino as EspacioJugable, desde: lugar.espacio });
      },
    });
    return () => sala.quitar();
  }, [lugar, calidad]);

  const verbo = verboInterior(cercano);
  return (
    <div className="interior-base" style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
      {verbo && (
        <div className="fc-cara fc-chico" role="status"
          style={{ position: "absolute", left: "50%", bottom: "18%", transform: "translateX(-50%)", padding: "0.4rem 0.9rem", pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span>[E] {t(verbo)}</span>
        </div>
      )}
    </div>
  );
}
