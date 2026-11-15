import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { IdiomaContext, useT, type Idioma } from "../../i18n.js";
import { partidaDorada } from "@solar-shield/engine";
import { ConfirmarAccion } from "./ConfirmarAccion.js";
import { FacetButton } from "./FacetButton.js";
import { Mensaje, ResourcePlaque } from "./Piezas.js";
import { ExpertPortrait } from "./ExpertPortrait.js";
import { EXPRESIONES, PERSONAS, Retrato } from "./Retrato.js";
import { Carga } from "../Carga.js";
import { DatosUsados } from "../DatosUsados.js";
import { Glosario, Termino } from "../Glosario.js";
import { TarjetaFuente } from "../TarjetaFuente.js";
import { Intro } from "../Intro.js";
import { Portada } from "../Portada.js";
import "../../estilos/tokens.css";
import "../../estilos/base.css";
import "./muestrario.css";

/**
 * Muestrario de la interfaz v8, ordenado como la lámina `ui/03-variantes-facetadas.png`, para sacar
 * la captura de la ficha de fidelidad al lado de la lámina. Los estados hover, pressed y focus se
 * fuerzan con una clase solo aquí; en el juego los da el navegador.
 */
/** ?vista=retratos: las 8 expresiones de cada personaje, como las láminas personajes/02, 04, 06 y 09, y las fichas de ui/04. */
function Retratos() {
  const { t } = useT();
  const [elegida, setElegida] = useState<string>("ingeniera");
  return (
    <main className="muestrario">
      <h1>{t("ui.comun.muestrario.retratos")}</h1>
      <div className="mu-retratos">
        <span />
        {EXPRESIONES.map((e) => <span key={e} className="mu-expresion">{t(`ui.comun.muestrario.expresion.${e}`)}</span>)}
        {PERSONAS.map((p) => [
          <span key={p} className="mu-expresion">{t(`ui.comun.retrato.${p}.nombre`)}</span>,
          ...EXPRESIONES.map((e) => <span key={p + e} className="mu-celda"><Retrato persona={p} expresion={e} tam={104} /></span>),
        ])}
      </div>
      <div className="mu-fila">
        {(["ingeniera", "doctora", "meteorologa"] as const).map((p) => <ExpertPortrait key={p} persona={p} seleccionado={elegida === p} onElegir={() => setElegida(p)} />)}
        <ExpertPortrait persona="nino" expresion="feliz" />
        <ExpertPortrait persona="ia_base" danada expresion="preocupada" />
      </div>
    </main>
  );
}

function Muestrario() {
  const { t } = useT();
  const [sel, setSel] = useState(false);
  const nada = () => {};
  const estado = partidaDorada();
  return (
    <main className="muestrario">
      <h1>{t("ui.comun.muestrario.titulo")}</h1>

      <section>
        <h2>{t("ui.comun.muestrario.acciones")}</h2>
        <div className="mu-fila">
          {(["normal", "hover", "pressed", "foco"] as const).map((e) => (
            <figure key={e} className={`mu-forzar-${e}`}>
              <FacetButton labelKey="ui.continuar" onClick={nada} />
              <figcaption>{t(`ui.comun.muestrario.estado.${e}`)}</figcaption>
            </figure>
          ))}
          <figure><FacetButton labelKey="ui.comun.atras" onClick={nada} /><figcaption>&nbsp;</figcaption></figure>
          <figure>
            <FacetButton labelKey="ui.continuar" onClick={nada} disabled disabledReasonKey="ui.comun.motivo.sin_energia" />
          </figure>
        </div>
        <div className="mu-fila">
          <FacetButton labelKey="ui.comun.tripulacion" icon="tripulacion" onClick={nada} />
          <FacetButton labelKey="ui.comun.mapa" icon="mapa" onClick={nada} />
          <FacetButton variant="primary" labelKey="ui.comun.muestrario.colocar_panel" icon="check" onClick={nada} />
          <FacetButton labelKey="ui.comun.enviar" onClick={nada} />
          <FacetButton labelKey="ui.comun.voz" icon="microfono" onClick={nada} />
        </div>
        <div className="mu-fila">
          <FacetButton labelKey="ui.comun.muestrario.elegir" selected={sel} onClick={() => setSel((s) => !s)} />
          <FacetButton labelKey="ui.comun.enviar" busy onClick={nada} />
          <FacetButton labelKey="ui.comun.atras" icon="atras" onClick={nada} />
        </div>
      </section>

      <section>
        <h2>{t("ui.comun.muestrario.exploracion")}</h2>
        <div className="mu-fila">
          <ResourcePlaque recurso="energia" value={70} />
          <ResourcePlaque recurso="soporte_vital" value={80} />
          <ResourcePlaque recurso="blindaje" value={60} />
          <ResourcePlaque recurso="blindaje" value={12} feedback={[{ id: "1", delta: -10, causaKey: "ui.causa.tormenta" }]} />
        </div>
      </section>

      <section>
        <h2>{t("ui.comun.muestrario.decision")}</h2>
        <div className="mu-fila">
          <ConfirmarAccion estado={{ ...estado, pausado: true }} accion={{ tipo: "colocar_modulo", modulo: "panel_solar" }} onCancelar={nada} onConfirmar={nada} />
          <ConfirmarAccion estado={{ ...estado, recursos: { ...estado.recursos, energia: 5 } }} accion={{ tipo: "reparar", equipo: "ia_base" }} onCancelar={nada} onConfirmar={nada} />
        </div>
      </section>

      <section>
        <h2>{t("ui.comun.muestrario.mensajes")}</h2>
        <div className="mu-columna">
          <Mensaje tipo="exito" tituloKey="ui.comun.muestrario.panel_instalado" detalleKey="ui.comun.muestrario.beneficio_pendiente" />
          <Mensaje tipo="aviso" tituloKey="ui.comun.muestrario.energia_baja" detalleKey="ui.comun.muestrario.revisa_plan" />
          <Mensaje tipo="error" tituloKey="ui.comun.motivo.recursos_insuficientes.energia" detalleKey="ui.comun.muestrario.otra_opcion" />
          <Mensaje tipo="pendiente" tituloKey="ui.comun.muestrario.respuesta_pendiente" detalleKey="ui.comun.muestrario.sigue_explorando" />
        </div>
      </section>

      <section>
        <h2>{t("ui.comun.muestrario.fuentes")}</h2>
        <div className="mu-columna">
          {estado.tormenta && <TarjetaFuente fuente={estado.tormenta.fuente} />}
          <p><Termino id="dosis" /> · <Termino id="radiacion" /> · <Termino id="telemetria" /></p>
          <DatosUsados />
          <Glosario />
        </div>
      </section>
    </main>
  );
}

/** ?vista=portada | intro | carga muestra esa pantalla a pantalla completa (para las capturas a 1024x683, 844x390 y 390x844). */
function Raiz() {
  const params = new URLSearchParams(location.search);
  const [idioma, setIdioma] = useState<Idioma>(() => (params.get("lang") === "es" ? "es" : "en"));
  const [sonido, setSonido] = useState(false);
  const vista = params.get("vista");
  const n = Number(params.get("n") ?? 0);
  if (vista) {
    const nada = () => {};
    return (
      <IdiomaContext.Provider value={idioma}>
        {vista === "portada" && <Portada idioma={idioma} onIdioma={setIdioma} sonido={sonido} onSonido={() => setSonido(!sonido)} puedeContinuar={params.has("guardado")} onEmpezar={nada} onContinuar={nada} onAjustes={nada} onCreditos={nada} />}
        {vista === "intro" && <Intro inicial={n} onTerminar={nada} />}
        {vista === "carga" && <Carga consejo={n} sonido={sonido} onSonido={() => setSonido(!sonido)} />}
        {vista === "retratos" && <Retratos />}
      </IdiomaContext.Provider>
    );
  }
  return (
    <IdiomaContext.Provider value={idioma}>
      <div className="mu-idioma">
        <button onClick={() => setIdioma(idioma === "en" ? "es" : "en")}>{idioma === "en" ? "ES" : "EN"}</button>
      </div>
      <Muestrario />
    </IdiomaContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Raiz /></StrictMode>);
