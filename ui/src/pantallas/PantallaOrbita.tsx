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
 * E3, pasos 1 y 2 (ESCENAS §2.4). No hay lámina v8: familia de tarjetas y placas de DISEÑO §5,
 * fondo espacial de la portada y Marte facetado visto desde órbita. Los números son los de
 * `GameState.orbita`; los consejos, los de agentes. Reemplaza a `Satelite.tsx` (FLUJO §2.3).
 */
export function PantallaOrbita({ estado, onContinuar }: { estado: GameState; onContinuar: () => void }) {
  const { t } = useT();
  const o = estado.orbita!;
  const consejos = consejosSatelite(estado);
  return (
    <section className="orbita" aria-labelledby="orbita-titulo">
      <div className="orbita-cielo" aria-hidden="true">
        <MarteFacetado giro={(estado.tick * 45) % 360} />
      </div>
      <div className="orbita-panel">
        <div className="fc">
          <div className="fc-cara orbita-tarjeta">
            <h2 id="orbita-titulo">{t("ui.paso.1.titulo")}</h2>
            <p>{t("ui.paso.1.texto", { altura: Math.round(o.alturaKm) })}</p>
          </div>
        </div>
        <div className="orbita-placas">
          <PlacaOrbita nombreKey="ui.paso.1.bateria" icono="energia" valor={o.bateriaPct} />
          <PlacaOrbita nombreKey="ui.paso.1.senal" icono="satelite" valor={o.senalPct} />
          <PlacaOrbita nombreKey="ui.paso.1.escudo" icono="escudo" valor={o.escudoPct} />
        </div>
        <ul className="orbita-consejos">
          {consejos.map((d, i) => <LineaExperto key={`${d.experto}-${i}`} d={d} />)}
        </ul>
        <FacetButton variant="primary" labelKey="ui.continuar" icon="jugar" onClick={onContinuar} />
      </div>
    </section>
  );
}

/** Telemetría del satélite en la misma familia que la placa de recurso (DISEÑO §5.1). */
function PlacaOrbita({ nombreKey, icono, valor }: { nombreKey: string; icono: NombreIcono; valor: number }) {
  const { t } = useT();
  const v = Math.round(valor);
  const nombre = t(nombreKey);
  const bajo = v < UMBRAL_BAJO;
  return (
    <div className="fc">
      <div className="fc-cara placa" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={nombre}
        aria-valuetext={bajo ? t("ui.comun.recurso.valor_bajo", { valor: v }) : `${v}%`}>
        <Icono nombre={icono} tam={30} />
        <span className="placa-texto"><span className="placa-nombre">{nombre}</span><span className="placa-valor">{v}%</span></span>
        <span className="placa-capa">
          {bajo && <span className="placa-bajo"><Icono nombre="aviso" tam={16} />{t("ui.comun.recurso.bajo")}</span>}
        </span>
        <span className="orbita-pista" aria-hidden="true"><span style={{ inlineSize: `${v}%` }} /></span>
      </div>
    </div>
  );
}

/** Una línea de consejo con el retrato de quien habla (familia de `ui/01`). */
function LineaExperto({ d }: { d: Dialogo }) {
  const { t } = useT();
  // Matemático y control de misión todavía no tienen retrato: la línea va sin él.
  const persona = (PERSONAS as readonly string[]).includes(d.experto) ? (d.experto as Persona) : null;
  const alerta = d.prioridad === "alerta";
  return (
    <li className="fc">
      <div className={`fc-cara fc-chico orbita-linea${alerta ? " orbita-alerta" : ""}`}>
        {persona ? <Retrato persona={persona} expresion={alerta ? "preocupada" : "neutral"} tam={56} /> : <span />}
        <div>
          <p className="orbita-nombre">
            {alerta && <Icono nombre="aviso" tam={16} />}
            {t(d.experto === "ia_base" ? "ui.iris.titulo" : `agentes.nombre.${d.experto}`)}
          </p>
          {d.lineas.map((l, i) => <p key={i}>{t(l.clave, l.vars)}</p>)}
        </div>
      </div>
    </li>
  );
}

/**
 * Marte facetado desde órbita: polígonos planos con los tokens de entorno, sombra hacia lila
 * (nunca negra, DISEÑO §3.4) y el satélite girando con el tick del motor.
 */
function MarteFacetado({ giro }: { giro: number }) {
  return (
    <svg viewBox="0 0 400 400" className="orbita-marte" focusable="false">
      <g className="orbita-planeta">
        <polygon className="f-claro" points="200,60 290,95 250,170 170,150" />
        <polygon className="f-medio" points="290,95 340,190 250,170" />
        <polygon className="f-claro" points="170,150 250,170 230,250 140,230" />
        <polygon className="f-medio" points="200,60 170,150 90,130 120,80" />
        <polygon className="f-roca" points="90,130 170,150 140,230 70,210" />
        <polygon className="f-medio" points="250,170 340,190 320,280 230,250" />
        <polygon className="f-roca" points="140,230 230,250 200,330 120,300" />
        <polygon className="f-sombra" points="230,250 320,280 270,330 200,330" />
        <polygon className="f-sombra" points="70,210 140,230 120,300 80,270" />
        {/* Cráter Jezero: la única marca, donde baja la misión. */}
        <polygon className="f-jezero" points="186,186 206,180 218,194 210,212 190,214 180,200" />
      </g>
      <ellipse className="orbita-ruta" cx="200" cy="200" rx="185" ry="70" transform="rotate(-18 200 200)" />
      <g transform={`rotate(${giro} 200 200)`}>
        <g transform="translate(372 160)">
          <polygon className="f-panel" points="-30,-6 -12,-6 -12,6 -30,6" />
          <polygon className="f-panel" points="12,-6 30,-6 30,6 12,6" />
          <polygon className="f-satelite" points="-10,-10 10,-10 12,0 10,10 -10,10 -12,0" />
        </g>
      </g>
    </svg>
  );
}
