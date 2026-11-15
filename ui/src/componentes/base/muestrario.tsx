import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { IdiomaContext, useT, type Idioma } from "../../i18n.js";
import { FacetButton } from "./FacetButton.js";
import "../../estilos/tokens.css";
import "../../estilos/base.css";
import "./muestrario.css";

/**
 * Muestrario de la interfaz v8, ordenado como la lámina `ui/03-variantes-facetadas.png`, para sacar
 * la captura de la ficha de fidelidad al lado de la lámina. Los estados hover, pressed y focus se
 * fuerzan con una clase solo aquí; en el juego los da el navegador.
 */
function Muestrario() {
  const { t } = useT();
  const [sel, setSel] = useState(false);
  const nada = () => {};
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
    </main>
  );
}

function Raiz() {
  const [idioma, setIdioma] = useState<Idioma>(() => (new URLSearchParams(location.search).get("lang") === "es" ? "es" : "en"));
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
