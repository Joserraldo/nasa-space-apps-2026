import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { conversar, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Action, BaseAction, Equipment, GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import { telemetriaPendiente, tormentaActiva, type Novedades } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { describirAccion } from "../componentes/Dialogos.js";
import { DialogoExperto } from "../componentes/DialogoExperto.js";
import { Polvo } from "../componentes/Polvo.js";
import { ConfirmarAccion } from "../componentes/base/ConfirmarAccion.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono, type NombreIcono } from "../componentes/base/Iconos.js";
import { Mensaje } from "../componentes/base/Piezas.js";
import type { Persona } from "../componentes/base/Retrato.js";
import "../componentes/base/facetas.css";
import type { CalidadGrafica } from "../juego/ajustes.js";
import { eventosDeTick } from "../juego/eventos.js";
import { vistaEscena, type LugarObjetivo } from "../escena/vista.js";
import "./base.css";

// Three.js queda en un chunk aparte: no pesa en la primera carga.
const EscenaBase = lazy(() => import("../escena/EscenaBase.js").then((m) => ({ default: m.EscenaBase })));
const HuecoEscena = () => <div className="base-escena" data-escena="base" aria-hidden="true" />;

/**
 * E6, fase `base` (ESCENAS §1 y §2.7 fila "E5 a E7"; MECANICAS §4). Escrita desde `ui/01`
 * (diálogo en franja inferior + panel de decisión a la derecha), `ui/04` y `personajes/07`
 * (elegir a quién preguntar, comparar un plan, verificar la fuente). Toda acción pasa por el
 * único `ConfirmarAccion` (APLICACION §5): costos de `costoDe` y permiso de `puedeAplicar` del
 * motor con `MISION_JEZERO`. Abrir o cerrar una consulta no toca la pausa; el foco vuelve al origen.
 * Reemplaza la fase base que vivía en `App.tsx` y a `Tripulacion.tsx` (FLUJO §2.3).
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

export function PantallaBase({ estado, colocados = [], ultimas, onAccion, onReanudar }: {
  estado: GameState;
  colocados?: readonly Equipment[];
  ultimas: Novedades | null;
  onAccion(a: Action): void;
  onReanudar(): void;
}) {
  const { t } = useT();
  const [plan, setPlan] = useState<BaseAction | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [preguntada, setPreguntada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fallasIris, setFallasIris] = useState(0);
  const origen = useRef<HTMLElement | null>(null);
  const tripulacion = useRef<HTMLElement>(null);
  const tele = telemetriaPendiente(estado);
  const [calidad, setCalidad] = useState<CalidadGrafica>("media");
  const [sin3d, setSin3d] = useState(false);
  const reducido = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vista = useMemo(() => vistaEscena(estado, { fase: tormentaActiva(estado) ? "tormenta" : "base", colocados, averiaRevelada: true }), [estado, colocados]);
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
  /** "Usar" en un lugar de la escena: solo donde ya hay una acción de la pantalla. */
  function usarLugar(lugar: LugarObjetivo) {
    if (lugar === "panel_solar") abrirPlan({ tipo: "salida_exterior", objetivo: "panel_solar" });
    else if (lugar === "escudo") abrirPlan({ tipo: "subir_escudo", nivel: 1 });
    // TODO(José): el resto de lugares (taller, banco, antena…) no tienen acción en la pantalla todavía.
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

  // `Escape` cierra el diálogo si no hay un panel de confirmación encima (ese se cierra solo).
  useEffect(() => {
    if (!dialogo || plan) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setDialogo(null); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [dialogo, plan]);

  const disponibles = estado.tripulacion.filter((m) => m.disponible);
  const hayNovedad = estado.pausado && ultimas && (ultimas.malaSuerte.length > 0 || ultimas.iaCambio || ultimas.efectosLlegaron.length > 0);

  return (
    <section className="base-e6" aria-label={t("ui.hud.titulo")}>
      <div className="base-mundo">
        {/* Escena 3D de Daniel (escena/, ESCENAS §3). Decorativa: lo accesible son los botones de la pantalla.
            Si WebGL se pierde, vuelve el hueco 2D. */}
        <div className="base-escena-caja" aria-hidden="true">
          {sin3d ? <HuecoEscena /> : (
            <Suspense fallback={<HuecoEscena />}>
              <EscenaBase vista={vista} eventos={eventos} calidad={calidad} camara="tercera" movimientoReducido={reducido}
                onLugarCercano={() => undefined /* TODO(José): resaltar el botón del lugar cercano. */}
                onUsar={usarLugar}
                onCalidad={setCalidad}
                onWebGLPerdido={() => setSin3d(true)} />
            </Suspense>
          )}
        </div>

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
          <DialogoExperto d={dialogo} irisDanada={estado.iaBase === "danada"} onPlan={abrirPlan}
            onCerrar={() => setDialogo(null)}
            onOtra={() => { setDialogo(null); tripulacion.current?.querySelector<HTMLElement>("button")?.focus(); }} />
        )}
      </div>

      <aside className="base-panel" aria-label={t("ui.acciones.titulo")}>
        {plan ? (
          <ConfirmarAccion estado={estado} accion={plan} onCancelar={cerrarPlan} onConfirmar={confirmar} />
        ) : (
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
        )}

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
      </aside>
    </section>
  );
}
