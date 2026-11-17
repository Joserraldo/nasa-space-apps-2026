import { useEffect, useRef, useState, type ReactNode } from "react";
import { consejosSatelite, type Dialogo } from "@solar-shield/agents";
import type { GameState } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono, type NombreIcono } from "../componentes/base/Iconos.js";
import { PERSONAS, Retrato, type Persona } from "../componentes/base/Retrato.js";
import { UMBRAL_BAJO } from "../componentes/base/Piezas.js";
import "../componentes/base/facetas.css";
import "./orbita.css";

/**
 * E3, pasos 1 y 2 (ESCENAS §2.4), rehecha desde la lámina ui/05: Marte ilustrado a la izquierda con su
 * órbita discontinua y el satélite, y a la derecha las tres placas, la tarjeta de la Ingeniera, el chip
 * de altitud y "Continue". Los números son los de `GameState.orbita`; los consejos, los de agentes.
 * La Ingeniera lleva la tarjeta grande de la lámina; los demás consejos (el aviso de la Meteoróloga
 * incluido) van debajo en tarjetas compactas, para no perder ninguno. Reemplaza a `Satelite.tsx`.
 */
export function PantallaOrbita({ estado, onContinuar }: { estado: GameState; onContinuar: () => void }) {
  const { t } = useT();
  const o = estado.orbita!;
  const altura = Math.round(o.alturaKm);
  const consejos = consejosSatelite(estado);
  // Una pantalla nueva empieza arriba: en vertical la anterior pudo dejar la página desplazada.
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const principal = consejos.find((d) => d.experto === "ingeniera");
  const otros = consejos.filter((d) => d !== principal);
  return (
    <section className="orbita" aria-labelledby="orbita-titulo">
      <div className="orbita-izq">
        <header className="orbita-cab">
          <div className="fc"><div className="fc-cara orbita-titulo"><h2 id="orbita-titulo">{t("ui.paso.1.titulo")}</h2></div></div>
          <div className="fc"><div className="fc-cara fc-chico orbita-paso"><span>{t("ui.paso.1.chip")}</span></div></div>
        </header>
        <div className="orbita-cielo" aria-hidden="true">
          <EscenaMarte />
        </div>
      </div>
      <div className="orbita-panel">
        <div className="orbita-placas">
          <PlacaOrbita nombreKey="ui.paso.1.bateria" icono="energia" valor={o.bateriaPct} />
          <PlacaOrbita nombreKey="ui.paso.1.senal" icono="senal" valor={o.senalPct} />
          <PlacaOrbita nombreKey="ui.paso.1.escudo" icono="escudo" valor={o.escudoPct} />
        </div>
        <Consejos>
          {principal && <LineaExperto d={principal} grande />}
          {otros.length > 0 && <ul className="orbita-otros">{otros.map((d, i) => <li key={`${d.experto}-${i}`}><LineaExperto d={d} /></li>)}</ul>}
        </Consejos>
        <div className="orbita-pie">
          <div className="fc orbita-altitud"><div className="fc-cara fc-chico"><span>{t("ui.paso.1.altitud", { altura })}</span></div></div>
          <div className="orbita-seguir"><FacetButton variant="primary" labelKey="ui.continuar" icon="jugar" onClick={onContinuar} /></div>
        </div>
      </div>
      {/* La frase completa de la altura sigue disponible para quien usa lector de pantalla. */}
      <p className="oculto-visual">{t("ui.paso.1.texto", { altura })}</p>
    </section>
  );
}

/**
 * Los consejos se desplazan por dentro cuando la pantalla es baja (celular apaisado), así el botón de
 * seguir nunca queda fuera de la vista. Solo si de verdad desborda entra en el orden del teclado, para
 * que quien no usa puntero pueda recorrerlos con las flechas.
 */
function Consejos({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const medir = () => setDesborda(el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    medir();
    return () => ro.disconnect();
  }, []);
  return <div ref={caja} className="orbita-consejos" tabIndex={desborda ? 0 : undefined} role={desborda ? "group" : undefined} aria-labelledby={desborda ? "orbita-titulo" : undefined}>{children}</div>;
}

/** Telemetría del satélite en la familia de la placa de la lámina: icono, separador, nombre y valor, barra cian. */
function PlacaOrbita({ nombreKey, icono, valor }: { nombreKey: string; icono: NombreIcono; valor: number }) {
  const { t } = useT();
  const v = Math.round(valor);
  const nombre = t(nombreKey);
  const bajo = v < UMBRAL_BAJO;
  return (
    <div className="fc">
      <div className={`fc-cara placa${bajo ? " placa-baja" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={nombre}
        aria-valuetext={bajo ? t("ui.comun.recurso.valor_bajo", { valor: v }) : `${v}%`}>
        <span className="placa-icono"><Icono nombre={icono} tam={36} /></span>
        <span className="placa-texto"><span className="placa-nombre">{nombre}</span><span className="placa-valor">{v}%</span></span>
        <span className="placa-capa">
          {bajo && <span className="placa-bajo"><Icono nombre="aviso" tam={16} />{t("ui.comun.recurso.bajo")}</span>}
        </span>
        <span className="orbita-pista" aria-hidden="true"><span style={{ inlineSize: `${v}%` }} /></span>
      </div>
    </div>
  );
}

/** Un consejo con el retrato de quien habla: grande para la Ingeniera (lámina), compacto para el resto. */
function LineaExperto({ d, grande = false }: { d: Dialogo; grande?: boolean }) {
  const { t } = useT();
  // Matemático y control de misión todavía no tienen retrato: la línea va sin él.
  const persona = (PERSONAS as readonly string[]).includes(d.experto) ? (d.experto as Persona) : null;
  const alerta = d.prioridad === "alerta";
  return (
    <div className="fc">
      <div className={`fc-cara orbita-linea${grande ? " orbita-linea-grande" : " fc-chico"}${alerta ? " orbita-alerta" : ""}${persona ? "" : " orbita-sin-retrato"}`}>
        {persona && (
          <span className="orbita-retrato">
            <Retrato persona={persona} expresion={alerta ? "preocupada" : "neutral"} tam={grande ? 160 : 96} parpadear={grande} />
          </span>
        )}
        <div className="orbita-texto">
          <p className="orbita-nombre">
            {alerta && <Icono nombre="aviso" tam={16} />}
            {t(d.experto === "ia_base" ? "ui.iris.titulo" : `agentes.titulo.${d.experto}`)}
          </p>
          {d.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
        </div>
      </div>
    </div>
  );
}

const MARTE = [320, 548] as const;
const SATELITE = [96, 178] as const;
const ruta = (nombre: string, ancho: number, ext: "avif" | "webp") => `${import.meta.env.BASE_URL}ilustraciones/${nombre}-${ancho}.${ext}`;

/** Imagen optimizada (`tests/capturas/orbita.py`): AVIF con WebP de respaldo, sin ampliar nunca. */
function Pieza({ nombre, anchos, tam, clase }: { nombre: string; anchos: readonly number[]; tam: string; clase: string }) {
  const juego = (ext: "avif" | "webp") => anchos.map((a) => `${ruta(nombre, a, ext)} ${a}w`).join(", ");
  const mayor = anchos[anchos.length - 1]!;
  return (
    <picture>
      <source type="image/avif" srcSet={juego("avif")} sizes={tam} />
      <source type="image/webp" srcSet={juego("webp")} sizes={tam} />
      <img className={clase} src={ruta(nombre, mayor, "webp")} srcSet={juego("webp")} sizes={tam} alt="" decoding="async" draggable={false} />
    </picture>
  );
}

/**
 * Marte con su órbita sobre el lienzo de la lámina (recorte 930 x 596). La mitad trasera de la órbita va
 * detrás del planeta y la delantera encima, así el planeta queda dentro de ella. El trazo es vectorial.
 */
function EscenaMarte() {
  return (
    <div className="orbita-escena">
      <svg className="orbita-trazo orbita-trazo-fondo" viewBox="30 240 930 596" preserveAspectRatio="none" focusable="false">
        <path d="M 56.351,622.612 A 411.489,151.152 -13.042 0 1 858.101,436.896" />
      </svg>
      <div className="orbita-marte"><Pieza nombre="orbita-marte" anchos={MARTE} tam="(min-width: 900px) 40vw, 90vw" clase="orbita-img" /></div>
      <svg className="orbita-trazo orbita-trazo-frente" viewBox="30 240 930 596" preserveAspectRatio="none" focusable="false">
        <path d="M 858.101,436.896 A 411.489,151.152 -13.042 0 1 56.351,622.612" />
      </svg>
      <div className="orbita-satelite"><Pieza nombre="orbita-satelite" anchos={SATELITE} tam="20vw" clase="orbita-img" /></div>
    </div>
  );
}
