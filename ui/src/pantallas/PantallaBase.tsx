import { useEffect, useMemo, useRef, useState } from "react";
import { conversarConRed, CURIOSIDADES_MARTE, curiosidadMarte, interlocutorDe, MEMORIA_INICIAL, reaccionTripulacion, type Dialogo, type EntradaConversacion, type MemoriaConversacion, type MomentoCuriosidad, type OpcionConversacion } from "@solar-shield/agents";
import type { Action, BaseAction, Equipment, GameState } from "@solar-shield/contracts";
import { FUENTE_DISTANCIA, referenciaDosis } from "@solar-shield/data";
import type { SourceCard } from "@solar-shield/contracts";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";
import { telemetriaPendiente, tormentaActiva, type Novedades } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { actorDeExperto, DialogoExperto, duracionGlobo, formaDeDialogo } from "../componentes/DialogoExperto.js";
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
import { averiaIrisRevelada, estadoIrisVisible, mundoBloqueado, objetivoDeLaBase, usoDelLugar } from "./lugares.js";
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
  // Reparar a Iris solo desde que la avería se ve (paso 6, #339): antes Iris guía como si estuviera bien.
  if (averiaIrisRevelada(estado)) lista.push({ accion: { tipo: "reparar", equipo: "ia_base" }, labelKey: "ui.accion.reparar_ia", icono: "llave" });
  if (tormentaActiva(estado) && !telemetriaPendiente(estado)) lista.push({ accion: { tipo: "enviar_telemetria" }, labelKey: "ui.paso.7.telemetria", icono: "satelite" });
  return lista;
}

const signo = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Qué ocupa el panel cuando no hay una decisión: la tripulación (con las acciones) o el mapa. */
type Panel = "tripulacion" | "mapa" | null;

/**
 * #137: de dónde sale "3 a 22 minutos" (data/src/comunicaciones.ts): distancias mínima y máxima Tierra–Marte
 * de la ficha de Marte de NASA NSSDC y la velocidad de la luz. Misma cita que agents usa para el año marciano.
 */
const FUENTE_RETRASO: SourceCard = {
  nombreKey: "fuente.nssdc",
  url: FUENTE_DISTANCIA,
  idFuente: "marsfact-distancia",
  consultadoEl: "2026-11-14",
  dueno: "NASA NSSDC",
  estadoDato: "curado",
};

export function PantallaBase({ estado, colocados = [], ultimas, hud, progreso = PROGRESO_INICIAL, onProgreso, memoria = MEMORIA_INICIAL, onMemoria, vistos = [], onVisto, onAccion, onReanudar }: {
  estado: GameState;
  colocados?: readonly Equipment[];
  ultimas: Novedades | null;
  /** Reloj del HUD, que pone App; el objetivo (guía de Iris) y la fila de abajo los pone esta pantalla. */
  hud: Pick<HudBaseProps, "reloj" | "onMenu">;
  /** Qué partes del HUD ya aparecieron en esta partida (E3); lo guarda App para que sobreviva a la tormenta. */
  progreso?: ProgresoHud;
  onProgreso?(p: Partial<ProgresoHud>): void;
  /** Lo que la tripulación recuerda de esta partida (frente B, #377). Lo guarda App; solo sale texto. */
  memoria?: MemoriaConversacion;
  onMemoria?(m: MemoriaConversacion): void;
  /** Curiosidades de Marte ya contadas en esta partida (B4): cada una sale una sola vez. Las guarda App. */
  vistos?: readonly string[];
  onVisto?(id: string): void;
  onAccion(a: Action): void;
  onReanudar(): void;
}) {
  const { t } = useT();
  const mundo = useMundo();
  const tactil = useModoTactil();
  const [plan, setPlan] = useState<BaseAction | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  // E5: línea corta dicha en el mundo. Va en el globo sobre quien habla y se va sola al terminar de leerse.
  const [corto, setCorto] = useState<{ actor: ActorId; experto: string; texto: string; n: number } | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [preguntada, setPreguntada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  // #377: la conversación pasa por el adaptador de B (atajos, modelo vía /api/clasificar o respaldo local).
  // `solicitud` descarta una respuesta que llega tarde si el niño ya cerró o abrió otra cosa.
  const [opciones, setOpciones] = useState<OpcionConversacion[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const solicitud = useRef(0);
  const memoriaActual = useRef(memoria);
  memoriaActual.current = memoria;
  useEffect(() => () => { solicitud.current++; }, []);
  const [fallasIris, setFallasIris] = useState(0);
  // Panel 04 "Decision recorded": `antes` es el estado al confirmar; `despues` se toma en el render que ya trae la acción aplicada.
  const [registro, setRegistro] = useState<{ antes: GameState; despues: GameState | null } | null>(null);
  const origen = useRef<HTMLElement | null>(null);
  const hoja = useRef<HTMLElement>(null);
  // Una confirmación, un despacho: el doble toque o la tecla más el botón no cobran dos veces (MECANICAS §6.1).
  const confirmada = useRef(false);
  const tele = telemetriaPendiente(estado);
  const modulos = useMemo(() => vistaEscena(estado, { fase: "base", colocados, averiaRevelada: averiaIrisRevelada(estado) }).modulos, [estado, colocados]);

  const hayNovedad = !!(estado.pausado && ultimas && (ultimas.malaSuerte.length > 0 || ultimas.iaCambio || ultimas.efectosLlegaron.length > 0));
  const esFranjaAbajo = dialogo !== null && !plan && !registro && !panel && !hayNovedad;
  const abierto = { dialogo: dialogo !== null && !esFranjaAbajo, plan: plan !== null, registro: registro !== null, panel: panel !== null, novedad: hayNovedad, campo: false };
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
  /**
   * B4: momentos que de verdad están ocurriendo en la partida o en la escena. Una curiosidad solo se ofrece
   * en su momento real; las de cosas que la escena no muestra (atardecer, remolinos, lunas, MOXIE) no.
   */
  function momentosReales(): MomentoCuriosidad[] {
    const m: MomentoCuriosidad[] = ["llegada"];
    if (tormentaActiva(estado)) m.push("radiacion");
    if (tele) m.push("telemetria");
    if (ultimas?.malaSuerte.some((c) => c.descripcionKey === "mala_suerte.tormenta_polvo")) m.push("polvo");
    if (mundo.cercano === "habitat") m.push("habitat");
    return m;
  }
  /** La curiosidad que puede contar quien habla ahora, si su momento es real y todavía no la contó. */
  const curiosidadDe = (experto: string) => {
    const reales = momentosReales();
    const dato = CURIOSIDADES_MARTE.find((c) => c.experto === experto && reales.includes(c.momento) && !vistos.includes(c.id));
    return dato ? curiosidadMarte(dato.momento, vistos) : null;
  };
  /** Cuenta la curiosidad en la franja, con su tarjeta de fuente NASA (dato curado, no en vivo). */
  function contarCuriosidad(c: { id: string; dialogo: Dialogo }) {
    solicitud.current++;
    setOcupado(false);
    onVisto?.(c.id);
    setDialogo(c.dialogo);
  }
  /** Deja de esperar la respuesta en curso (cerrar, abrir otro panel o decidir). No cambia nada del juego. */
  function soltarCharla() {
    solicitud.current++;
    setOcupado(false);
    setOpciones([]);
  }
  function confirmar(a: BaseAction) {
    soltarCharla();
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

  /**
   * `desdeMundo`: la conversación nace en el mundo (`[E]` en un lugar o un tripulante) sin una decisión
   * abierta. Solo así, si es corta y quien habla está en escena, va al globo (E5); si no, a la franja.
   */
  async function hablar(entrada: EntradaConversacion, desdeMundo = false) {
    const n = ++solicitud.current;
    setOcupado(true);
    const r = await conversarConRed(entrada, estado, memoriaActual.current, {
      tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris, reaccion: reaccionTripulacion,
      // #401: antes del paso de la revelación Iris habla como si estuviera bien (igual que su guía en la escena).
      averiaRevelada: averiaIrisRevelada(estado),
    });
    if (n !== solicitud.current) return;
    setOcupado(false);
    memoriaActual.current = r.memoria;
    onMemoria?.(r.memoria);
    const d = r.dialogo;
    if ("falla" in d) setFallasIris((v) => v + 1);
    const actor = actorDeExperto(d.experto);
    const texto = d.lineas.map((l) => t(l.clave, l.vars)).join(" ");
    // E5: con opciones para seguir hablando es una conversación larga: va a la franja con sus botones.
    if (desdeMundo && actor && !mundo.sin3d && r.opciones.length === 0 && formaDeDialogo(d, texto) === "globo") {
      setDialogo(null);
      setOpciones([]);
      setCorto((c) => ({ actor, experto: d.experto, texto, n: (c?.n ?? 0) + 1 }));
    } else {
      setCorto(null);
      setDialogo(d);
      setOpciones(r.opciones);
    }
    // E3: la primera conversación con la tripulación trae `Crew` al HUD.
    if (!progreso.conversado) onProgreso?.({ conversado: true });
  }
  function preguntar(id: GameState["tripulacion"][number]["id"], desdeMundo = false) {
    setPreguntada(id);
    void hablar(desdeMundo ? { via: "acercarse", con: id } : { via: "boton", con: id }, desdeMundo);
  }
  function enviarTexto(ev: React.FormEvent) {
    ev.preventDefault();
    if (!texto.trim() || ocupado) return;
    void hablar({ via: "texto", texto });
    setTexto("");
  }
  /** Cierra la consulta y el panel (no hay decisión abierta: no cambia nada del motor). */
  function cerrarTodo() {
    soltarCharla();
    setDialogo(null);
    setPanel(null);
    devolverFoco();
  }
  function alternarPanel(p: Exclude<Panel, null>) {
    if (panel === p && !dialogo) { cerrarTodo(); return; }
    recordarOrigen();
    soltarCharla();
    setDialogo(null);
    setPanel(p);
    requestAnimationFrame(() => hoja.current?.querySelector<HTMLElement>("h2, button")?.focus());
  }

  /** "Usar" un lugar (E de la escena, aviso [E] o botón de acción táctil): abre su plan y su consulta. */
  function usarLugar(l: LugarObjetivo) {
    if (plan || registro) return;
    const uso = usoDelLugar(l, estado);
    recordarOrigen();
    setPanel(null);
    // Los lugares siempre consultan a una experta o a Iris (`usoDelLugar`): llegar es acercarse a ella.
    if (uso.consulta && "experto" in uso.consulta) void hablar({ via: "acercarse", con: uso.consulta.experto }, !uso.accion); else setDialogo(null);
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
    if (a === "iris") void hablar({ via: "acercarse", con: interlocutorDe(a) }, true); else preguntar(a, true);
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
  useEffect(() => { if (!dialogo && !corto) mundo.fijarHablando(null); }, [dialogo, corto, mundo.fijarHablando]);
  // Con la franja abierta, quien habla (si está en escena) gira hacia el niño y la guía de Iris calla.
  useEffect(() => {
    const a = dialogo ? actorDeExperto(dialogo.experto) : null;
    if (a) mundo.fijarHablando(a);
  }, [dialogo, mundo.fijarHablando]);
  // E5: el globo sobre quien habla, y que se vaya solo; abrir un panel o una decisión también lo quita.
  useEffect(() => {
    if (!corto) { mundo.fijarGlobo(null); return; }
    mundo.fijarGlobo({ actor: corto.actor, texto: corto.texto });
    mundo.fijarHablando(corto.actor);
    const id = window.setTimeout(() => setCorto(null), duracionGlobo(corto.texto));
    return () => window.clearTimeout(id);
  }, [corto, mundo.fijarGlobo, mundo.fijarHablando]);
  useEffect(() => { if (hayPanel) setCorto(null); }, [hayPanel]);
  useEffect(() => () => mundo.fijarGlobo(null), [mundo.fijarGlobo]);

  // Teclado (ESCENAS §3.5): Esc cierra lo de más arriba (el panel de confirmación se cierra solo).
  // `[E]` no se escucha aquí: tiene un solo manejador, en MundoBase (E2).
  const actual = useRef({ plan, hayPanel, esFranjaAbajo, cerrarTodo });
  actual.current = { plan, hayPanel, esFranjaAbajo, cerrarTodo };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const a = actual.current;
      if (e.key === "Escape" && !a.plan && (a.hayPanel || a.esFranjaAbajo)) a.cerrarTodo();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const uso = mundo.cercano ? usoDelLugar(mundo.cercano, estado) : null;
  const disponibles = estado.tripulacion.filter((m) => m.disponible);
  const cerrable = (panel !== null || dialogo !== null) && !plan && !registro;
  const tituloHoja = registro ? "ui.decision.titulo" : plan ? "ui.decision.panel" : panel === "mapa" ? "ui.mapa.titulo" : panel === "tripulacion" ? "ui.tripulacion.titulo" : "ui.base.consulta";

  function renderOpcionesCharla(extra = "") {
    if (!dialogo || plan) return null;
    const dato = curiosidadDe(dialogo.experto);
    if (opciones.length === 0 && !dato) return null;
    return (
      <div className={`fila${extra ? ` ${extra}` : ""}`} role="group" aria-label={t("ui.base.charla.opciones")} aria-busy={ocupado}>
        {opciones.map((o) => (
          <FacetButton key={`${o.entrada.con}-${o.entrada.pregunta ?? ""}`} labelKey={o.etiqueta.clave} labelVars={o.etiqueta.vars}
            disabled={ocupado} onClick={() => void hablar(o.entrada)} />
        ))}
        {/* B4: un dato de Marte de quien habla, solo en su momento real y una vez por partida. */}
        {dato && <FacetButton icon="sol" labelKey={`ui.curiosidad.${dato.id}`} disabled={ocupado} onClick={() => contarCuriosidad(dato)} />}
      </div>
    );
  }

  return (
    <section className={`base-e6${hayPanel ? " base-e6-con-panel" : ""}`} aria-label={t("ui.hud.titulo")}>
      {/* E5: el globo vive en la escena (oculta para el lector de pantalla); aquí se anuncia la misma línea. */}
      <p className="oculto-visual" role="status" aria-live="polite">
        {corto ? t("ui.base.globo.lector", { quien: t(`agentes.titulo.${corto.experto}`), texto: corto.texto }) : ""}
      </p>
      <HudBase estado={estado} ultimas={ultimas} reloj={hud.reloj} onMenu={hud.onMenu} objetivo={{ labelKey: objetivo.labelKey, vars: objetivo.vars }} tactil={tactil} panelAbierto={hayPanel} visible={visible}
        mundo={{
          onTripulacion: () => alternarPanel("tripulacion"),
          onMapa: () => alternarPanel("mapa"),
          interaccion: hayPanel ? undefined : mundo.interactivo?.tipo === "lugar" ? (uso ? { labelKey: uso.labelKey, onUsar: mundo.usarCercano } : undefined)
            : mundo.interactivo ? { labelKey: `ui.interaccion.${verboDe(mundo.interactivo, "base")}`, onUsar: mundo.usarCercano } : undefined,
          onInteractuar: () => {
            if (hayPanel) return;
            if (mundo.interactivo) mundo.usarCercano();
            else if (objetivo.lugar) mundo.irA(objetivo.lugar);
            else alternarPanel("tripulacion");
          },
          camara: mundo.camara,
          onCamara: mundo.alternarCamara,
        }} />

      {tactil && !hayPanel && (
        <ControlesTactiles entrada={mundo.entrada} camara={mundo.camara} onCamara={mundo.alternarCamara}
          accion={uso && mundo.cercano ? { labelKey: uso.labelKey, cortoKey: `${uso.labelKey}.corto`, icono: uso.icono, onUsar: mundo.usarCercano } : undefined} />
      )}

      {esFranjaAbajo && dialogo && (
        <div className="dialogo-franja-abajo">
          <DialogoExperto d={dialogo} irisDanada={averiaIrisRevelada(estado)} soloTexto={false} onPlan={abrirPlan}
            onCerrar={() => { soltarCharla(); setDialogo(null); devolverFoco(); }}
            onOtra={() => alternarPanel("tripulacion")} />
          {renderOpcionesCharla("dialogo-franja-opciones")}
        </div>
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
                <div className="base-polvo"><Polvo estado={estado} onAccion={onAccion} onElegir={(a) => { onAccion(a); onReanudar(); }} /></div>
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
                <DialogoExperto d={dialogo} irisDanada={averiaIrisRevelada(estado)} soloTexto={plan !== null} onPlan={abrirPlan}
                  onCerrar={() => { soltarCharla(); setDialogo(null); if (!panel) devolverFoco(); }}
                  onOtra={() => alternarPanel("tripulacion")} />
              )}
              {/* #377 y B4: botones para seguir hablando y curiosidad real; funcionan sin modelo y nunca aplican una acción. */}
              {renderOpcionesCharla()}
              {plan ? (
                <ConfirmarAccion estado={estado} accion={plan} onCancelar={cerrarPlan} onConfirmar={confirmar} />
              ) : panel === "mapa" ? (
                <MapaDeLaBase modulos={modulos} destino={mundo.destino ?? objetivo.lugar} onIrA={(l) => { mundo.irA(l); cerrarTodo(); }} />
              ) : panel === "tripulacion" ? (
                <>
                  <section className="fc"><div className="fc-cara base-bloque">
                    <h2>{t("ui.acciones.titulo")}</h2>
                    <p className="base-iris"><Icono nombre={estadoIrisVisible(estado) === "danada" ? "aviso" : "planeta"} tam={20} />{t(`ui.iris.estado.${estadoIrisVisible(estado)}`)}</p>
                    <p className="base-ayuda">{t("ui.base.acciones.ayuda")}</p>
                    <ul className="base-acciones">
                      {opcionesDe(estado).map((o) => (
                        <li key={o.labelKey} data-accion={o.labelKey}><FacetButton icon={o.icono} labelKey={o.labelKey} onClick={() => abrirPlan(o.accion)} /></li>
                      ))}
                    </ul>
                    {tele && <Mensaje tipo="pendiente" tituloKey="ui.paso.7.llegando" detalleKey="datos.comunicaciones.retraso" vars={{ ticks: tele.ticksRestantes }} />}
                    {tele && (
                      <details className="base-fuente-retraso">
                        <summary>{t("ui.fuente.titulo")}</summary>
                        <p>{t("datos.comunicaciones.derivado")}</p>
                        <TarjetaFuente fuente={FUENTE_RETRASO} titulo={false} />
                      </details>
                    )}
                  </div></section>

                  <section className="fc"><div className="fc-cara base-bloque">
                    <h2>{t("ui.tripulacion.titulo")}</h2>
                    <p className="base-ayuda">{t("ui.base.tripulacion.guia")}</p>
                    <ul className="base-expertos">
                      {disponibles.map((m) => (
                        <li key={m.id}>
                          <ExpertPortrait persona={m.id as Persona} seleccionado={preguntada === m.id} onElegir={() => { preguntar(m.id); hoja.current?.scrollTo?.({ top: 0 }); }} />
                        </li>
                      ))}
                    </ul>
                    <form className="base-preguntar" onSubmit={enviarTexto} aria-busy={ocupado}>
                      <label className="oculto-visual" htmlFor="base-campo">{t("ui.base.tripulacion.campo")}</label>
                      <input id="base-campo" type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t("ui.base.tripulacion.campo")} />
                      <FacetButton type="submit" labelKey="ui.tripulacion.enviar" busy={ocupado} onClick={() => undefined} />
                    </form>
                    <div className="base-chips" role="group" aria-label={t("ui.base.consulta")}>
                      {(
                        [
                          { con: "ingeniera", labelKey: "ui.base.tripulacion.chip.energia", queryKey: "ui.base.tripulacion.chip.energia_q" },
                          { con: "doctora", labelKey: "ui.base.tripulacion.chip.salud", queryKey: "ui.base.tripulacion.chip.salud_q" },
                          { con: "meteorologa", labelKey: "ui.base.tripulacion.chip.tormenta", queryKey: "ui.base.tripulacion.chip.tormenta_q" },
                        ] as const
                      ).map((q) => (
                        <FacetButton key={q.labelKey} labelKey={q.labelKey} disabled={ocupado}
                          onClick={() => { setPreguntada(q.con); void hablar({ via: "texto", con: q.con, texto: t(q.queryKey) }); hoja.current?.scrollTo?.({ top: 0 }); }} />
                      ))}
                    </div>
                  </div></section>

                  <details className="fc base-registro"><summary className="fc-cara fc-chico"><span>{t("ui.paso.8.titulo")}</span></summary>
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
