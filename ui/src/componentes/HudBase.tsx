import { useEffect, useState } from "react";
import type { GameState } from "@solar-shield/contracts";
import type { Novedades } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { RECURSOS, ResourcePlaque } from "./base/Piezas.js";
import "./hud.css";

/**
 * HUD de las fases de base (módulos, base y tormenta), escrito desde `mundo/01` (DISEÑO §5.2) con
 * las piezas de `ui/03`: tres placas separadas arriba a la derecha y, arriba a la izquierda, el día
 * y el turno como texto con la pausa y la velocidad (solo cuando corre el reloj).
 * Escala `min(ancho/1024, alto/683)` con mínimo 0,75 (ESCENAS §2.7).
 */

export const VELOCIDADES = [0.5, 1, 2] as const;

function escalaHud(): number {
  if (typeof window === "undefined") return 1;
  return Math.max(0.75, Math.min(window.innerWidth / 1024, window.innerHeight / 683));
}

function useEscalaHud(): number {
  const [escala, setEscala] = useState(escalaHud);
  useEffect(() => {
    const medir = () => setEscala(escalaHud());
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  return escala;
}

export interface HudBaseProps {
  estado: GameState;
  /** Novedades del último turno: sus causas con recurso y delta se muestran en la capa de cada placa. */
  ultimas?: Novedades | null | undefined;
  /** Controles del reloj; si faltan (módulos, tormenta), el HUD solo muestra día, turno y recursos. */
  reloj?: { velocidad: number; onPausa(): void; onVelocidad(v: number): void } | undefined;
}

export function HudBase({ estado, ultimas, reloj }: HudBaseProps) {
  const { t } = useT();
  const escala = useEscalaHud();
  const cambios = ultimas ? [...ultimas.efectosLlegaron, ...ultimas.malaSuerte] : [];
  const siguiente = (v: number) => VELOCIDADES[(VELOCIDADES.indexOf(v as (typeof VELOCIDADES)[number]) + 1) % VELOCIDADES.length]!;
  return (
    <section className="hud-base" aria-label={t("ui.hud.titulo")} style={{ zoom: escala }}>
      <div className="hud-reloj">
        <div className="fc">
          <p className="fc-cara fc-chico hud-dia">
            <span>{t("ui.dia", { dia: estado.dia })}</span> <span aria-hidden="true">·</span> <span>{t("ui.tick", { tick: estado.tick })}</span>
          </p>
        </div>
        {reloj && (
          <>
            <FacetButton labelKey={estado.pausado ? "ui.reanudar" : "ui.pausa"} icon={estado.pausado ? "jugar" : "reloj"} onClick={reloj.onPausa} />
            <FacetButton labelKey="ui.hud.velocidad" labelVars={{ v: reloj.velocidad }} icon="reloj" onClick={() => reloj.onVelocidad(siguiente(reloj.velocidad))} />
          </>
        )}
      </div>
      <div className="hud-placas">
        {RECURSOS.map((r) => (
          <ResourcePlaque key={r} recurso={r} value={estado.recursos[r]} pending={estado.efectosPendientes}
            feedback={cambios.filter((c) => c.recurso === r && c.delta !== undefined).map((c, i) => ({ id: `${c.tick}-${r}-${i}`, delta: c.delta!, causaKey: c.descripcionKey }))} />
        ))}
      </div>
    </section>
  );
}
