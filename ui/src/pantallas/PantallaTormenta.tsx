import { useMemo, useState } from "react";
import { conversar, escenaTormenta, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { costoDe, puedeAplicar, tormentaActiva } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { CostRow, ICONO_RECURSO, RECURSOS } from "../componentes/base/Piezas.js";
import { EscenaBase } from "../escena/EscenaBase.js";
import { vistaEscena } from "../escena/vista.js";
import "../componentes/base/facetas.css";
import "./tormenta.css";

/** Los tres expertos de ui/04 "Choose your expert" (personajes/07), en el orden de la lámina. */
const EXPERTOS = ["ingeniera", "doctora", "meteorologa"] as const;
/** Lo que se le pregunta a la tripulación al tocar el acceso de cada recurso (lo entiende el clasificador). */
const PREGUNTA_RECURSO = { energia: "energy", soporte_vital: "health", blindaje: "shield" } as const;
type Experto = (typeof EXPERTOS)[number];
const OPCIONES = MISION_JEZERO.dilemaPaso6.opciones;
/** La opción que defiende cada experta; la meteoróloga no defiende ninguna, así que le toca la que nadie recomienda. */
const opcionDe = (p: Experto) => (OPCIONES.find((o) => o.defiende === p) ?? OPCIONES.find((o) => o.defiende === null) ?? OPCIONES[0]!).id;
const SIN_EVENTOS: never[] = [];
const NADA = () => undefined;

/**
 * E7 Tormenta, panel 01 de ui/04 (ESCENAS §2.7): la escena en pausa detrás, el chip "Paused" y
 * "Choose your expert" con tres retratos, el campo "Ask your crew…" y un acceso por recurso con su
 * valor real. Las respuestas salen de `conversar()`, igual que en la base. Los paneles 02 a 04
 * (comparar, verificar, decisión registrada) llegan en PRs siguientes; mientras tanto la fase
 * tormenta sigue sirviéndola `Tormenta.tsx`.
 * Panel 02 "Compare your plan": la experta elegida con su frase y la acción con los costos del
 * motor (`costoDe`, más el extra del invernadero que `elegirDilema` cobra). Confirmar manda el
 * mismo evento que la pantalla vieja (`onDecidir`); "Ask another expert" conserva la acción.
 */
export function PantallaTormenta({ estado, colocados, onDecidir }: { estado: GameState; colocados: readonly Equipment[]; onDecidir?: (previas: [], opcionId: string) => void }) {
  const { t } = useT();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  const [plan, setPlan] = useState<{ experta: Experto; opcionId: string } | null>(null);
  const [conservada, setConservada] = useState<string | undefined>(undefined);
  const escena = useMemo(() => escenaTormenta(estado, OPCIONES), [estado.tormenta]);
  const vista = vistaEscena(estado, { fase: "tormenta", colocados });

  function hablar(entrada: Entrada) {
    const d = conversar(entrada, estado, { tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris });
    if ("falla" in d) setFallasIris((n) => n + 1);
    setDialogo(d);
  }
  /** Pasa al panel b: si ya hay una acción (venimos de "Ask another expert") se conserva. */
  function comparar(p: Experto) { setPlan({ experta: p, opcionId: conservada ?? opcionDe(p) }); setConservada(undefined); }
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
            <h2 id="tormenta-titulo" className="tormenta-titulo">{t(plan ? "ui.tormenta.comparar" : "ui.tormenta.elegir")}</h2>
            <span className="fc"><span className="fc-cara fc-chico tormenta-pausa"><Icono nombre="reloj" tam={20} /><span>{t("ui.comun.pausado")}</span></span></span>
          </header>

          {plan ? <PlanComparado estado={estado} colocados={colocados} plan={plan} dialogo={escena?.dialogos.find((d) => d.experto === plan.experta)}
            onOtra={() => { setConservada(plan.opcionId); setElegido(null); setPlan(null); }} onAtras={() => { setConservada(undefined); setElegido(null); setPlan(null); }} onDecidir={onDecidir} /> : <>
          <ul className="tormenta-expertos">
            {EXPERTOS.map((p) => (
              <li key={p}>
                <ExpertPortrait persona={p} seleccionado={elegido === p}
                  onElegir={() => { setElegido(p); hablar({ experto: p }); comparar(p); }} />
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
          </>}
        </div>
      </div>
    </section>
  );
}

/** Suma los números del motor: el costo de la acción y, si hay invernadero, la comida que `elegirDilema` le quita. */
function costosDe(opcionId: string, colocados: readonly Equipment[]) {
  const o = OPCIONES.find((x) => x.id === opcionId)!;
  const { inmediato, retrasado } = costoDe(o.accion);
  if (!o.extra || (o.extraSiTiene && !colocados.includes(o.extraSiTiene))) return { o, inmediato, retrasado };
  const suma = (a: typeof inmediato, b: typeof inmediato) => ({ ...a, ...Object.fromEntries(Object.entries(b).map(([r, v]) => [r, ((a as Record<string, number>)[r] ?? 0) + v])) });
  return { o, inmediato: suma(inmediato, o.extra.inmediato), retrasado: suma(retrasado, o.extra.retrasado) };
}

/** Panel 02 de ui/04: la experta con su frase a la izquierda; la acción, sus costos y los botones a la derecha. */
function PlanComparado({ estado, colocados, plan, dialogo, onOtra, onAtras, onDecidir }: {
  estado: GameState; colocados: readonly Equipment[]; plan: { experta: Experto; opcionId: string }; dialogo: Dialogo | undefined;
  onOtra(): void; onAtras(): void; onDecidir: ((previas: [], opcionId: string) => void) | undefined;
}) {
  const { t } = useT();
  const { o, inmediato, retrasado } = costosDe(plan.opcionId, colocados);
  const permiso = puedeAplicar(estado, o.accion);
  const linea = dialogo?.lineas[0];
  return (
    <div className="tormenta-plan">
      <div className="tormenta-plan-experta">
        <ExpertPortrait persona={plan.experta} compacto />
        {linea && <p className="tormenta-frase">{t(linea.clave, linea.vars)}</p>}
        <FacetButton icon="check" labelKey="ui.tormenta.otra" onClick={onOtra} className="tormenta-otra" />
      </div>
      <div className="tormenta-plan-accion">
        <span className="fc"><span className="fc-cara fc-chico tormenta-pieza"><span>{o.accion.tipo === "redistribuir_energia" ? t("ui.accion.redistribuir") : describirAccion(o.accion, t)}</span></span></span>
        <CostRow inmediato={inmediato} retrasado={retrasado} />
        <div className="tormenta-plan-botones">
          <FacetButton variant="primary" icon="check" labelKey="ui.comun.confirmar" disabled={!permiso.ok || !onDecidir}
            disabledReasonKey={permiso.ok ? undefined : `ui.comun.motivo.${permiso.motivo}${permiso.recurso ? `.${permiso.recurso}` : ""}`}
            onClick={() => onDecidir?.([], o.id)} />
          <FacetButton labelKey="ui.comun.atras" onClick={onAtras} />
        </div>
      </div>
    </div>
  );
}
