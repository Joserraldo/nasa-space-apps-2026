import { useState } from "react";
import type { Cause, CauseOrigin, GameState, SourceCard } from "@solar-shield/contracts";
import {
  datosUsados, fuenteAprobada, referenciaDosis, regionPoloNorte, tarjetasCienciaFinal, terrenoJezero, tormentasCuradas,
} from "@solar-shield/data";
import { modulosColocados, resumenPartida } from "@solar-shield/engine";
import { MISION_JEZERO, TEXTOS_JEZERO, type TarjetaCiencia } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { LogoSolarShield } from "../componentes/base/LogoSolarShield.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { ICONO_RECURSO } from "../componentes/base/Piezas.js";
import { Retrato } from "../componentes/base/Retrato.js";
import { FuenteTerreno, TarjetaFuente } from "../componentes/TarjetaFuente.js";
import { DatosUsados } from "../componentes/DatosUsados.js";
import "../componentes/base/facetas.css";
import "./final.css";

/**
 * E8 Final, paso 8 (ESCENAS §2.6 y §2.7). Familia de paneles de `ui/04` y `personajes/07`
 * ("Your decision counts"): pestaña ciruela, tarjetas marfil, retrato del niño y de Iris.
 * Resultado y causas salen del motor (`resumenPartida`); tarjetas y pregunta, de la misión;
 * cada fuente, de data/. Reemplaza a `Final.tsx` (FLUJO §2.3).
 */
export function PantallaFinal({ estado, onOtra, onOtraSemilla }: {
  estado: GameState;
  /** Repite la misión con la misma semilla. */
  onOtra: () => void;
  /** Otra semilla: solo se muestra si el reductor la ofrece. */
  onOtraSemilla?: (() => void) | undefined;
}) {
  const { t } = useT();
  const r = resumenPartida(estado);
  const exito = r.resultado === "exito";
  return (
    <section className="final" aria-labelledby="final-titulo" data-resultado={exito ? "exito" : "fallo"}>
      <div className="final-pagina">
        <div className="fc final-hero">
          <div className="fc-cara final-hero-cara">
            <div className="final-equipo" aria-hidden="true">
              <figure className="final-nino"><Retrato persona="nino" expresion={exito ? "feliz" : "preocupada"} tam={220} /><figcaption>{t("ui.comun.retrato.nino.nombre")}</figcaption></figure>
              <figure className="final-iris"><Retrato persona="ia_base" expresion={exito ? "feliz" : "preocupada"} danada={estado.iaBase === "danada"} tam={150} /><figcaption>{t("ui.comun.retrato.ia_base.nombre")}</figcaption></figure>
            </div>
            <div className="final-veredicto">
              <div className="final-marca"><LogoSolarShield className="final-logo" /></div>
              <h2 id="final-titulo" className={`final-mensaje ${exito ? "final-exito" : "final-fallo"}`}>
                <Icono nombre={exito ? "check_exito" : "aviso"} tam={36} />
                {t(exito ? "ui.final.exito" : "ui.final.fallo")}
              </h2>
              <p className="final-animo">{t(exito ? "ui.final.animo.exito" : "ui.final.animo.fallo")}</p>
              {r.causaTerminal && <p className="final-motivo"><strong>{t("ui.final.motivo")}:</strong> {t(r.causaTerminal.descripcionKey)}</p>}
              <dl className="final-datos">
                <div><dt>{t("ui.final.puntaje")}</dt><dd>{r.puntaje} <span className="final-rango">{t(r.rangoKey)}</span></dd></div>
                <div><dt>{t("ui.final.dias")}</dt><dd>{r.dias}</dd></div>
              </dl>
              {r.insigniasKeys.length > 0 && (
                <div className="final-insignias">
                  <p className="final-sub">{t("ui.final.insignias")}</p>
                  <ul>{r.insigniasKeys.map((k) => <li key={k}><Icono nombre="escudo" tam={18} />{t(k)}</li>)}</ul>
                </div>
              )}
              <div className="final-acciones">
                <FacetButton variant="primary" labelKey="ui.final.jugar_otra" icon="jugar" onClick={onOtra} />
                {onOtraSemilla && <FacetButton labelKey="ui.final.otra_semilla" icon="planeta" onClick={onOtraSemilla} />}
                <p className="final-semilla">{t("ui.final.semilla", { seed: r.seed })}</p>
              </div>
            </div>
          </div>
        </div>

        <Panel tituloKey="ui.paso.8.titulo" heading className="final-causas">
          <CadenaCausas estado={estado} />
        </Panel>

        <Panel tituloKey="ui.final.ciencia" heading className="final-ciencia">
          <TarjetasCiencia estado={estado} />
        </Panel>

        <Panel tituloKey="ui.final.investigacion" heading className="final-investigacion">
          <Investigacion />
        </Panel>

        <Panel tituloKey="ui.final.pregunta.titulo" className="final-pregunta">
          <PreguntaFinal />
        </Panel>

        <FuentesGenerales />
      </div>
    </section>
  );
}

/** Qué datos de NASA usamos: plegado, para que el cierre se lea sin un muro de texto. */
function FuentesGenerales() {
  const { t } = useT();
  return (
    <details className="final-plegable final-datos-usados">
      <summary>{t(datosUsados().tituloKey)}</summary>
      <DatosUsados titulo={false} />
    </details>
  );
}

/** Panel de la familia `ui/04`: pestaña ciruela con el título y cara marfil. */
function Panel({ tituloKey, heading = false, className, children }: {
  tituloKey: string; heading?: boolean; className: string; children: React.ReactNode;
}) {
  const { t } = useT();
  const id = `final-panel-${className}`;
  const Cab = heading ? "h2" : "p";
  return (
    <section className={`fc final-panel ${className}`} aria-labelledby={heading ? id : undefined}>
      <div className="fc-cara final-cara">
        <Cab id={id} className="final-pestana">{t(tituloKey)}</Cab>
        <div className="final-cuerpo">{children}</div>
      </div>
    </section>
  );
}

const ORIGENES_JUGADOS = ["decision", "mala_suerte"] as const;

/** Cadena de causas: lo que pesó por decisión y por mala suerte, en bloques separados (DISEÑO §5.1). */
function CadenaCausas({ estado }: { estado: GameState }) {
  const { t } = useT();
  const r = resumenPartida(estado);
  const total = r.danoPorOrigen.decision + r.danoPorOrigen.mala_suerte + r.danoPorOrigen.sistema;
  const pct = (o: CauseOrigin) => (total === 0 ? 0 : Math.round((r.danoPorOrigen[o] / total) * 100));
  return (
    <div className="final-origenes">
      {ORIGENES_JUGADOS.map((o) => {
        const causas = r.causasDestacadas.filter((c) => c.origen === o);
        return (
          <div key={o} className={`final-origen final-${o}`}>
            <h3><Icono nombre={o === "decision" ? "tripulacion" : "sol"} tam={24} />{t(`ui.final.${o}`)}</h3>
            <Barra valor={pct(o)} etiqueta={t("ui.final.perdido", { total: r.danoPorOrigen[o] })} />
            {causas.length > 0
              ? <ul className="final-lista">{causas.map((c, i) => <LineaCausa key={i} c={c} />)}</ul>
              : <p className="final-vacio">{t("ui.final.sin_causas")}</p>}
          </div>
        );
      })}
      <div className="final-origen final-sistema">
        <h3><Icono nombre="energia" tam={24} />{t("ui.final.sistema")}</h3>
        <Barra valor={pct("sistema")} etiqueta={t("ui.final.perdido", { total: r.danoPorOrigen.sistema })} />
      </div>
    </div>
  );
}

function Barra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <p className="final-barra">
      <span className="final-pista" aria-hidden="true"><span style={{ inlineSize: `${valor}%` }} /></span>
      <span className="final-barra-txt">{etiqueta} · {valor}%</span>
    </p>
  );
}

function LineaCausa({ c }: { c: Cause }) {
  const { t } = useT();
  return (
    <li>
      {c.recurso ? <Icono nombre={ICONO_RECURSO[c.recurso]} tam={20} /> : <span />}
      <span>{t(c.descripcionKey)} <span className="final-tick">{t("ui.tick", { tick: c.tick })}</span></span>
      <span className="delta delta-menos">{c.delta}{c.recurso ? <span className="oculto-visual"> {t(`ui.recurso.${c.recurso}`)}</span> : null}</span>
    </li>
  );
}

/** Texto de la misión (missions/src/textos.ts), en el idioma elegido con respaldo en inglés. */
function useTextoMision() {
  const { idioma, t } = useT();
  return (clave: string) => TEXTOS_JEZERO[idioma][clave] ?? TEXTOS_JEZERO.en[clave] ?? t(clave);
}

type Fuente = { tipo: "tarjeta"; fuente: SourceCard } | { tipo: "terreno"; fuente: Parameters<typeof FuenteTerreno>[0]["fuente"] };

/**
 * Fuente de cada tarjeta de la misión, siempre desde data/. Si no hay una fuente real a mano,
 * devuelve null y la tarjeta no se muestra (regla de `TarjetaCiencia.fuenteKey`).
 */
function fuentesDe(tarjeta: TarjetaCiencia, estado: GameState): Fuente[] | null {
  switch (tarjeta.fuenteKey) {
    case "fuente.radlab": {
      const curada = tormentasCuradas.find((x) => x.id === estado.tormenta?.id);
      const m = curada?.medicionMarte;
      if (!curada || !m || !estado.tormenta) return null;
      return [
        { tipo: "tarjeta", fuente: { nombreKey: "fuente.radlab", url: m.url, idFuente: m.instrumento, consultadoEl: curada.fuente.consultadoEl, estadoDato: "curado" } },
        { tipo: "tarjeta", fuente: estado.tormenta.fuente },
      ];
    }
    case "fuente.marsTrek": return [{ tipo: "terreno", fuente: terrenoJezero.fuente }];
    case "fuente.jpl.insight": return [{ tipo: "tarjeta", fuente: fuenteAprobada("insight") }];
    case "fuente.nasa.agua": return [{ tipo: "tarjeta", fuente: fuenteAprobada("aguaIss") }];
    case "fuente.dosis.marte": return [{ tipo: "tarjeta", fuente: referenciaDosis("marte-superficie").fuente }];
    case "fuente.osdr": {
      // docs/science/tarjetas-mision1.md: la tarjeta de plantas cita el estudio OSD-772.
      const c = tarjetasCienciaFinal().find((x) => x.id === "OSD-772");
      return c ? [{ tipo: "tarjeta", fuente: c.fuente }] : null;
    }
    case "fuente.nssdc": {
      const f = regionPoloNorte().fuente;
      return [{ tipo: "terreno", fuente: { nombreKey: f.nombreKey, consultadoEl: f.consultadoEl, urls: [f.url] } }];
    }
    default: return null;
  }
}

/** Tarjetas de ciencia: la tormenta y el terreno siempre; las de módulos, solo de los que se construyeron. */
function TarjetasCiencia({ estado }: { estado: GameState }) {
  const { t } = useT();
  const tm = useTextoMision();
  const construidos = new Set(modulosColocados(estado));
  const curada = tormentasCuradas.find((x) => x.id === estado.tormenta?.id);
  const tarjetas = MISION_JEZERO.tarjetasCiencia
    .filter((c) => !c.modulo || construidos.has(c.modulo))
    .map((c) => ({ c, fuentes: fuentesDe(c, estado) }))
    .filter((x): x is { c: TarjetaCiencia; fuentes: Fuente[] } => x.fuentes !== null);
  return (
    <ul className="final-tarjetas">
      {tarjetas.map(({ c, fuentes }) => (
        <li key={c.id} className="fc">
          <div className="fc-cara fc-chico final-tarjeta">
            <p>{tm(c.textoKey)}</p>
            {c.id === "tormenta_medida" && curada?.medicionMarte && curada.medicionMarte.factor >= 1.5 && (
              <p className="final-cifra">{t("datos.tarjeta.medicion", {
                pico: curada.medicionMarte.pico, dia: curada.medicionMarte.diaPico,
                factor: Math.round(curada.medicionMarte.factor), fondo: curada.medicionMarte.fondo,
              })}</p>
            )}
            <details className="final-plegable">
              <summary>{t("ui.fuente.titulo")}</summary>
              {fuentes.map((f, i) => f.tipo === "tarjeta"
                ? <TarjetaFuente key={i} fuente={f.fuente} titulo={false} />
                : <FuenteTerreno key={i} fuente={f.fuente} titulo={false} />)}
            </details>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Pregunta final (quiz de ARES): 3 opciones, nunca bloquea y siempre explica, con su fuente. */
function PreguntaFinal() {
  const { t } = useT();
  const tm = useTextoMision();
  const p = MISION_JEZERO.preguntaFinal;
  const [elegida, setElegida] = useState<number | null>(null);
  const bien = elegida === p.correcta;
  return (
    <>
      <p className="final-pregunta-txt" id="final-pregunta-txt">{tm(p.preguntaKey)}</p>
      <div className="final-opciones" role="group" aria-labelledby="final-pregunta-txt">
        {p.opcionesKeys.map((k, i) => (
          <FacetButton key={k} labelKey="ui.final.pregunta.opcion" labelVars={{ texto: tm(k) }}
            selected={elegida === i} onClick={() => setElegida(i)} />
        ))}
      </div>
      {elegida !== null && (
        <div className="final-explica" role="status">
          <p className={`final-mensaje ${bien ? "final-exito" : "final-casi"}`}>
            <Icono nombre={bien ? "check_exito" : "aviso"} tam={22} />{t(bien ? "ui.final.pregunta.bien" : "ui.final.pregunta.casi")}
          </p>
          <p>{tm(p.explicacionKey)}</p>
          {p.fuenteKey === "fuente.nasa.bitflip" && <TarjetaFuente fuente={fuenteAprobada("bitFlip")} />}
        </div>
      )}
    </>
  );
}

/**
 * #137: estudios reales de NASA OSDR y de la Agencia Espacial Canadiense (`tarjetasCienciaFinal` de data/).
 * Plegados para no cargar el final: el niño abre el que le interesa. Cada uno con su fuente; los de la CSA,
 * con su crédito obligatorio ("© Canadian Space Agency") y sin logo.
 */
function Investigacion() {
  const { t } = useT();
  const tarjetas = tarjetasCienciaFinal();
  return (
    <>
      <p className="final-sub">{t("ui.final.investigacion.texto")}</p>
      <ul className="final-tarjetas">
        {tarjetas.map((c) => (
          <li key={c.id} className="fc">
            <details className="fc-cara fc-chico final-tarjeta final-plegable final-estudio">
              <summary>{t(c.tituloKey)}</summary>
              <p>{t(c.textoKey)}</p>
              {c.creditoKey && <p className="final-credito">{t(c.creditoKey)}</p>}
              <TarjetaFuente fuente={c.fuente} />
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
