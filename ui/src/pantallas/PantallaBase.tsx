import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { conversar, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Action, BaseAction, Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { telemetriaPendiente, tormentaActiva, type Novedades } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { DialogoExperto } from "../componentes/DialogoExperto.js";
import { Mapa } from "../componentes/Mapa.js";
import { Polvo } from "../componentes/Polvo.js";
import { ConfirmarAccion } from "../componentes/base/ConfirmarAccion.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono, type NombreIcono } from "../componentes/base/Iconos.js";
import { Mensaje } from "../componentes/base/Piezas.js";
import type { Persona } from "../componentes/base/Retrato.js";
import "../componentes/base/facetas.css";
import { cargarAjustes, guardarAjustes, type CalidadGrafica } from "../juego/ajustes.js";
import { eventosDeTick } from "../juego/eventos.js";
import { INICIO_JUGADOR, lugar, type LugarId } from "../escena/mundo.js";
import { vistaEscena, type LugarObjetivo } from "../escena/vista.js";
import type { CamaraEscena } from "../escena/EscenaBase.js";
import { usoDelLugar } from "./objetivo.js";
import "./base.css";

// Three.js queda en un chunk aparte: no pesa en la primera carga.
const EscenaBase = lazy(() => import("../escena/EscenaBase.js").then((m) => ({ default: m.EscenaBase })));
const HuecoEscena = () => <div className="base-escena" data-escena="base" aria-hidden="true" />;

/**
 * E6, fase `base` (ESCENAS §1, §2.7 fila "E5 a E7" y §3.1–§3.5; MECANICAS §4). HUD de `mundo/01`
 * sobre la escena 3D a pantalla completa: placas y objetivo arriba a la derecha (los pone `HudBase`
 * desde App), `Crew` y `Map` abajo a la izquierda, la acción `[E]` al centro abajo cuando hay un lugar
 * cerca, y la cámara `[V]` abajo a la derecha. El panel de decisión de `ui/01` (acciones, tripulación
 * y registro) es lateral a la derecha y se cierra; el diálogo de la experta va en la franja inferior.
 * Toda acción pasa por el único `ConfirmarAccion` (APLICACION §5) con `costoDe`/`puedeAplicar` y
 * `MISION_JEZERO`. Sin WebGL, la misma capa funciona sobre el hueco 2D y el mapa lleva a cada lugar.
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

/** Almacén de ajustes del navegador; sin él (modo privado, pruebas) los ajustes duran la partida. */
function almacen(): Storage | undefined {
  try { return typeof localStorage === "undefined" ? undefined : localStorage; } catch { return undefined; }
}

/** Sin WebGL no se intenta montar la escena: se juega sobre el hueco 2D. */
function hayWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch { return false; }
}

const enCampo = (e: KeyboardEvent) => {
  const d = e.target as HTMLElement | null;
  return !!d && (d.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(d.tagName));
};

type Panel = "acciones" | "mapa" | null;

export function PantallaBase({ estado, colocados = [], ultimas, lugarObjetivo = null, onAccion, onReanudar }: {
  estado: GameState;
  colocados?: readonly Equipment[];
  ultimas: Novedades | null;
  /** Adónde guía Iris ahora (`guiaBase`): resaltado en la escena y en el mapa. */
  lugarObjetivo?: LugarObjetivo | null;
  onAccion(a: Action): void;
  onReanudar(): void;
}) {
  const { t } = useT();
  const [plan, setPlan] = useState<BaseAction | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [preguntada, setPreguntada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  // El panel de decisión arranca abierto (Iris recibe al niño con las acciones); luego se abre al pedirlo.
  const [panel, setPanel] = useState<Panel>("acciones");
  const [cercano, setCercano] = useState<LugarObjetivo | null>(null);
  const [posicion, setPosicion] = useState<{ x: number; z: number }>(INICIO_JUGADOR);
  const [camara, setCamara] = useState<CamaraEscena>("tercera");
  const origen = useRef<HTMLElement | null>(null);
  const tripulacion = useRef<HTMLElement>(null);
  const botonMapa = useRef<HTMLSpanElement>(null);
  const tele = telemetriaPendiente(estado);

  // Ajustes del jugador (FLUJO §3): la calidad que propone la escena se guarda para la próxima vez.
  const [ajustes, setAjustes] = useState(() => cargarAjustes(almacen(), {
    prefiereMovimientoReducido: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  function cambiarCalidad(calidad: CalidadGrafica) {
    setAjustes((a) => {
      const sig = { ...a, calidad };
      guardarAjustes(almacen(), sig);
      return sig;
    });
  }
  const [sin3d, setSin3d] = useState(() => !hayWebGL());
  const vista = useMemo(() => vistaEscena(estado, { fase: tormentaActiva(estado) ? "tormenta" : "base", colocados, averiaRevelada: true, lugarObjetivo }), [estado, colocados, lugarObjetivo]);
  // Eventos del último tick: se comparan el estado anterior y el actual.
  const previo = useRef(estado);
  const eventos = useMemo(() => {
    const ev = previo.current.tick === estado.tick ? [] : eventosDeTick(previo.current, estado);
    previo.current = estado;
    return ev;
  }, [estado]);

  /** Abre el panel de confirmación y recuerda quién lo abrió para devolverle el foco. */
  function abrirPlan(a: BaseAction) {
    origen.current = document.activeElement as HTMLElement | null;
    setPanel("acciones");
    setPlan(a);
  }
  function cerrarPlan() {
    setPlan(null);
    const o = origen.current;
    // La lista de acciones se desmonta mientras está el panel: se busca de nuevo el mismo botón por su acción.
    const clave = o?.closest("li")?.dataset.accion;
    requestAnimationFrame(() => {
      const destino = o?.isConnected ? o
        : (clave && document.querySelector<HTMLElement>(`.base-acciones li[data-accion="${clave}"] button`))
          || tripulacion.current?.querySelector<HTMLElement>("button");
      destino?.focus();
    });
  }
  function confirmar(a: BaseAction) {
    onAccion(a);
    if (dialogo?.accion === a) setDialogo(null);
    cerrarPlan();
  }

  function hablar(entrada: Entrada) {
    const d = conversar(entrada, estado, { tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris: fallasIris });
    if ("falla" in d) setFallasIris((n) => n + 1);
    setDialogo(d);
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

  /** "Usar" un lugar (tecla E, botón de acción o la escena): plan, experta, Iris o el panel de acciones. */
  function usarLugar(l: LugarObjetivo) {
    const uso = usoDelLugar(l, estado);
    if (uso.tipo === "plan") abrirPlan(uso.accion);
    else if (uso.tipo === "experto") preguntar(uso.experto);
    else if (uso.tipo === "iris") hablar({ experto: "ia_base" });
    else setPanel("acciones");
  }
  /** Crew: abre el panel y lleva el foco a la tripulación. */
  function abrirTripulacion() {
    setPanel("acciones");
    requestAnimationFrame(() => {
      tripulacion.current?.scrollIntoView?.({ block: "nearest" });
      tripulacion.current?.querySelector<HTMLElement>("button")?.focus();
    });
  }
  /** Map: ir a un lugar. Sin WebGL el niño "llega" ahí; con la escena, la caminata la pone la navegación de Camilo. */
  function irA(id: LugarId) {
    const l = lugar(id);
    setPosicion({ x: l.x, z: l.z });
    setCercano(id);
    cerrarPanel();
  }
  function cerrarPanel() {
    const eraMapa = panel === "mapa";
    setPanel(null);
    if (eraMapa) requestAnimationFrame(() => botonMapa.current?.querySelector("button")?.focus());
  }

  // Teclado (ESCENAS §3.5): V cambia la cámara, E usa el lugar cercano (sin WebGL; con escena lo emite
  // EscenaBase), Esc cierra lo de más arriba: diálogo, luego el panel. El panel de confirmación cierra solo.
  const actual = useRef({ plan, dialogo, panel, cercano, sin3d, usarLugar, cerrarPanel });
  actual.current = { plan, dialogo, panel, cercano, sin3d, usarLugar, cerrarPanel };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const a = actual.current;
      if (e.key === "Escape") {
        if (a.plan) return;
        if (a.dialogo) setDialogo(null);
        else if (a.panel) a.cerrarPanel();
        return;
      }
      if (e.repeat || enCampo(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.key === "v" || e.key === "V") && !a.sin3d) setCamara((c) => (c === "tercera" ? "primera" : "tercera"));
      else if ((e.key === "e" || e.key === "E") && a.sin3d && a.cercano && !a.plan) a.usarLugar(a.cercano);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const disponibles = estado.tripulacion.filter((m) => m.disponible);
  const hayNovedad = estado.pausado && ultimas && (ultimas.malaSuerte.length > 0 || ultimas.iaCambio || ultimas.efectosLlegaron.length > 0);
  const uso = cercano ? usoDelLugar(cercano, estado) : null;
  const abierto = panel !== null || plan !== null;

  return (
    <section className={`base-e6${abierto ? " base-e6-con-panel" : ""}`} aria-label={t("ui.hud.titulo")} data-escena-modo={sin3d ? "2d" : "3d"}>
      {/* Escena 3D de Daniel (escena/, ESCENAS §3) a pantalla completa. Decorativa: lo accesible son los
          botones de la capa. Si WebGL se pierde (o no hay), vuelve el hueco 2D y todo sigue igual. */}
      <div className="base-escena-caja" aria-hidden="true">
        {sin3d ? <HuecoEscena /> : (
          <Suspense fallback={<HuecoEscena />}>
            <EscenaBase vista={vista} eventos={eventos} calidad={ajustes.calidad} camara={camara} movimientoReducido={ajustes.movimientoReducido}
              onLugarCercano={setCercano}
              onUsar={usarLugar}
              onCalidad={cambiarCalidad}
              onWebGLPerdido={() => setSin3d(true)} />
          </Suspense>
        )}
      </div>

      <div className="base-capa">
        {hayNovedad && ultimas && (
          <div className="base-novedades" role="status">
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
              <div className="fc"><div className="fc-cara base-polvo"><Polvo estado={estado} onAccion={onAccion} onElegir={(a) => { onAccion(a); onReanudar(); }} /></div></div>
            )}
            <FacetButton variant="primary" icon="jugar" labelKey="ui.reanudar" onClick={onReanudar} />
          </div>
        )}

        {dialogo && (
          <div className="base-dialogo">
            <DialogoExperto d={dialogo} irisDanada={estado.iaBase === "danada"} onPlan={abrirPlan}
              onCerrar={() => setDialogo(null)}
              onOtra={() => { setDialogo(null); abrirTripulacion(); }} />
          </div>
        )}

        <nav className="base-controles" aria-label={t("ui.hud.controles")}>
          <div className="base-controles-izq">
            <FacetButton icon="tripulacion" labelKey="ui.comun.tripulacion"
              onClick={() => (panel === "acciones" ? cerrarPanel() : abrirTripulacion())} />
            <span ref={botonMapa}>
              <FacetButton icon="mapa" labelKey="ui.comun.mapa"
                onClick={() => (panel === "mapa" ? cerrarPanel() : setPanel("mapa"))} />
            </span>
          </div>
          <div className="base-controles-centro">
            {uso && cercano && !plan && (
              <FacetButton variant="primary" className="base-accion-e" labelKey={uso.labelKey} labelVars={"labelVars" in uso ? uso.labelVars : undefined}
                extra={<kbd className="base-tecla" aria-hidden="true">E</kbd>} onClick={() => usarLugar(cercano)} />
            )}
          </div>
          <div className="base-controles-der">
            <FacetButton className="base-camara" labelKey={camara === "tercera" ? "ui.hud.camara.primera" : "ui.hud.camara.tercera"}
              disabled={sin3d} disabledReasonKey="ui.hud.camara.sin3d"
              extra={<kbd className="base-tecla" aria-hidden="true">V</kbd>}
              onClick={() => setCamara((c) => (c === "tercera" ? "primera" : "tercera"))} />
          </div>
        </nav>
      </div>

      {abierto && (
        <aside className="base-panel" aria-label={t(panel === "mapa" && !plan ? "ui.mapa.titulo" : "ui.acciones.titulo")}>
          <div className="base-panel-cerrar">
            <FacetButton icon="atras" labelKey="ui.comun.cerrar" onClick={() => { if (plan) cerrarPlan(); cerrarPanel(); }} />
          </div>
          {plan ? (
            <ConfirmarAccion estado={estado} accion={plan} onCancelar={cerrarPlan} onConfirmar={confirmar} />
          ) : panel === "mapa" ? (
            <Mapa posicion={posicion} objetivo={lugarObjetivo} modulos={vista.modulos} onIrA={irA} />
          ) : (
            <>
              <section className="fc"><div className="fc-cara base-bloque">
                <h2>{t("ui.acciones.titulo")}</h2>
                <p className="base-iris"><Icono nombre={estado.iaBase === "danada" ? "aviso" : "planeta"} tam={20} />{t(`ui.iris.estado.${estado.iaBase}`)}</p>
                <p className="base-ayuda">{t("ui.base.acciones.ayuda")}</p>
                <ul className="base-acciones">
                  {opcionesDe(estado).map((o) => (
                    <li key={o.labelKey} data-accion={o.labelKey}><FacetButton icon={o.icono} labelKey={o.labelKey} onClick={() => abrirPlan(o.accion)} /></li>
                  ))}
                </ul>
                {tele && <Mensaje tipo="pendiente" tituloKey="ui.paso.7.llegando" vars={{ ticks: tele.ticksRestantes }} />}
              </div></section>

              <section className="fc" ref={tripulacion}><div className="fc-cara base-bloque">
                <h2>{t("ui.tripulacion.titulo")}</h2>
                <ul className="base-expertos">
                  {disponibles.map((m) => (
                    <li key={m.id}>
                      <ExpertPortrait persona={m.id as Persona} compacto seleccionado={preguntada === m.id} onElegir={() => preguntar(m.id)} />
                    </li>
                  ))}
                </ul>
                <form className="base-preguntar" onSubmit={enviarTexto}>
                  <label className="oculto-visual" htmlFor="base-campo">{t("ui.base.tripulacion.campo")}</label>
                  <input id="base-campo" type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t("ui.base.tripulacion.campo")} />
                  <FacetButton type="submit" labelKey="ui.tripulacion.enviar" onClick={() => undefined} />
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
          )}
        </aside>
      )}
    </section>
  );
}
