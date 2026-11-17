import { useEffect, useMemo, useRef, useState } from "react";
import type { EntradaTactil } from "../escena/entradaTactil.js";
import { useT } from "../i18n.js";
import { AdaptadorTactil, MITAD_BASE_JOYSTICK } from "./adaptadorTactil.js";
import { Icono, type NombreIcono } from "./base/Iconos.js";
import "./controlesTactiles.css";

/**
 * Controles táctiles de ESCENAS §3.5 (adaptador DOM). La escena entrega su `EntradaTactil` y esta
 * capa le pasa los punteros: mitad izquierda mueve (joystick flotante de 112 px con perilla de 48 px),
 * mitad derecha mira. La perilla se mueve con `transform: translate3d` desde un bucle de dibujo que
 * lee `entrada.estado`: nada de estado de React por fotograma. A la derecha, el botón de acción
 * (72 px, solo con un lugar cerca; equivale a E) y el de cámara (48 px; equivale a V). Los botones
 * capturan su propio toque, así no giran la cámara. Sin `entrada` (la escena todavía no la entregó
 * o no hay WebGL) los botones funcionan igual y el joystick queda como pista quieta.
 */
/**
 * ¿Se muestran los controles táctiles? Al empezar, si el puntero es grueso (`pointer: coarse`);
 * después, se encienden con el primer toque y se apagan al usar el teclado fuera de un campo.
 */
export function useModoTactil(): boolean {
  const [tactil, setTactil] = useState(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
  useEffect(() => {
    const toque = (e: PointerEvent) => { if (e.pointerType === "touch") setTactil(true); };
    const tecla = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null;
      if (d && (d.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(d.tagName))) return;
      if (e.key.length === 1 || e.key.startsWith("Arrow") || e.key === "Tab") setTactil(false);
    };
    window.addEventListener("pointerdown", toque, true);
    window.addEventListener("keydown", tecla, true);
    return () => { window.removeEventListener("pointerdown", toque, true); window.removeEventListener("keydown", tecla, true); };
  }, []);
  return tactil;
}

export interface ControlesTactilesProps {
  entrada: EntradaTactil | null;
  /** Acción del lugar cercano: verbo corto visible y nombre completo para el lector. */
  accion?: { labelKey: string; cortoKey: string; icono: NombreIcono; onUsar(): void } | undefined;
  camara: "tercera" | "primera";
  onCamara(): void;
}

/** E9: lo que hace el botón de salto al tocarlo. Pide el salto a la escena (A5); nunca cobra. */
export const alSaltar = (entrada: EntradaTactil) => (): void => { entrada.saltar(); };

export function ControlesTactiles({ entrada, accion, camara, onCamara }: ControlesTactilesProps) {
  const { t } = useT();
  const capa = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const perilla = useRef<HTMLDivElement>(null);
  const adaptador = useMemo(() => (entrada ? new AdaptadorTactil(entrada) : null), [entrada]);

  // Al desmontar (panel abierto, teclado, fin de fase) se sueltan los dedos: el niño se detiene.
  useEffect(() => () => adaptador?.soltarTodo(), [adaptador]);

  // Bucle de dibujo del joystick: solo lee el vector de la escena y escribe estilos.
  useEffect(() => {
    if (!entrada) return;
    let id = 0;
    const dibujar = () => {
      const e = entrada.estado, b = base.current, p = perilla.current;
      if (b && p) {
        b.dataset.activo = String(e.joystickActivo);
        if (e.joystickActivo) b.style.transform = `translate3d(${e.origenX - MITAD_BASE_JOYSTICK}px, ${e.origenY - MITAD_BASE_JOYSTICK}px, 0)`;
        p.style.transform = `translate3d(${e.perillaX}px, ${e.perillaY}px, 0)`;
      }
      id = requestAnimationFrame(dibujar);
    };
    id = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(id);
  }, [entrada]);

  const caja = () => capa.current!.getBoundingClientRect();
  return (
    <div className="ct" ref={capa}
      onPointerDown={(e) => {
        // Solo los toques sobre la capa misma; los botones de encima son suyos.
        if (!adaptador || e.target !== e.currentTarget) return;
        if (adaptador.abajo(e, caja())) e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => adaptador?.mover(e)}
      onPointerUp={(e) => adaptador?.arriba(e)}
      onPointerCancel={(e) => adaptador?.cancelado(e)}
      onContextMenu={(e) => e.preventDefault()}>
      {/* Pista tenue abajo a la izquierda; el joystick real aparece donde apoya el pulgar. */}
      <div className="ct-pista" aria-hidden="true"><span className="ct-perilla ct-perilla-pista" /></div>
      <div className="ct-joystick" ref={base} data-activo="false" aria-hidden="true"><span className="ct-perilla" ref={perilla} /></div>

      <div className="ct-botones">
        {/* E9: salto con la gravedad de Marte (A5). Solo mueve al niño, nunca cobra; en el aire o con algo
            abierto la escena no salta. Primero, como en el muestrario de F4. */}
        {entrada && (
          <button type="button" className="ct-salto" aria-keyshortcuts="Space" aria-label={t("ui.comun.saltar")} onClick={alSaltar(entrada)}>
            <span className="ct-cara"><Icono nombre="salto" tam={32} /></span>
          </button>
        )}
        <button type="button" className="ct-camara" aria-keyshortcuts="V" onClick={onCamara}
          aria-label={t(camara === "tercera" ? "ui.comun.hud.primera" : "ui.comun.hud.tercera")}>
          <span className="ct-cara"><span className="ct-tecla" aria-hidden="true">V</span><span aria-hidden="true">{t("ui.hud.camara.corto")}</span></span>
        </button>
        {accion && (
          <button type="button" className="ct-accion" aria-keyshortcuts="E" aria-label={t(accion.labelKey)} onClick={accion.onUsar}>
            <span className="ct-cara"><Icono nombre={accion.icono} tam={28} /><span aria-hidden="true">{t(accion.cortoKey)}</span></span>
          </button>
        )}
      </div>
    </div>
  );
}
