import { useState } from "react";
import { conversar, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { tormentaActiva } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { ICONO_RECURSO, RECURSOS } from "../componentes/base/Piezas.js";
import { EscenaBase } from "../escena/EscenaBase.js";
import { vistaEscena } from "../escena/vista.js";
import "../componentes/base/facetas.css";
import "./tormenta.css";

/** Los tres expertos de ui/04 "Choose your expert" (personajes/07), en el orden de la lámina. */
const EXPERTOS = ["ingeniera", "doctora", "meteorologa"] as const;
/** Lo que se le pregunta a la tripulación al tocar el acceso de cada recurso (lo entiende el clasificador). */
const PREGUNTA_RECURSO = { energia: "energy", soporte_vital: "health", blindaje: "shield" } as const;
const SIN_EVENTOS: never[] = [];
const NADA = () => undefined;

/**
 * E7 Tormenta, panel 01 de ui/04 (ESCENAS §2.7): la escena en pausa detrás, el chip "Paused" y
 * "Choose your expert" con tres retratos, el campo "Ask your crew…" y un acceso por recurso con su
 * valor real. Las respuestas salen de `conversar()`, igual que en la base. Los paneles 02 a 04
 * (comparar, verificar, decisión registrada) llegan en PRs siguientes; mientras tanto la fase
 * tormenta sigue sirviéndola `Tormenta.tsx`.
 */
export function PantallaTormenta({ estado, colocados }: { estado: GameState; colocados: readonly Equipment[] }) {
  const { t } = useT();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  const vista = vistaEscena(estado, { fase: "tormenta", colocados });

  function hablar(entrada: Entrada) {
    const d = conversar(entrada, estado, { tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris });
    if ("falla" in d) setFallasIris((n) => n + 1);
    setDialogo(d);
  }
  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!texto.trim()) return;
    setElegido(null);
    hablar({ texto });
    setTexto("");
  }

  return (
    <section className="tormenta-e7" aria-labelledby="tormenta-titulo">
      <div className="tormenta-escena" aria-hidden="true">
        <EscenaBase vista={vista} eventos={SIN_EVENTOS} calidad="baja" camara="tercera" movimientoReducido
          onLugarCercano={NADA} onUsar={NADA} onCalidad={NADA} onWebGLPerdido={NADA} />
      </div>

      <div className="fc tormenta-panel">
        <div className="fc-cara tormenta-cara">
          <header className="tormenta-cabeza">
            <h2 id="tormenta-titulo" className="tormenta-titulo">{t("ui.tormenta.elegir")}</h2>
            <span className="fc"><span className="fc-cara fc-chico tormenta-pausa"><Icono nombre="reloj" tam={20} /><span>{t("ui.comun.pausado")}</span></span></span>
          </header>

          <ul className="tormenta-expertos">
            {EXPERTOS.map((p) => (
              <li key={p}>
                <ExpertPortrait persona={p} seleccionado={elegido === p}
                  onElegir={() => { setElegido(p); hablar({ experto: p }); }} />
              </li>
            ))}
          </ul>

          <form className="tormenta-preguntar" onSubmit={enviar}>
            <label className="oculto-visual" htmlFor="tormenta-campo">{t("ui.base.tripulacion.campo")}</label>
            <input id="tormenta-campo" type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t("ui.base.tripulacion.campo")} />
            <FacetButton type="submit" labelKey="ui.tripulacion.enviar" onClick={NADA} />
          </form>

          <ul className="tormenta-accesos">
            {RECURSOS.map((r) => (
              <li key={r}>
                <FacetButton icon={ICONO_RECURSO[r]} labelKey="ui.tormenta.acceso"
                  labelVars={{ recurso: t(`ui.recurso.${r}`), valor: Math.round(estado.recursos[r]) }}
                  onClick={() => { setElegido(null); hablar({ texto: PREGUNTA_RECURSO[r] }); }} />
              </li>
            ))}
          </ul>

          {dialogo && (
            <div className="tormenta-respuesta" role="status" aria-live="polite">
              <h3>{t(`agentes.titulo.${dialogo.experto}`)}</h3>
              {dialogo.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
              {dialogo.fuente && <TarjetaFuente fuente={dialogo.fuente} />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
