import { useEffect, useRef } from "react";
import type { LugarId } from "../escena/mundo.js";
import type { EntradaTactil } from "../escena/entradaTactil.js";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import "./ControlesTactiles.css";

export interface ControlesTactilesProps {
  /** Instancia estable: el bucle de Daniel lee su estado sin renders de React por frame. */
  entrada: EntradaTactil;
  activa: boolean;
  /** false: no dibuja botones (José usa las teclas E/V del HUD); los gestos siguen activos. */
  mostrarBotones?: boolean;
  lugarCercano: LugarId | null;
  camara: "primera" | "tercera";
  ocupado?: boolean;
  bloqueada?: boolean;
  motivoBloqueoKey?: string;
  onUsar(lugar: LugarId): void;
  onCamara(): void;
  onPausar(): void;
  onActivarAudio?(): void;
}

/** Montar sobre la escena dentro de un contenedor posicionado; HUD y paneles quedan encima. */
export function ControlesTactiles(props: ControlesTactilesProps) {
  const { t } = useT();
  const raiz = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const perilla = useRef<HTMLDivElement>(null);
  const actuales = useRef(props); actuales.current = props;
  const parar = useRef(() => {});
  const audioActivado = useRef(false);
  const { entrada, activa, mostrarBotones = true } = props;

  useEffect(() => {
    const capa = raiz.current!, joystick = base.current!, boton = perilla.current!;
    const superficie = capa.parentElement!;
    const doc = superficie.ownerDocument, ventana = doc.defaultView!;
    const grueso = ventana.matchMedia("(pointer: coarse)");
    const capturados = new Set<number>();
    const dibujar = () => {
      const s = entrada.estado, r = capa.getBoundingClientRect();
      capa.dataset.joystick = String(s.joystickActivo);
      joystick.dataset.activo = String(s.joystickActivo);
      if (s.joystickActivo) { joystick.style.left = `${s.origenX - r.left}px`; joystick.style.top = `${s.origenY - r.top}px`; }
      boton.style.transform = `translate3d(${s.perillaX}px,${s.perillaY}px,0)`;
    };
    const cancelar = () => {
      entrada.cancelar();
      for (const id of capturados) { capturados.delete(id); if (superficie.hasPointerCapture(id)) superficie.releasePointerCapture(id); }
      dibujar();
    };
    parar.current = cancelar;
    capa.dataset.visible = String(activa && grueso.matches);
    if (!activa) { cancelar(); return; }
    // La superficie (canvas) no hace scroll ni pinch-zoom mientras los gestos están activos.
    // Se guarda el valor inline para restaurarlo exactamente al desactivar o desmontar.
    const touchActionPrevio = superficie.style.touchAction;
    superficie.style.touchAction = "none";
    const inicio = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || doc.hidden) return;
      capa.dataset.visible = "true";
      if (!audioActivado.current) { audioActivado.current = true; actuales.current.onActivarAudio?.(); }
      if ((e.target as Element).closest("button,a,input,textarea,select,[role=dialog],[role=button],[contenteditable]")) return;
      const r = superficie.getBoundingClientRect();
      if (entrada.iniciar(e.pointerId, e.clientX, e.clientY, e.clientX - r.left < r.width / 2 ? "mover" : "mirar", e.timeStamp)) {
        capturados.add(e.pointerId); superficie.setPointerCapture(e.pointerId); e.preventDefault(); dibujar();
      }
    };
    const mover = (e: PointerEvent) => {
      if (!capturados.has(e.pointerId)) return;
      entrada.mover(e.pointerId, e.clientX, e.clientY); e.preventDefault(); dibujar();
    };
    const terminar = (e: PointerEvent) => {
      if (!capturados.delete(e.pointerId)) return;
      entrada.terminar(e.pointerId, e.timeStamp, e.type !== "pointerup");
      if (superficie.hasPointerCapture(e.pointerId)) superficie.releasePointerCapture(e.pointerId);
      dibujar();
    };
    const teclado = () => { cancelar(); capa.dataset.visible = "false"; };
    const visibilidad = () => { if (doc.hidden) { cancelar(); actuales.current.onPausar(); } };
    const puntero = () => { cancelar(); capa.dataset.visible = String(grueso.matches); };
    superficie.addEventListener("pointerdown", inicio);
    superficie.addEventListener("pointermove", mover);
    for (const nombre of ["pointerup", "pointercancel", "lostpointercapture"]) superficie.addEventListener(nombre, terminar as EventListener);
    ventana.addEventListener("keydown", teclado);
    ventana.addEventListener("blur", cancelar);
    doc.addEventListener("visibilitychange", visibilidad);
    grueso.addEventListener("change", puntero);
    return () => {
      superficie.removeEventListener("pointerdown", inicio); superficie.removeEventListener("pointermove", mover);
      for (const nombre of ["pointerup", "pointercancel", "lostpointercapture"]) superficie.removeEventListener(nombre, terminar as EventListener);
      ventana.removeEventListener("keydown", teclado); ventana.removeEventListener("blur", cancelar);
      doc.removeEventListener("visibilitychange", visibilidad); grueso.removeEventListener("change", puntero);
      cancelar();
      superficie.style.touchAction = touchActionPrevio;
      parar.current = () => {};
    };
  }, [entrada, activa]);

  return <div ref={raiz} className="controles-tactiles" data-visible="false" aria-label={t("ui.mapa.controles.titulo")} onContextMenu={e => e.preventDefault()}>
    <div className="controles-tactiles__pista" aria-hidden="true"><div /></div>
    <div ref={base} className="controles-tactiles__joystick" data-activo="false" aria-hidden="true"><div ref={perilla} /></div>
    {mostrarBotones && <div className="controles-tactiles__botones">
      {props.lugarCercano && <FacetButton className="controles-tactiles__accion" icon="mapa" labelKey="ui.mapa.controles.usar"
        busy={props.ocupado ?? false} disabled={props.bloqueada ?? false} disabledReasonKey={props.motivoBloqueoKey ?? "ui.mapa.controles.bloqueada"}
        onClick={() => { parar.current(); if (actuales.current.lugarCercano) actuales.current.onUsar(actuales.current.lugarCercano); }} />}
      <FacetButton className="controles-tactiles__camara" labelKey={`ui.mapa.controles.${props.camara === "tercera" ? "primera" : "tercera"}`}
        extra={<span aria-hidden="true">V</span>} onClick={() => { parar.current(); actuales.current.onCamara(); }} />
    </div>}
  </div>;
}
