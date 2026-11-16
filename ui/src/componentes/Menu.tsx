import { useEffect, useRef } from "react";
import { useT, type Idioma } from "../i18n.js";
import type { CalidadGrafica, CamaraJugador } from "../juego/ajustes.js";
import { FacetButton } from "./base/FacetButton.js";
import "./base/facetas.css";
import "./base/datos.css";

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
 * del HUD siguen cambiando la cámara: es el mismo ajuste. Diálogo modal con la forma de "Sources &
 * credits": foco en "Close" al abrir, Esc o tocar afuera cierra, y el foco vuelve adonde estaba.
 */
export function Menu({ camara, onCamara, calidad, onCalidad, sonido, onSonido, idioma, onIdioma, onCerrar }: MenuProps) {
  const { t } = useT();
  const caja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    caja.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); cerrar.current(); } };
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      if (previo?.isConnected) previo.focus();
    };
  }, []);
  const grupo = (id: string, titulo: string, hijos: React.ReactNode) => (
    <section aria-labelledby={id}>
      <h3 id={id}>{titulo}</h3>
      <div className="fila" role="group" aria-labelledby={id}>{hijos}</div>
    </section>
  );
  return (
    <div className="creditos-fondo" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div ref={caja} className="creditos" role="dialog" aria-modal="true" aria-labelledby="menu-titulo">
        <div className="creditos-cerrar"><FacetButton labelKey="ui.comun.cerrar" onClick={onCerrar} /></div>
        <div className="fc"><div className="fc-cara">
        <h2 id="menu-titulo">{t("ui.menu.titulo")}</h2>
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
      </div>
    </div>
  );
}
