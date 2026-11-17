import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono, type NombreIcono } from "./base/Iconos.js";
import { Retrato, type Persona } from "./base/Retrato.js";
import "./base/inicio.css";

/**
 * Intro en 4 viñetas (inicio/02, HISTORIA §3, DISEÑO §6, ESCENAS §2.2 y §2.7). Cada viñeta es una
 * escena dentro de la nave, como la lámina: paredes lila, una ventana con lo que mira el niño y los
 * personajes adelante. Etiqueta "01 / ..." arriba a la izquierda, el texto en una franja abajo y
 * "Skip intro" siempre a mano. Se puede saltar en cualquier viñeta y lleva al mismo punto que
 * "Continue" en la última. Flechas del teclado para avanzar y retroceder. No muestra decisiones.
 */
type Ventana = "marte" | "satelite" | "marte_lejos" | "base";

const VINETAS: readonly { ventana: Ventana; adelante: Persona[]; atras?: Persona[]; iconos?: NombreIcono[] }[] = [
  // 1: sentado en la cabina, Marte por la ventana.
  { ventana: "marte", adelante: ["nino"] },
  // 2: en la consola, el satélite listo afuera.
  { ventana: "satelite", adelante: ["nino"] },
  // 3: la tripulación en la mesa redonda, Iris al lado.
  { ventana: "marte_lejos", adelante: ["nino"], atras: ["ingeniera", "doctora", "meteorologa", "ia_base"] },
  // 4: la base que podría construir y los tres medidores.
  { ventana: "base", adelante: ["nino"], iconos: ["energia", "pulmones", "escudo"] },
];
export const TOTAL_VINETAS = VINETAS.length;

const BASE = import.meta.env.BASE_URL;

/**
 * Una ilustración de María Paula (las mismas de portada, carga y órbita) en AVIF y WebP, con dos
 * anchos. Decorativa: la ventana entera es aria-hidden y el texto de la viñeta cuenta lo que pasa.
 */
function Ilustracion({ nombre, anchos, clase }: { nombre: string; anchos: readonly [number, number]; clase: string }) {
  const srcset = (ext: string) => anchos.map((a) => `${BASE}ilustraciones/${nombre}-${a}.${ext} ${a}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes="(max-width: 600px) 40vw, 24vw" />
      <img className={`intro-ilu ${clase}`} src={`${BASE}ilustraciones/${nombre}-${anchos[1]}.webp`} srcSet={srcset("webp")}
        sizes="(max-width: 600px) 40vw, 24vw" alt="" decoding="async" draggable={false} />
    </picture>
  );
}

/**
 * Lo que se ve por la ventana de la nave en cada viñeta (inicio/02): Marte con Fobos asomando, el
 * satélite listo para observar, Marte detrás de la tripulación y la base que el niño puede armar.
 */
function VistaVentana({ tipo }: { tipo: Ventana }) {
  return (
    <div className={`intro-ventana intro-ventana-${tipo}`} aria-hidden="true">
      <span className="intro-estrellas" />
      {tipo === "marte" && (<>
        <Ilustracion nombre="orbita-marte" anchos={[320, 548]} clase="intro-ilu-marte" />
        <Ilustracion nombre="portada-asteroide" anchos={[120, 240]} clase="intro-ilu-fobos" />
      </>)}
      {tipo === "satelite" && (<>
        <Ilustracion nombre="orbita-marte" anchos={[320, 548]} clase="intro-ilu-marte-borde" />
        <Ilustracion nombre="orbita-satelite" anchos={[96, 178]} clase="intro-ilu-satelite" />
      </>)}
      {tipo === "marte_lejos" && <Ilustracion nombre="orbita-marte" anchos={[320, 548]} clase="intro-ilu-marte-lejos" />}
      {tipo === "base" && (<>
        <span className="intro-suelo" />
        <Ilustracion nombre="carga-panel" anchos={[140, 280]} clase="intro-ilu-panel" />
        <Ilustracion nombre="carga-habitat" anchos={[180, 360]} clase="intro-ilu-habitat" />
        <Ilustracion nombre="carga-invernadero" anchos={[130, 248]} clase="intro-ilu-invernadero" />
      </>)}
    </div>
  );
}

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
  const v = VINETAS[i]!;
  return (
    <section className="intro" aria-roledescription={t("ui.intro.descripcion")} aria-label={t("ui.intro.paso", { n, total: TOTAL_VINETAS })}>
      <div className="intro-vineta" key={i}>
        <div className={`intro-escena intro-escena-${n}`}>
          <h2 ref={titulo} tabIndex={-1} className="intro-etiqueta">
            {String(n).padStart(2, "0")} / {t(`ui.intro.${n}.titulo`)}
          </h2>
          <VistaVentana tipo={v.ventana} />
          {v.atras && (
            <div className="intro-mesa" aria-hidden="true">
              {v.atras.map((p) => <Retrato key={p} persona={p} expresion="feliz" tam={128} parpadear />)}
              <span className="intro-mesa-tapa" />
            </div>
          )}
          {v.iconos && (
            <div className="intro-consola" aria-hidden="true">
              {v.iconos.map((ic) => <span key={ic} className="intro-icono"><Icono nombre={ic} tam={48} /></span>)}
            </div>
          )}
          <div className="intro-protagonista" aria-hidden="true">
            {v.adelante.map((p) => <Retrato key={p} persona={p} expresion="feliz" tam={190} parpadear />)}
          </div>
          <p className="intro-texto">{t(`ui.intro.${n}.texto`)}</p>
          {!ultima && <div className="intro-saltar"><FacetButton labelKey="ui.intro.saltar" onClick={onTerminar} /></div>}
        </div>
        <div className="intro-pie">
          <span className="intro-puntos" aria-hidden="true">
            {VINETAS.map((_, k) => <i key={k} className={k === i ? "actual" : k < i ? "hecho" : ""} />)}
          </span>
          {i > 0 && <FacetButton labelKey="ui.comun.atras" icon="atras" onClick={() => setI(i - 1)} />}
          {ultima
            ? <FacetButton variant="primary" labelKey="ui.intro.continuar" onClick={onTerminar} />
            : <FacetButton variant="primary" labelKey="ui.intro.siguiente" onClick={() => setI(i + 1)} />}
        </div>
      </div>
    </section>
  );
}
