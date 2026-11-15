import { useEffect, useRef, useState } from "react";
import { conversar, type Dialogo, type Entrada } from "@solar-shield/agents";
import type { Action, BaseAction, GameState } from "@solar-shield/contracts";
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
import { DecisionRegistrada } from "./DecisionRegistrada.js";
import "./base.css";

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

export function PantallaBase({ estado, ultimas, onAccion, onReanudar }: {
  estado: GameState;
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
  // Panel 04 "Decision recorded": `antes` es el estado al confirmar; `despues` se toma en el render que ya trae la acción aplicada.
  const [registro, setRegistro] = useState<{ antes: GameState; despues: GameState | null } | null>(null);
  const origen = useRef<HTMLElement | null>(null);
  const tripulacion = useRef<HTMLElement>(null);
  const panel = useRef<HTMLElement>(null);
  const tele = telemetriaPendiente(estado);

  /** Abre el panel de confirmación y recuerda quién lo abrió para devolverle el foco. */
  function abrirPlan(a: BaseAction) {
    origen.current = document.activeElement as HTMLElement | null;
    setPlan(a);
  }
  function cerrarPlan() {
    setPlan(null);
    devolverFoco();
  }
  function devolverFoco() {
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
    setRegistro({ antes: estado, despues: null });
    onAccion(a);
    if (dialogo?.accion === a) setDialogo(null);
    setPlan(null);
  }
  // El reloj de la base sigue como estaba (no se pausa ni se reanuda): solo se cierra la tarjeta.
  function continuar() {
    setRegistro(null);
    devolverFoco();
  }
  useEffect(() => {
    if (registro && !registro.despues && estado !== registro.antes) { setRegistro({ antes: registro.antes, despues: estado }); panel.current?.scrollTo({ top: 0 }); }
  }, [estado, registro]);

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
        {/* Aquí se montará <EscenaBase/> de Daniel (escena/, ESCENAS §3): el mundo abierto de Jezero.
            Este hueco es su contenedor; la UI no lo importa todavía. */}
        <div className="base-escena" data-escena="base" aria-hidden="true" />

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

      <aside className="base-panel" ref={panel} aria-label={t("ui.acciones.titulo")}>
        {registro ? (
          registro.despues && (
            <section className="fc" aria-labelledby="base-decision-titulo"><div className="fc-cara base-bloque">
              <h2 id="base-decision-titulo">{t("ui.decision.titulo")}</h2>
              <DecisionRegistrada antes={registro.antes} despues={registro.despues} onContinuar={continuar} />
            </div></section>
          )
        ) : plan ? (
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
