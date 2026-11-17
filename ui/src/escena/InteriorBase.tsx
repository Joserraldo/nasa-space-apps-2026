import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import type { CalidadGrafica } from "../juego/ajustes";
import { montarSalaJugable, type EspacioJugable, type SalaJugable } from "./salaJugable";

/** Stick radius in px: how far the knob travels from the centre. */
const RADIO_STICK = 44;

/**
 * Touch stick for phones and tablets: drag from the base; the offset over `RADIO_STICK` is the direction.
 * Presentational: it only reports the direction.
 */
function Stick({ onEje }: { onEje: (x: number, z: number) => void }) {
  const [perilla, setPerilla] = useState({ x: 0, y: 0 });
  const centro = useRef<{ x: number; y: number; id: number } | null>(null);
  const soltar = () => {
    centro.current = null;
    setPerilla({ x: 0, y: 0 });
    onEje(0, 0);
  };
  return (
    <div aria-hidden="true"
      style={{ position: "absolute", left: 24, bottom: 24, width: RADIO_STICK * 2 + 32, height: RADIO_STICK * 2 + 32, borderRadius: "50%", background: "rgba(29,30,42,0.35)", touchAction: "none" }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        centro.current = { x: r.left + r.width / 2, y: r.top + r.height / 2, id: e.pointerId };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const c = centro.current;
        if (!c || c.id !== e.pointerId) return;
        let dx = e.clientX - c.x, dy = e.clientY - c.y;
        const d = Math.hypot(dx, dy);
        if (d > RADIO_STICK) { dx *= RADIO_STICK / d; dy *= RADIO_STICK / d; }
        setPerilla({ x: dx, y: dy });
        onEje(dx / RADIO_STICK, dy / RADIO_STICK);
      }}
      onPointerUp={soltar} onPointerCancel={soltar}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 48, height: 48, borderRadius: "50%", background: "rgba(242,240,236,0.9)", transform: `translate(calc(-50% + ${perilla.x}px), calc(-50% + ${perilla.y}px))` }} />
    </div>
  );
}

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
  const [tactil] = useState(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
  const sala = useRef<SalaJugable | null>(null);
  const salir = useRef(onSalir);
  salir.current = onSalir;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCercano(null);
    const montada = montarSalaJugable(canvas, lugar.espacio, {
      calidad,
      desde: lugar.desde,
      alCercano: setCercano,
      alSalir: (destino) => {
        if (destino === "base") salir.current();
        else setLugar({ espacio: destino as EspacioJugable, desde: lugar.espacio });
      },
    });
    sala.current = montada;
    return () => {
      sala.current = null;
      montada.quitar();
    };
  }, [lugar, calidad]);

  const verbo = verboInterior(cercano);
  return (
    <div className="interior-base" style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
      {verbo && (
        <div className="fc-cara fc-chico" role="status"
          style={{ position: "absolute", left: "50%", bottom: "18%", transform: "translateX(-50%)", padding: "0.4rem 0.9rem", pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span>{tactil ? t(verbo) : `[E] ${t(verbo)}`}</span>
        </div>
      )}
      {tactil && (
        <>
          <Stick onEje={(x, z) => sala.current?.fijarEje(x, z)} />
          <button type="button" className="fc-cara" aria-label={t("ui.interaccion.interactuar")} disabled={!verbo}
            onClick={() => sala.current?.usar()}
            style={{ position: "absolute", right: 28, bottom: 36, width: 76, height: 76, borderRadius: "50%", fontWeight: 700, opacity: verbo ? 1 : 0.5 }}>
            E
          </button>
        </>
      )}
    </div>
  );
}
