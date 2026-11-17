import { useEffect, useRef } from "react";
import { useT, type Idioma } from "../i18n.js";
import type { CalidadGrafica, CamaraJugador } from "../juego/ajustes.js";
import { FacetButton } from "./base/FacetButton.js";
import "./base/facetas.css";
import "./menu.css";

export const CAMARAS: readonly CamaraJugador[] = ["tercera", "primera"];
export const CALIDADES: readonly CalidadGrafica[] = ["alta", "media", "baja"];
export const IDIOMAS: readonly Idioma[] = ["en", "es"];

export interface MenuProps {
  camara: CamaraJugador;
  onCamara(c: CamaraJugador): void;
  calidad: CalidadGrafica;
  onCalidad(c: CalidadGrafica): void;
  sonido: boolean;
  onSonido(): void;
  idioma: Idioma;
  onIdioma(i: Idioma): void;
  onCerrar(): void;
}

/**
 * E4: el menú (PLAN-JUGABILIDAD §4, #7). Cámara de primera o tercera persona, calidad gráfica, sonido e
 * idioma; todo se guarda en los ajustes del navegador (`juego/ajustes.ts`). Cambiar algo nunca toca la
 * partida: no cobra, no avanza el reloj y conserva la pausa (MECANICAS §6, invariante 4). `V` y el botón
 * del HUD siguen cambiando la cámara: es el mismo ajuste.
 *
 * `<dialog>` nativo abierto con showModal() (Modern Web Guidance, "dialog"): el navegador da la capa
 * superior, el fondo inerte, el foco dentro, Esc y el gesto de atrás, y devuelve el foco a quien lo abrió.
 * Tocar afuera también cierra (`closedby="any"`, con respaldo para Safari).
 */
export function Menu({ camara, onCamara, calidad, onCalidad, sonido, onSonido, idioma, onIdioma, onCerrar }: MenuProps) {
  const { t } = useT();
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (!d.open && typeof d.showModal === "function") d.showModal();
    const alCerrar = () => cerrar.current();
    d.addEventListener("close", alCerrar);
    // Respaldo de closedby="any" donde no existe: cerrar solo si se apretó y se soltó fuera de la caja.
    let afuera = false;
    const fuera = (e: PointerEvent) => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
    const baja = (e: PointerEvent) => { afuera = fuera(e); };
    const sube = (e: PointerEvent) => { if (afuera && fuera(e)) d.close(); };
    const sinClosedBy = !("closedBy" in HTMLDialogElement.prototype);
    if (sinClosedBy) { d.addEventListener("pointerdown", baja); d.addEventListener("pointerup", sube); }
    return () => {
      d.removeEventListener("close", alCerrar);
      if (sinClosedBy) { d.removeEventListener("pointerdown", baja); d.removeEventListener("pointerup", sube); }
      // Sin d.close() aquí: el evento "close" llega después y cerraría el menú recién abierto (React monta
      // dos veces en desarrollo). Al desmontar, el <dialog> sale del documento y el navegador lo cierra.
    };
  }, []);
  const grupo = (id: string, titulo: string, hijos: React.ReactNode) => (
    <section className="menu-fila" aria-labelledby={id}>
      <h3 id={id} className="menu-etiqueta">{titulo}</h3>
      <div className="menu-opciones" role="group" aria-labelledby={id}>{hijos}</div>
    </section>
  );
  return (
    <dialog ref={dialogo} className="menu-ajustes" aria-labelledby="menu-titulo" {...({ closedby: "any" } as object)}>
      <div className="fc menu-caja"><div className="fc-cara menu-cara">
        <header className="menu-cab">
          <h2 id="menu-titulo">{t("ui.menu.titulo")}</h2>
          <FacetButton labelKey="ui.comun.cerrar" icon="atras" onClick={() => dialogo.current?.close()} />
        </header>
        {grupo("menu-camara", t("ui.menu.camara"), CAMARAS.map((c) => (
          <FacetButton key={c} labelKey={`ui.comun.hud.${c}`} selected={camara === c || undefined} onClick={() => onCamara(c)} />
        )))}
        {grupo("menu-calidad", t("ui.menu.calidad"), CALIDADES.map((c) => (
          <FacetButton key={c} labelKey={`ui.menu.calidad.${c}`} selected={calidad === c || undefined} onClick={() => onCalidad(c)} />
        )))}
        {grupo("menu-sonido", t("ui.menu.sonido"), (
          <FacetButton labelKey={sonido ? "ui.portada.sonido_on" : "ui.portada.sonido_off"} icon={sonido ? "sonido_on" : "sonido_off"} onClick={onSonido} />
        ))}
        {grupo("menu-idioma", t("ui.portada.idioma"), IDIOMAS.map((i) => (
          <FacetButton key={i} labelKey={`ui.menu.idioma.${i}`} selected={idioma === i || undefined} onClick={() => onIdioma(i)} />
        )))}
      </div></div>
    </dialog>
  );
}
