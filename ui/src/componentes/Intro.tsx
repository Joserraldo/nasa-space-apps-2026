import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono, type NombreIcono } from "./base/Iconos.js";
import "./base/inicio.css";

/**
 * Intro en 4 viñetas (inicio/02, HISTORIA §3, DISEÑO §6). Primera versión: tarjetas DOM con icono y
 * el texto de cada viñeta; la ilustración completa solo si sobra tiempo (FLUJO §3).
 * "Skip intro" en cualquier viñeta lleva al mismo punto que "Continue" en la última.
 * Flechas del teclado para avanzar y retroceder. No muestra decisiones tomadas.
 */
const VINETAS: readonly { iconos: NombreIcono[] }[] = [
  { iconos: ["planeta"] },
  { iconos: ["satelite"] },
  { iconos: ["tripulacion"] },
  { iconos: ["energia", "vida", "escudo"] },
];
export const TOTAL_VINETAS = VINETAS.length;

export function Intro({ onTerminar, inicial = 0 }: { onTerminar(): void; inicial?: number }) {
  const { t } = useT();
  const [i, setI] = useState(Math.max(0, Math.min(TOTAL_VINETAS - 1, inicial)));
  const titulo = useRef<HTMLHeadingElement>(null);
  const ultima = i === TOTAL_VINETAS - 1;

  // Al cambiar de viñeta el foco va al título, para que el lector la anuncie.
  useEffect(() => { titulo.current?.focus(); }, [i]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(TOTAL_VINETAS - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const n = i + 1;
  return (
    <section className="intro" aria-roledescription={t("ui.intro.descripcion")} aria-label={t("ui.intro.paso", { n, total: TOTAL_VINETAS })}>
      <div className="fc intro-vineta" key={i}>
        <div className="fc-cara intro-cara">
          <h2 ref={titulo} tabIndex={-1} className="intro-etiqueta">
            {String(n).padStart(2, "0")} / {t(`ui.intro.${n}.titulo`)}
          </h2>
          <div className="intro-iconos" aria-hidden="true">
            {VINETAS[i]!.iconos.map((ic) => <span key={ic} className="intro-icono"><Icono nombre={ic} tam={64} /></span>)}
          </div>
          <p className="intro-texto">{t(`ui.intro.${n}.texto`)}</p>
          <div className="intro-pie">
            <span className="intro-puntos" aria-hidden="true">
              {VINETAS.map((_, k) => <i key={k} className={k === i ? "actual" : k < i ? "hecho" : ""} />)}
            </span>
            {i > 0 && <FacetButton labelKey="ui.comun.atras" icon="atras" onClick={() => setI(i - 1)} />}
            {ultima
              ? <FacetButton variant="primary" labelKey="ui.intro.continuar" onClick={onTerminar} />
              : <FacetButton variant="primary" labelKey="ui.intro.siguiente" onClick={() => setI(i + 1)} />}
            {!ultima && <FacetButton labelKey="ui.intro.saltar" onClick={onTerminar} />}
          </div>
        </div>
      </div>
    </section>
  );
}
