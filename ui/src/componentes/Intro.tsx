import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono, type NombreIcono } from "./base/Iconos.js";
import { Retrato, type Persona } from "./base/Retrato.js";
import { Vineta3D } from "./base/intro3d/Vineta3D.js";
import "./base/inicio.css";
import "./base/intro3d/intro3d.css";

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
/** Viñetas que ya tienen su escena 3D con los modelos del juego (`base/intro3d/`). */
const CON_ESCENA = new Set([1, 2, 3, 4]);

function VistaVentana({ tipo }: { tipo: Ventana }) {
  return (
    <div className={`intro-ventana intro-ventana-${tipo}`} aria-hidden="true">
      <span className="intro-estrellas" />
      {(tipo === "marte" || tipo === "marte_lejos") && <span className="intro-marte" />}
      {tipo === "satelite" && <Icono nombre="satelite" tam={120} className="intro-sat" />}
      {tipo === "base" && (
        <span className="intro-base">
          <span className="intro-suelo" />
          <span className="intro-domo" /><span className="intro-domo chico" /><span className="intro-domo chico otro" />
        </span>
      )}
    </div>
  );
}

export function Intro({ onTerminar, inicial = 0 }: { onTerminar(): void; inicial?: number }) {
  const { t } = useT();
  const [i, setI] = useState(Math.max(0, Math.min(TOTAL_VINETAS - 1, inicial)));
  const titulo = useRef<HTMLHeadingElement>(null);
  const ultima = i === TOTAL_VINETAS - 1;
  // Sin WebGL (o si falla) la viñeta vuelve a la tarjeta DOM para el resto de la intro.
  const [sin3D, setSin3D] = useState(false);

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
  const en3D = !sin3D && CON_ESCENA.has(n);
  return (
    <section className="intro" aria-roledescription={t("ui.intro.descripcion")} aria-label={t("ui.intro.paso", { n, total: TOTAL_VINETAS })}>
      <div className="intro-vineta" key={i}>
        <div className={`intro-escena intro-escena-${n}`}>
          <h2 ref={titulo} tabIndex={-1} className="intro-etiqueta">
            {String(n).padStart(2, "0")} / {t(`ui.intro.${n}.titulo`)}
          </h2>
          {en3D && <Vineta3D n={n} onFallo={() => setSin3D(true)} />}
          {!en3D && <VistaVentana tipo={v.ventana} />}
          {!en3D && v.atras && (
            <div className="intro-mesa" aria-hidden="true">
              {v.atras.map((p) => <Retrato key={p} persona={p} expresion="feliz" tam={128} parpadear />)}
              <span className="intro-mesa-tapa" />
            </div>
          )}
          {!en3D && v.iconos && (
            <div className="intro-consola" aria-hidden="true">
              {v.iconos.map((ic) => <span key={ic} className="intro-icono"><Icono nombre={ic} tam={48} /></span>)}
            </div>
          )}
          {!en3D && (
            <div className="intro-protagonista" aria-hidden="true">
              {v.adelante.map((p) => <Retrato key={p} persona={p} expresion="feliz" tam={190} parpadear />)}
            </div>
          )}
          <p className="intro-texto">{t(`ui.intro.${n}.texto`)}</p>
          {/* Abajo a la derecha, dentro de la viñeta, como inicio/02: avanzar y Skip intro. En la última, Continue ya termina: Skip no se repite. */}
          <div className="intro-acciones">
            {i > 0 && <FacetButton labelKey="ui.comun.atras" icon="atras" onClick={() => setI(i - 1)} />}
            {ultima
              ? <FacetButton variant="primary" labelKey="ui.intro.continuar" onClick={onTerminar} />
              : <FacetButton variant="primary" labelKey="ui.intro.siguiente" onClick={() => setI(i + 1)} />}
            {!ultima && <span className="intro-saltar"><FacetButton labelKey="ui.intro.saltar" onClick={onTerminar} /></span>}
          </div>
        </div>
      </div>
    </section>
  );
}
