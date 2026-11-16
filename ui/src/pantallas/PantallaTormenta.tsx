import { useEffect, useMemo, useRef, useState } from "react";
import { conversar, escenaTormenta, escenaTormentaLunaSur, escenaTormentaLunaVisible, escenaTormentaOutpost, escenaTormentaPoloNorte, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { costoDe, puedeAplicar, tormentaActiva } from "@solar-shield/engine";
import { misionActiva } from "../juego/misiones.js";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { CostRow } from "../componentes/base/Piezas.js";
import { ChipPregunta } from "../componentes/base/Accesos.js";
import { ChipPausa } from "../componentes/base/PanelFacetado.js";
import "../componentes/base/paneles.css";
import { DecisionRegistrada } from "./DecisionRegistrada.js";
import { useAltoHoja, useMundo } from "./MundoBase.js";
import "../componentes/base/facetas.css";
import "./tormenta.css";

/** Los tres expertos de ui/04 "Choose your expert" (personajes/07), en el orden de la lámina. */
const EXPERTOS = ["ingeniera", "doctora", "meteorologa"] as const;
type Experto = (typeof EXPERTOS)[number];
const opciones = () => misionActiva().dilemaPaso6.opciones;

/** la escena de la tormenta con las voces de la misión activa (agents/voces-*.ts). */
const ESCENA_DE_MISION: Record<string, typeof escenaTormenta> = {
  "luna-polo-sur": escenaTormentaLunaSur,
  "luna-lado-visible": escenaTormentaLunaVisible,
  "outpost-sorpresa": escenaTormentaOutpost,
  "marte-polo-norte": (v, dilema) => escenaTormentaPoloNorte(v, dilema),
};
const escenaDeMision: typeof escenaTormenta = (v, dilema, medicion) => (ESCENA_DE_MISION[misionActiva().id] ?? escenaTormenta)(v, dilema, medicion);
/** La opción que defiende cada experta; la meteoróloga no defiende ninguna, así que le toca la que nadie recomienda. */
const opcionDe = (p: Experto) => (opciones().find((o) => o.defiende === p) ?? opciones().find((o) => o.defiende === null) ?? opciones()[0]!).id;
const NADA = () => undefined;

/**
 * E7 Tormenta, panel 01 de ui/04 (ESCENAS §2.7): capa sobre el mundo compartido (`MundoBase`), que
 * sigue a la vista con la base y el niño. El panel va acoplado como el de decisión: a la derecha
 * (máximo 40 %) en escritorio y apaisado, hoja inferior en vertical, con desplazamiento interno.
 * Chip "Paused", "Choose your expert" con tres retratos y el campo "Ask your crew…". Los recursos
 * se leen solo en el HUD (sin repetir medidores en el panel). Las respuestas salen de `conversar()`, igual que en la base. Los paneles 02 a 04
 * (comparar, verificar, decisión registrada) van en el mismo marco. Es la pantalla de la fase
 * tormenta (reemplaza a la vieja `Tormenta.tsx`).
 * Panel 04 "Decision recorded": con `registro` (el estado de antes de confirmar) muestra lo que
 * cobró el motor; "Return to exploration" (`onSeguir`) reanuda el juego.
 * Panel 02 "Compare your plan": la experta elegida con su frase y la acción con los costos del
 * motor (`costoDe`, más el extra del invernadero que `elegirDilema` cobra). Confirmar manda el
 * mismo evento que la pantalla vieja (`onDecidir`); "Ask another expert" conserva la acción.
 * Panel 03 "Verify the warning": se abre desde el panel b con "Check the source" y reúne a las dos
 * expertas que se contradicen (las del dilema: Ingeniera y Doctora), la tarjeta de la fuente NASA y
 * dos preguntas cuyas respuestas son líneas reales de `escenaTormenta`. "Back" vuelve al panel b.
 */
export function PantallaTormenta({ estado, colocados, registro, onSeguir, onDecidir, onConverso }: { estado: GameState; colocados: readonly Equipment[]; registro?: GameState | null; onSeguir?: () => void; onDecidir?: (previas: [], opcionId: string) => void;
  /** Hablar con una experta cuenta como la primera conversación del HUD progresivo (E3). */
  onConverso?: () => void }) {
  const { t } = useT();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  const [plan, setPlan] = useState<{ experta: Experto; opcionId: string } | null>(null);
  const [conservada, setConservada] = useState<string | undefined>(undefined);
  const [verificando, setVerificando] = useState(false);
  const escena = useMemo(() => escenaDeMision(estado, opciones()), [estado.tormenta]);
  // La decisión está abierta toda la fase: el mundo se ve pero no se mueve ni se "usa".
  const { fijarBloqueado } = useMundo();
  useEffect(() => { fijarBloqueado(true); return () => fijarBloqueado(false); }, [fijarBloqueado]);
  // Cada panel (elegir, comparar, verificar, decisión) empieza arriba: el título no queda tapado.
  const cara = useRef<HTMLDivElement>(null);
  const vistaPanel = registro ? "decision" : plan ? (verificando ? "verificar" : "comparar") : "elegir";
  useEffect(() => { cara.current?.scrollTo?.({ top: 0 }); }, [vistaPanel]);
  useAltoHoja(cara, true);

  function hablar(entrada: Entrada) {
    const d = conversar(entrada, estado, { tormentaActiva: tormentaActiva(estado, misionActiva()), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris });
    if ("falla" in d) setFallasIris((n) => n + 1);
    setDialogo(d);
    onConverso?.();
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
      {/* Cinta ciruela numerada de ui/04 ("01 / CHOOSE YOUR EXPERT"), rescatada de #309 (PanelFacetado). */}
      <div className="fc pf tormenta-panel">
        <div ref={cara} className={`fc-cara pf-cara tormenta-cara${plan && verificando ? " tormenta-cara-verif" : ""}`}>
          <header className="pf-cab tormenta-cabeza">
            <h2 id="tormenta-titulo" className="pf-cinta tormenta-titulo">{`0${{ elegir: 1, comparar: 2, verificar: 3, decision: 4 }[vistaPanel]} / `}{t(registro ? "ui.decision.titulo" : plan ? (verificando ? "ui.tormenta.verificar" : "ui.tormenta.comparar") : "ui.tormenta.elegir")}</h2>
            <ChipPausa />
          </header>

          {registro ? <DecisionRegistrada antes={registro} despues={estado} onContinuar={() => onSeguir?.()} />
          : plan && verificando && escena ? <Verificar estado={estado} dialogos={escena.dialogos} onAtras={() => setVerificando(false)} />
          : plan ? <PlanComparado estado={estado} colocados={colocados} plan={plan} dialogo={escena?.dialogos.find((d) => d.experto === plan.experta)}
            onVerificar={() => setVerificando(true)} onOtra={() => { setConservada(plan.opcionId); setElegido(null); setPlan(null); }} onAtras={() => { setConservada(undefined); setElegido(null); setPlan(null); }} onDecidir={onDecidir} /> : <>
          <p className="tormenta-guia">{t("ui.tormenta.guia")}</p>

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
            <FacetButton type="submit" icon="avion_papel" labelKey="ui.tripulacion.enviar" onClick={NADA} />
          </form>

          <ul className="tormenta-preguntas" aria-label={t("ui.base.charla.opciones")}>
            <li><ChipPregunta icono="escudo" labelKey="ui.tormenta.pregunta.proteger" onClick={() => { setElegido(null); hablar({ texto: t("ui.tormenta.pregunta.proteger") }); }} /></li>
            <li><ChipPregunta icono="sol" labelKey="ui.tormenta.pregunta.sensor" onClick={() => { setElegido(null); hablar({ texto: t("ui.tormenta.pregunta.sensor") }); }} /></li>
          </ul>

          {dialogo && (
            <div className="fc">
              <div className="fc-cara tormenta-respuesta" role="status" aria-live="polite">
                <h3>{t(`agentes.titulo.${dialogo.experto}`)}</h3>
                {dialogo.experto === "ia_base" && <p className="tormenta-respuesta-aviso">{t("ui.tormenta.irisAviso")}</p>}
                {dialogo.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
                {dialogo.fuente && <TarjetaFuente fuente={dialogo.fuente} />}
                <div className="tormenta-respuesta-acciones">
                  {EXPERTOS.includes(dialogo.experto as Experto) ? (
                    <FacetButton variant="primary" icon="escudo" labelKey="ui.tormenta.comparar"
                      onClick={() => { const exp = dialogo.experto as Experto; setElegido(exp); comparar(exp); }} />
                  ) : (
                    <>
                      <FacetButton variant="primary" icon="escudo" labelKey="ui.accion.subir_escudo"
                        onClick={() => { setElegido("ingeniera"); hablar({ experto: "ingeniera" }); comparar("ingeniera"); }} />
                      <FacetButton icon="vida" labelKey="ui.accion.refugiarse"
                        onClick={() => { setElegido("doctora"); hablar({ experto: "doctora" }); comparar("doctora"); }} />
                    </>
                  )}
                </div>
              </div>
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
  const o = opciones().find((x) => x.id === opcionId)!;
  const { inmediato, retrasado } = costoDe(o.accion, misionActiva());
  if (!o.extra || (o.extraSiTiene && !colocados.includes(o.extraSiTiene))) return { o, inmediato, retrasado };
  const suma = (a: typeof inmediato, b: typeof inmediato) => ({ ...a, ...Object.fromEntries(Object.entries(b).map(([r, v]) => [r, ((a as Record<string, number>)[r] ?? 0) + v])) });
  return { o, inmediato: suma(inmediato, o.extra.inmediato), retrasado: suma(retrasado, o.extra.retrasado) };
}

/** Panel 02 de ui/04: la experta con su frase a la izquierda; la acción, sus costos y los botones a la derecha. */
function PlanComparado({ estado, colocados, plan, dialogo, onOtra, onVerificar, onAtras, onDecidir }: {
  estado: GameState; colocados: readonly Equipment[]; plan: { experta: Experto; opcionId: string }; dialogo: Dialogo | undefined;
  onOtra(): void; onVerificar(): void; onAtras(): void; onDecidir: ((previas: [], opcionId: string) => void) | undefined;
}) {
  const { t } = useT();
  const { o, inmediato, retrasado } = costosDe(plan.opcionId, colocados);
  const permiso = puedeAplicar(estado, o.accion, misionActiva());
  const linea = dialogo?.lineas[0];
  return (
    <div className="tormenta-plan">
      <div className="tormenta-plan-experta">
        <ExpertPortrait persona={plan.experta} compacto />
        {linea && <p className="tormenta-frase">{t(linea.clave, linea.vars)}</p>}
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
      {/* En la columna del panel, "Ask another expert" y la fuente van después de decidir (lámina de tableta). */}
      <div className="tormenta-plan-mas">
        <FacetButton icon="tripulacion" labelKey="ui.tormenta.otra" onClick={onOtra} className="tormenta-otra" />
        <FacetButton icon="enlace" labelKey="ui.tormenta.fuente" onClick={onVerificar} className="tormenta-otra" />
      </div>
    </div>
  );
}

const PREGUNTAS = [
  { id: "proteger", icono: "escudo", experta: "doctora" },
  { id: "sensor", icono: "energia", experta: "ingeniera" },
] as const;

/** Panel 03 de ui/04: las dos expertas que se contradicen a la izquierda; fuente, preguntas y enlace a la derecha. */
function Verificar({ estado, dialogos, onAtras }: { estado: GameState; dialogos: readonly Dialogo[]; onAtras(): void }) {
  const { t } = useT();
  const [pregunta, setPregunta] = useState<(typeof PREGUNTAS)[number]["id"] | null>(null);
  const fuente = estado.tormenta!.fuente;
  const de = (e: Experto) => dialogos.find((d) => d.experto === e);
  const respuesta = PREGUNTAS.find((q) => q.id === pregunta);
  const linea = respuesta && de(respuesta.experta)?.lineas[1];
  return (
    <div className="tormenta-plan">
      <div className="tormenta-verif-expertas">
        {(["ingeniera", "doctora"] as const).map((e) => {
          const l = de(e)?.lineas[0];
          return (
            <div key={e} className="tormenta-plan-experta">
              <ExpertPortrait persona={e} compacto />
              {l && <p className="tormenta-frase">{t(l.clave, l.vars)}</p>}
            </div>
          );
        })}
      </div>
      <div className="tormenta-plan-accion tormenta-verif">
        <span className="fc"><span className="fc-cara fc-chico tormenta-pieza"><span>{t("ui.tormenta.fuente")}</span></span></span>
        <TarjetaFuente fuente={fuente} />
        <ul className="tormenta-preguntas">
          {PREGUNTAS.map((q) => (
            <li key={q.id}><ChipPregunta icono={q.icono} labelKey={`ui.tormenta.pregunta.${q.id}`} selected={pregunta === q.id ? true : undefined} onClick={() => setPregunta(q.id)} /></li>
          ))}
        </ul>
        {linea && <p className="tormenta-respuesta-fuente" role="status">{t(linea.clave, linea.vars)}</p>}
        <div className="tormenta-plan-botones">
          <span className="fb-caja">
            <a className="fb fb-primary" href={fuente.url} target="_blank" rel="noopener noreferrer">
              <span className="fb-sombra" aria-hidden="true" />
              <span className="fb-superficie">
                <Icono nombre="enlace" tam={26} className="fb-icono" />
                <span className="fb-texto">{t("ui.tormenta.verFuente")}<span className="oculto-visual"> {t("ui.datos.ventana_nueva")}</span></span>
              </span>
            </a>
          </span>
          <FacetButton labelKey="ui.comun.atras" onClick={onAtras} />
        </div>
      </div>
    </div>
  );
}
