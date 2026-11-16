import { useEffect, useMemo, useRef, useState } from "react";
import { interlocutorDe, turno, actorDe, conversarConRed, reaccionTripulacion, MEMORIA_INICIAL, curiosidadMarte, type MomentoCuriosidad, type MemoriaConversacion, type OpcionConversacion, type RespuestaConversacion, type EntradaConversacion, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Action, BaseAction, Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { telemetriaPendiente, tormentaActiva, type Novedades } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { DialogoExperto } from "../componentes/DialogoExperto.js";
import { ControlesTactiles, useModoTactil } from "../componentes/ControlesTactiles.js";
import { HudBase, hudVisible, PROGRESO_INICIAL, type HudBaseProps, type ProgresoHud } from "../componentes/HudBase.js";
import { MISION_JEZERO } from "@solar-shield/missions";
import { Mapa } from "../componentes/Mapa.js";
import { Polvo } from "../componentes/Polvo.js";
import { ConfirmarAccion } from "../componentes/base/ConfirmarAccion.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono, type NombreIcono } from "../componentes/base/Iconos.js";
import { Mensaje } from "../componentes/base/Piezas.js";
import type { Persona } from "../componentes/base/Retrato.js";
import "../componentes/base/facetas.css";
import type { ActorId } from "../escena/frontera.js";
import { vistaEscena, type LugarObjetivo } from "../escena/vista.js";
import { DecisionRegistrada } from "./DecisionRegistrada.js";
import { averiaIrisRevelada, mundoBloqueado, objetivoDeLaBase, usoDelLugar } from "./lugares.js";
import { useAltoHoja, useMundo, usePosicionJugador, verboDe } from "./MundoBase.js";
import "./base.css";

/**
 * E6, fase `base` (ESCENAS §2.7 y §3.1–§3.5; MECANICAS §4). Capa sobre el mundo compartido
 * (`MundoBase`): la escena llena la pantalla y encima va el HUD de `mundo/01` (recursos y objetivo
 * arriba; `Crew` y `Map` abajo a la izquierda, la acción `[E]` al centro y la cámara `[V]` a la
 * derecha) o, con toque, el joystick y el botón de acción de la lámina de celular. El panel de
 * decisión NO está siempre: aparece solo con una consulta o una decisión abierta, a la derecha en
 * escritorio y apaisado, y como hoja inferior en vertical, con el mundo visible al lado o encima.
 * Toda acción pasa por el único `ConfirmarAccion` (APLICACION §5), con un solo despacho al motor
 * por confirmación. Acercarse a un lugar nunca cobra: "usar" abre el plan o la consulta.
 */

interface Opcion { accion: BaseAction; labelKey: string; icono: NombreIcono }

function opcionesDe(estado: GameState): Opcion[] {
  const lista: Opcion[] = [
    { accion: { tipo: "esperar" }, labelKey: "ui.accion.esperar", icono: "reloj" },
    { accion: { tipo: "refugiarse" }, labelKey: "ui.accion.refugiarse", icono: "vida" },
    { accion: { tipo: "subir_escudo", nivel: 1 }, labelKey: "ui.accion.subir_escudo", icono: "escudo" },
    { accion: { tipo: "salida_exterior", objetivo: "panel_solar" }, labelKey: "ui.accion.salida_exterior", icono: "llave" },
  ];
  if (estado.iaBase === "danada") lista.push({ accion: { tipo: "reparar", equipo: "ia_base" }, labelKey: "ui.accion.reparar_ia", icono: "llave" });
  if (tormentaActiva(estado) && !telemetriaPendiente(estado)) lista.push({ accion: { tipo: "enviar_telemetria" }, labelKey: "ui.paso.7.telemetria", icono: "satelite" });
  return lista;
}

const signo = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Qué ocupa el panel cuando no hay una decisión: la tripulación (con las acciones) o el mapa. */
type Panel = "tripulacion" | "mapa" | null;

export function PantallaBase({ memoria = MEMORIA_INICIAL, vistos = [], onConversacion, estado, colocados = [], ultimas, hud, progreso = PROGRESO_INICIAL, onProgreso, onAccion, onReanudar }: {
  memoria?: MemoriaConversacion;
  vistos?: string[];
  onConversacion?(memoria: MemoriaConversacion, vistos: string[]): void;

  estado: GameState;
  colocados?: readonly Equipment[];
  ultimas: Novedades | null;
  /** Reloj del HUD, que pone App; el objetivo (guía de Iris) y la fila de abajo los pone esta pantalla. */
  hud: Pick<HudBaseProps, "reloj">;
  /** Qué partes del HUD ya aparecieron en esta partida (E3); lo guarda App para que sobreviva a la tormenta. */
  progreso?: ProgresoHud;
  onProgreso?(p: Partial<ProgresoHud>): void;
  onAccion(a: Action): void;
  onReanudar(): void;
}) {
  const { t } = useT();
  const mundo = useMundo();
  const tactil = useModoTactil();
  const [plan, setPlan] = useState<BaseAction | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [preguntada, setPreguntada] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [opcionesCharla,setOpcionesCharla] = useState<OpcionConversacion[]>([]);
  const estadoActual=useRef(estado);estadoActual.current=estado;
  const solicitud = useRef(0);
  const memoriaActual = useRef(memoria);
  memoriaActual.current = memoria;
  useEffect(()=>()=>{++solicitud.current;},[]);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  // Panel 04 "Decision recorded": `antes` es el estado al confirmar; `despues` se toma en el render que ya trae la acción aplicada.
  const [registro, setRegistro] = useState<{ antes: GameState; despues: GameState | null } | null>(null);
  const origen = useRef<HTMLElement | null>(null);
  const hoja = useRef<HTMLElement>(null);
  // Una confirmación, un despacho: el doble toque o la tecla más el botón no cobran dos veces (MECANICAS §6.1).
  const confirmada = useRef(false);
  const tele = telemetriaPendiente(estado);
  const nivelIrisVisible=estado.iaBase==="danada"&&!averiaIrisRevelada(estado)?"tutorial":estado.iaBase;
  const modulos = useMemo(() => vistaEscena(estado, { fase: "base", colocados, averiaRevelada: averiaIrisRevelada(estado) }).modulos, [estado, colocados]);

  const hayNovedad = !!(estado.pausado && ultimas && (ultimas.malaSuerte.length > 0 || ultimas.iaCambio || ultimas.efectosLlegaron.length > 0));
  const abierto = { dialogo: dialogo !== null, plan: plan !== null, registro: registro !== null, panel: panel !== null, novedad: hayNovedad, campo: false };
  const hayPanel = mundoBloqueado(abierto);
  useAltoHoja(hoja, hayPanel);
  // Objetivo de Iris: texto de la píldora del HUD y lugar resaltado en la escena y el mapa.
  const objetivo = useMemo(() => objetivoDeLaBase(estado), [estado]);
  useEffect(() => { mundo.fijarObjetivo(objetivo.lugar); }, [objetivo.lugar, mundo.fijarObjetivo]);
  useEffect(() => () => mundo.fijarObjetivo(null), [mundo.fijarObjetivo]);
  // E3: `Map` llega con el primer objetivo que marca un lugar.
  useEffect(() => { if (objetivo.lugar && !progreso.objetivo) onProgreso?.({ objetivo: true }); }, [objetivo.lugar, progreso.objetivo]);
  const visible = hudVisible({ progreso, sin3d: mundo.sin3d, modulosListos: colocados.length >= MISION_JEZERO.modulosAColocar });

  // El mundo no se mueve ni se "usa" con algo abierto encima (frontera A/B: prop `bloqueado`).
  useEffect(() => { mundo.fijarBloqueado(hayPanel); }, [hayPanel, mundo.fijarBloqueado]);
  useEffect(() => () => mundo.fijarBloqueado(false), [mundo.fijarBloqueado]);

  function recordarOrigen() {
    const a = document.activeElement as HTMLElement | null;
    if (a && a !== document.body && !hoja.current?.contains(a)) origen.current = a;
  }
  /** Abre el panel de confirmación y recuerda quién lo abrió para devolverle el foco. */
  function abrirPlan(a: BaseAction) {
    recordarOrigen();
    confirmada.current = false;
    setPlan(a);
  }
  function devolverFoco() {
    const o = origen.current;
    requestAnimationFrame(() => {
      // Si el panel sigue abierto, el foco queda dentro; si no, vuelve a quien lo abrió o a Crew.
      if (hoja.current?.contains(document.activeElement)) return;
      const destino = hoja.current?.querySelector<HTMLElement>("button")
        ?? (o?.isConnected ? o : document.querySelector<HTMLElement>(".hud-abajo-izq button"));
      destino?.focus();
    });
  }
  function cerrarPlan() {
    setPlan(null);
    devolverFoco();
  }
  function confirmar(a: BaseAction) {
    ++solicitud.current;setOcupado(false);mundo.fijarCharla(null);
    if (confirmada.current) return;
    confirmada.current = true;
    setRegistro({ antes: estado, despues: null });
    onAccion(a);
    setDialogo(null);
    setPanel(null);
    setPlan(null);
  }
  // El reloj de la base sigue como estaba (no se pausa ni se reanuda): solo se cierra la tarjeta.
  function continuar() {
    setRegistro(null);
    devolverFoco();
  }
  useEffect(() => {
    if (registro && !registro.despues && estado !== registro.antes) { setRegistro({ antes: registro.antes, despues: estado }); hoja.current?.scrollTo({ top: 0 }); }
  }, [estado, registro]);

  async function conversarEntrada(entrada: EntradaConversacion) {
    const n=++solicitud.current;
    setOcupado(true);
    let r=await conversarConRed(entrada,{...estado,iaBase:nivelIrisVisible},memoriaActual.current,{tormentaActiva:tormentaActiva(estado),dosisMarte:referenciaDosis("marte-superficie"),vecesFallaIris:fallasIris,reaccion:reaccionTripulacion});
    if(n!==solicitud.current)return;
    if(estadoActual.current!==estado)r=turno({via:"texto",texto:""},estadoActual.current,memoriaActual.current,{tormentaActiva:tormentaActiva(estadoActual.current)});
    if (!progreso.conversado) onProgreso?.({conversado:true});
    memoriaActual.current=r.memoria;
    onConversacion?.(r.memoria,vistos);
    if("falla" in r.dialogo)setFallasIris(v=>v+1);
    setDialogo(r.dialogo);setOpcionesCharla(r.opciones);setOcupado(false);
    mundo.fijarCharla(r);
  }
  function hablar(entrada: Entrada) {
    if("texto" in entrada) void conversarEntrada({via:"texto",texto:entrada.texto});
    else if("experto" in entrada) void conversarEntrada({via:"boton",con:entrada.experto});
  }
  function curiosidad(momento: MomentoCuriosidad) {
    ++solicitud.current;setOcupado(false);setOpcionesCharla([]);
    const r=curiosidadMarte(momento,vistos);
    if(!r)return;
    onConversacion?.(memoriaActual.current,[...vistos,r.id]);
    setDialogo(r.dialogo);
    mundo.fijarCharla({actor:actorDe(r.dialogo.experto),globo:{clave:"agentes.curiosidad.ver_fuente"}});

  }
  function preguntar(id: GameState["tripulacion"][number]["id"]) {
    setPreguntada(id);
    hablar({ experto: id });
  }
  function enviarTexto(ev: React.FormEvent) {
    ev.preventDefault();
    if (!texto.trim()) return;
    hablar({ texto });
    setTexto("");
  }
  /** Cierra la consulta y el panel (no hay decisión abierta: no cambia nada del motor). */
  function cerrarTodo() {
    ++solicitud.current;setOcupado(false);mundo.fijarCharla(null);
    setDialogo(null);
    setPanel(null);
    devolverFoco();
  }
  function alternarPanel(p: Exclude<Panel, null>) {
    if (panel === p && !dialogo) { cerrarTodo(); return; }
    recordarOrigen();
    ++solicitud.current;setOcupado(false);mundo.fijarCharla(null);
    setDialogo(null);
    setPanel(p);
    requestAnimationFrame(() => hoja.current?.querySelector<HTMLElement>("h2, button")?.focus());
  }

  /** "Usar" un lugar (E de la escena, aviso [E] o botón de acción táctil): abre su plan y su consulta. */
  function usarLugar(l: LugarObjetivo) {
    if (plan || registro) return;
    const experta=({taller:'ingeniera',habitat:'doctora',sensor:'meteorologa'} as const)[l as 'taller'|'habitat'|'sensor'];
    if(experta){recordarOrigen();setPanel('tripulacion');void conversarEntrada({via:'acercarse',con:experta});return;}
    const uso = usoDelLugar(l, estado);
    recordarOrigen();
    setPanel(null);
    if (uso.consulta) hablar(uso.consulta); else setDialogo(null);
    if (uso.accion) abrirPlan(uso.accion);
    else requestAnimationFrame(() => hoja.current?.querySelector<HTMLElement>("button")?.focus());
  }
  const usar = useRef(usarLugar);
  usar.current = usarLugar;
  /** `[E] Talk` con alguien de la tripulación: su consulta, y la escena lo gira hacia el niño. */
  function hablarCon(a: ActorId) {
    if (plan || registro || a === "nino") return;
    recordarOrigen();
    setPanel(null);
    void conversarEntrada({via:"acercarse",con:interlocutorDe(a)});
    mundo.fijarHablando(a);
  }
  const conActor = useRef(hablarCon);
  conActor.current = hablarCon;
  // E2: `[E]` llega por una sola vía (MundoBase): aquí solo se decide qué hace en E6.
  useEffect(() => {
    mundo.fijarUso((i) => {
      if (i.tipo === "lugar") usar.current(i.lugar);
      else if (i.tipo === "actor") conActor.current(i.actor);
    });
    return () => mundo.fijarUso(null);
  }, [mundo.fijarUso]);
  useEffect(() => { if (!dialogo) mundo.fijarHablando(null); }, [dialogo, mundo.fijarHablando]);

  // Teclado (ESCENAS §3.5): Esc cierra lo de más arriba (el panel de confirmación se cierra solo).
  // `[E]` no se escucha aquí: tiene un solo manejador, en MundoBase (E2).
  const actual = useRef({ plan, hayPanel, cerrarTodo });
  actual.current = { plan, hayPanel, cerrarTodo };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const a = actual.current;
      if (e.key === "Escape" && !a.plan && a.hayPanel) a.cerrarTodo();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const uso = mundo.cercano ? usoDelLugar(mundo.cercano, estado) : null;
  // Acercarse al taller o al refugio abre la consulta con su experta (INTEGRACION-FRENTE-B), no el plan de
  // acción: el aviso `[E]` dice "Talk" para no prometer la reparación o el refugio. El sensor no entra: su
  // etiqueta ("Ask the Solar Meteorologist") ya describe la conversación y la e2e de E3 la comprueba.
  const consultaCercana = mundo.cercano === "taller" || mundo.cercano === "habitat";
  const disponibles = estado.tripulacion.filter((m) => m.disponible);
  const cerrable = (panel !== null || dialogo !== null) && !plan && !registro;
  const tituloHoja = registro ? "ui.decision.titulo" : plan ? "ui.decision.panel" : panel === "mapa" ? "ui.mapa.titulo" : panel === "tripulacion" ? "ui.tripulacion.titulo" : "ui.base.consulta";

  return (
    <section className={`base-e6${hayPanel ? " base-e6-con-panel" : ""}`} aria-label={t("ui.hud.titulo")}>
      <HudBase estado={estado} ultimas={ultimas} reloj={hud.reloj} objetivo={{ labelKey: objetivo.labelKey, vars: objetivo.vars }} tactil={tactil} panelAbierto={hayPanel} visible={visible}
        mundo={{
          onTripulacion: () => alternarPanel("tripulacion"),
          onMapa: () => alternarPanel("mapa"),
          interaccion: hayPanel ? undefined : mundo.interactivo?.tipo === "lugar" ? (uso ? { labelKey: consultaCercana ? "ui.tripulacion.hablar" : uso.labelKey, onUsar: mundo.usarCercano } : undefined)
            : mundo.interactivo ? { labelKey: `ui.interaccion.${verboDe(mundo.interactivo, "base")}`, onUsar: mundo.usarCercano } : undefined,

          camara: mundo.camara,
          onCamara: mundo.alternarCamara,
        }} />

      {tactil && !hayPanel && (
        <ControlesTactiles entrada={mundo.entrada} camara={mundo.camara} onCamara={mundo.alternarCamara}
          accion={uso && mundo.cercano ? { labelKey: consultaCercana ? "ui.tripulacion.hablar" : uso.labelKey, cortoKey: consultaCercana ? "ui.tripulacion.hablar" : `${uso.labelKey}.corto`, icono: uso.icono, onUsar: mundo.usarCercano } : undefined} />

      )}

      {hayPanel && (
        <aside className="base-panel" ref={hoja} aria-label={t(tituloHoja)}>
          {cerrable && (
            <div className="base-panel-cab">
              <FacetButton icon="atras" labelKey="ui.comun.cerrar" onClick={cerrarTodo} />
            </div>
          )}

          {hayNovedad && ultimas && (
            <section className="fc"><div className="fc-cara base-bloque base-novedades" role="status">
              {ultimas.malaSuerte.map((c, i) => (
                <Mensaje key={`m${i}`} tipo="aviso" tituloKey="ui.novedad.mala_suerte" detalleKey="ui.base.novedad.detalle"
                  vars={{ causaKey: c.descripcionKey, delta: c.delta !== undefined ? signo(c.delta) : "" }} />
              ))}
              {ultimas.iaCambio && <Mensaje tipo="aviso" tituloKey={`ui.iris.estado.${ultimas.iaCambio.a}`} />}
              {ultimas.efectosLlegaron.map((c, i) => (
                <Mensaje key={`e${i}`} tipo="exito" tituloKey="ui.novedad.efecto" detalleKey="ui.base.novedad.detalle"
                  vars={{ causaKey: c.descripcionKey, delta: c.delta !== undefined ? signo(c.delta) : "" }} />
              ))}
              {ultimas.malaSuerte.some((c) => c.descripcionKey === "mala_suerte.tormenta_polvo") && (
                <div className="base-polvo">{curiosidadMarte("polvo",vistos) && <FacetButton labelKey="ui.curiosidad.polvo" onClick={()=>curiosidad("polvo")} />}<Polvo estado={estado} onAccion={onAccion} onElegir={(a) => { onAccion(a); onReanudar(); }} /></div>
              )}
              <FacetButton variant="primary" icon="jugar" labelKey="ui.reanudar" onClick={onReanudar} />
            </div></section>
          )}

          {registro ? (
            registro.despues && (
              <section className="fc" aria-labelledby="base-decision-titulo"><div className="fc-cara base-bloque">
                <h2 id="base-decision-titulo">{t("ui.decision.titulo")}</h2>
                <DecisionRegistrada antes={registro.antes} despues={registro.despues} onContinuar={continuar} />
              </div></section>
            )
          ) : (
            <>
              {dialogo && (
                <DialogoExperto d={dialogo} irisDanada={estado.iaBase === "danada"} soloTexto={plan !== null} onPlan={abrirPlan}
                  onCerrar={() => { ++solicitud.current;setOcupado(false);mundo.fijarCharla(null);setDialogo(null); if (!panel) devolverFoco(); }}
                  onOtra={() => alternarPanel("tripulacion")} />
              )}
              {dialogo && opcionesCharla.length>0 && <div className="fila" aria-label={t("ui.tripulacion.titulo")}>
                {opcionesCharla.map(o=><FacetButton key={o.etiqueta.clave} labelKey={o.etiqueta.clave} onClick={()=>void conversarEntrada(o.entrada)} />)}
              </div>}
              {plan ? (
                <ConfirmarAccion estado={estado} accion={plan} onCancelar={cerrarPlan} onConfirmar={confirmar} />
              ) : panel === "mapa" ? (
                <MapaDeLaBase modulos={modulos} destino={mundo.destino ?? objetivo.lugar} onIrA={(l) => { mundo.irA(l); cerrarTodo(); }} />
              ) : panel === "tripulacion" ? (
                <>
                  <section className="fc"><div className="fc-cara base-bloque">
                    <h2>{t("ui.acciones.titulo")}</h2>
                    <p className="base-iris"><Icono nombre={nivelIrisVisible === "danada" ? "aviso" : "planeta"} tam={20} />{t(`ui.iris.estado.${nivelIrisVisible}`)}</p>
                    <p className="base-ayuda">{t("ui.base.acciones.ayuda")}</p>
                    <ul className="base-acciones">
                      {opcionesDe(estado).map((o) => (
                        <li key={o.labelKey} data-accion={o.labelKey}><FacetButton icon={o.icono} labelKey={o.labelKey} onClick={() => abrirPlan(o.accion)} /></li>
                      ))}
                    </ul>
                    {tele && <Mensaje tipo="pendiente" tituloKey="ui.paso.7.llegando" vars={{ ticks: tele.ticksRestantes }} />}
                  </div></section>

                  <section className="fc"><div className="fc-cara base-bloque">
                    <h2>{t("ui.tripulacion.titulo")}</h2>
                    <ul className="base-expertos">
                      {disponibles.map((m) => (
                        <li key={m.id}>
                          <ExpertPortrait persona={m.id as Persona} compacto seleccionado={preguntada === m.id} onElegir={() => preguntar(m.id)} />
                        </li>
                      ))}
                    </ul>
                    <div className="fila">
                      {(["llegada","suelo","lunas","remolino","atardecer","habitat","oxigeno"] as const).map(m=>{
                        const r=curiosidadMarte(m,vistos);
                        return r ? <FacetButton key={m} labelKey={`ui.curiosidad.${m}`} onClick={()=>curiosidad(m)} /> : null;
                      })}
                      {tormentaActiva(estado) && curiosidadMarte("radiacion",vistos) && <FacetButton labelKey="ui.curiosidad.radiacion" onClick={()=>curiosidad("radiacion")} />}
                      {tele && curiosidadMarte("telemetria",vistos) && <FacetButton labelKey="ui.curiosidad.telemetria" onClick={()=>curiosidad("telemetria")} />}
                    </div>
                    <form className="base-preguntar" onSubmit={enviarTexto}>
                      <label className="oculto-visual" htmlFor="base-campo">{t("ui.base.tripulacion.campo")}</label>
                      <input id="base-campo" type="text" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} placeholder={t("ui.base.tripulacion.campo")} />
                      <FacetButton type="submit" labelKey="ui.tripulacion.enviar" busy={ocupado} onClick={() => undefined} />
                    </form>
                  </div></section>

                  <details className="fc base-registro"><summary className="fc-cara fc-chico">{t("ui.paso.8.titulo")}</summary>
                    <ul>
                      {[...estado.causas].reverse().slice(0, 30).map((c, i) => (
                        <li key={i}>
                          <span className="base-registro-turno">{t("ui.tick", { tick: c.tick })}</span>
                          <span>{t(c.descripcionKey)}{c.accion && c.descripcionKey.startsWith("causa.") ? ` (${describirAccion(c.accion, t)})` : ""}</span>
                          {c.delta !== undefined && <span className={`delta ${c.delta > 0 ? "delta-mas" : "delta-menos"}`}>{signo(c.delta)}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : null}
            </>
          )}
        </aside>
      )}
    </section>
  );
}

/** El mapa lee la posición real del jugador (hasta 5 veces por segundo) sin volver a pintar la pantalla entera. */
function MapaDeLaBase({ modulos, destino, onIrA }: { modulos: ReturnType<typeof vistaEscena>["modulos"]; destino: LugarObjetivo | null; onIrA(l: LugarObjetivo): void }) {
  const posicion = usePosicionJugador();
  return <Mapa posicion={posicion} objetivo={destino} modulos={modulos} onIrA={onIrA} />;
}
