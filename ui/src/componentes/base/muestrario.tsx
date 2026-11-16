import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { IdiomaContext, useT, type Idioma } from "../../i18n.js";
import { partidaDorada } from "@solar-shield/engine";
import { ConfirmarAccion } from "./ConfirmarAccion.js";
import { FacetButton } from "./FacetButton.js";
import { CostRow, Mensaje, ResourcePlaque } from "./Piezas.js";
import { PildoraBoton, PildoraObjetivo } from "./Pildoras.js";
import { HudBase } from "../HudBase.js";
import { ExpertPortrait } from "./ExpertPortrait.js";
import { AccesoRecurso, ChipPregunta } from "./Accesos.js";
import { TarjetaFuenteCompacta } from "./FuenteCompacta.js";
import { BarraSeccion, ChipPausa, PanelFacetado } from "./PanelFacetado.js";
import { TarjetaDecision } from "./TarjetaDecision.js";
import { TarjetaContextual, type OrigenTarjeta } from "./TarjetaContextual.js";

import { EXPRESIONES, PERSONAS, Retrato } from "./Retrato.js";
import { Globo } from "./Globo.js";
import { Icono } from "./Iconos.js";
import { useModoTactil } from "../ControlesTactiles.js";
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

/** ?vista=paneles: los cuatro paneles de ui/04 armados solo con las piezas, para la captura al lado de la lámina. */
function PanelesE7() {
  const { t } = useT();
  const [sel, setSel] = useState<string | null>("ingeniera");
  const nada = () => {};
  return (
    <div className="mu-paneles">
      <PanelFacetado numero={1} tituloKey="ui.tormenta.elegir" acciones={<ChipPausa />}>
        <div className="mu-tres">
          {(["ingeniera", "doctora", "meteorologa"] as const).map((p) => <ExpertPortrait key={p} persona={p} seleccionado={sel === p} onElegir={() => setSel(p)} />)}
        </div>
        <div className="mu-fila-chips">
          <input className="mu-campo" placeholder={t("ui.base.tripulacion.campo")} aria-label={t("ui.base.tripulacion.campo")} />
          <FacetButton icon="avion_papel" labelKey="ui.comun.enviar" onClick={nada} />
        </div>
        <div className="mu-tres mu-accesos">
          <AccesoRecurso recurso="energia" valor={70} onClick={nada} />
          <AccesoRecurso recurso="soporte_vital" valor={80} onClick={nada} />
          <AccesoRecurso recurso="blindaje" valor={60} onClick={nada} />
        </div>
      </PanelFacetado>
      <PanelFacetado numero={2} tituloKey="ui.tormenta.comparar">
        <div className="mu-dos">
          <div className="mu-centro"><ExpertPortrait persona="ingeniera" compacto /><FacetButton icon="tripulacion" labelKey="ui.tormenta.otra" onClick={nada} /></div>
          <div className="mu-columna-chica">
            <BarraSeccion tituloKey="ui.comun.muestrario.colocar_panel" />
            <CostRow inmediato={{ energia: -6, soporte_vital: -3 }} retrasado={{ energia: 14 }} />
            <FacetButton variant="primary" icon="check" labelKey="ui.comun.confirmar" onClick={nada} />
          </div>
        </div>
      </PanelFacetado>
      <PanelFacetado numero={3} tituloKey="ui.tormenta.verificar">
        <div className="mu-dos mu-dos-fuente">
          <div className="mu-centro"><ExpertPortrait persona="doctora" compacto /><ExpertPortrait persona="meteorologa" compacto /></div>
          <div className="mu-columna-chica">
            <BarraSeccion icono="libro" tituloKey="ui.tormenta.fuente" />
            <TarjetaFuenteCompacta dueno="NASA" id="2024-05-20T05:36:00-CME-001" fecha="2026-11-13" />
            <ChipPregunta icono="escudo" labelKey="ui.tormenta.pregunta.proteger" onClick={nada} />
            <ChipPregunta icono="pulso" labelKey="ui.tormenta.pregunta.sensor" onClick={nada} />
            <FacetButton variant="primary" icon="enlace" labelKey="ui.tormenta.verFuente" onClick={nada} />
          </div>
        </div>
      </PanelFacetado>
      <PanelFacetado numero={4} tituloKey="ui.comun.decision.titulo">
        <div className="mu-dos mu-dos-fuente">
          <div className="mu-centro"><ExpertPortrait persona="nino" expresion="feliz" compacto /><ExpertPortrait persona="ia_base" compacto /></div>
          <TarjetaDecision aplicado={{ energia: -6, soporte_vital: -3 }} retrasado={{ energia: 14 }} onVolver={nada} onVerRegistro={nada} />
        </div>
      </PanelFacetado>
    </div>
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
          <ResourcePlaque recurso="energia" value={55} pending={[{ id: "p", aplicaEnTick: 3, recurso: "energia", delta: 13, origen: "decision", descripcionKey: "causa.colocar_modulo", oculto: false }]} />
        </div>
        <h3>{t("ui.comun.muestrario.pildoras")}</h3>
        <div className="mu-fila">
          <PildoraObjetivo labelKey="ui.comun.muestrario.objetivo" />
          <PildoraBoton labelKey="ui.comun.tripulacion" icon="tripulacion" onClick={nada} />
          <PildoraBoton labelKey="ui.comun.mapa" icon="mapa" onClick={nada} />
          <PildoraBoton labelKey="ui.comun.muestrario.inspeccionar" tecla={{ letra: "E", tono: "accion" }} onClick={nada} />
          <PildoraBoton labelKey="ui.comun.hud.primera" tecla={{ letra: "V", tono: "camara" }} onClick={nada} />
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
        <h2>{t("ui.comun.muestrario.paneles")}</h2>
        <PanelesE7 />
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

/**
 * ?vista=globo: el globo sobre quien habla (personajes/07), el aviso [E] de mundo/01 y, en táctil, la
 * acción de mundo/03 con el botón de salto que usará E9. Usar el aviso lo esconde y vuelve a aparecer.
 */
function GloboEscena() {
  const { t } = useT();
  const tactil = useModoTactil();
  const [cerca, setCerca] = useState(true);
  const nada = () => {};
  const usar = () => { setCerca(false); window.setTimeout(() => setCerca(true), 800); };
  const estado = { ...partidaDorada(), recursos: { energia: 70, soporte_vital: 80, blindaje: 60 }, efectosPendientes: [] };
  return (
    <div className="mu-escena">
      <HudBase estado={estado} tactil={tactil} objetivo={{ labelKey: "ui.comun.muestrario.objetivo" }}
        mundo={{ onTripulacion: nada, onMapa: nada, camara: "tercera", onCamara: nada, interaccion: cerca ? { labelKey: "ui.comun.muestrario.inspeccionar", onUsar: usar } : undefined }} />
      <div className="mu-actor mu-actor-iris">
        <Retrato persona="ia_base" tam={96} />
        <Globo texto={t("ui.comun.muestrario.globo.texto")} quien={t("ui.comun.retrato.ia_base.nombre")} />
      </div>
      <div className="mu-actor mu-actor-ingeniera">
        <Retrato persona="ingeniera" tam={96} />
        <Globo punta="arriba" tono="aviso" texto={t("ui.comun.muestrario.globo.aviso")} quien={t("ui.comun.retrato.ingeniera.nombre")} />
      </div>
      {tactil && (
        <div className="ct">
          <div className="ct-botones">
            <button type="button" className="ct-salto" aria-label={t("ui.comun.saltar")}><span className="ct-cara"><Icono nombre="salto" tam={32} /></span></button>
            <button type="button" className="ct-camara" aria-label={t("ui.comun.hud.primera")}><span className="ct-cara"><span className="ct-tecla" aria-hidden="true">V</span><span aria-hidden="true">{t("ui.hud.camara.corto")}</span></span></button>
            {cerca && <button type="button" className="ct-accion" aria-label={t("ui.comun.muestrario.inspeccionar")} onClick={usar}><span className="ct-cara"><Icono nombre="llave" tam={28} /><span aria-hidden="true">{t("ui.hud.usar.panel_solar.corto")}</span></span></button>}
          </div>
        </div>
      )}
    </div>
  );
}

/** ?vista=hud: el HUD completo de mundo/01 sobre un fondo marciano de tokens, para la captura al lado de la lámina. */
function HudEscena() {
  const { t } = useT();
  const nada = () => {};
  const estado = { ...partidaDorada(), recursos: { energia: 70, soporte_vital: 80, blindaje: 60 }, efectosPendientes: [] };
  return (
    <div className="mu-escena" role="img" aria-label={t("ui.comun.muestrario.hud_escena")}>
      <HudBase estado={estado} objetivo={{ labelKey: "ui.comun.muestrario.objetivo" }}
        mundo={{ onTripulacion: nada, onMapa: nada, camara: "tercera", onCamara: nada, interaccion: { labelKey: "ui.comun.muestrario.inspeccionar", onUsar: nada } }} />
    </div>
  );
}

/**
 * ?vista=tarjeta (&origen=lado|hoja): la tarjeta contextual de F2 sobre la escena con el HUD, como en
 * mundo/04, mundo/03 y ui/01. `[E] Inspect` la abre y `Back` la cierra, para ver la entrada y la salida.
 */
function TarjetaEscena({ origen }: { origen: OrigenTarjeta }) {
  const { t } = useT();
  const [abierta, setAbierta] = useState(true);
  const nada = () => {};
  const estado = { ...partidaDorada(), recursos: { energia: 70, soporte_vital: 80, blindaje: 60 }, efectosPendientes: [] };
  return (
    <div className="mu-escena">
      <HudBase estado={estado} objetivo={{ labelKey: "ui.comun.muestrario.objetivo" }} panelAbierto={abierta}
        mundo={{ onTripulacion: nada, onMapa: nada, camara: "tercera", onCamara: nada, interaccion: abierta ? undefined : { labelKey: "ui.comun.muestrario.inspeccionar", onUsar: () => setAbierta(true) } }} />
      <TarjetaContextual abierta={abierta} origen={origen} titulo={t("ui.comun.retrato.ingeniera.nombre")} bajada={t("ui.comun.muestrario.tarjeta.bajada")}
        figura={<Retrato persona="ingeniera" expresion="feliz" tam={84} />} extra={<ChipPausa />}
        acciones={<><FacetButton variant="primary" icon="check" labelKey="ui.comun.muestrario.colocar_panel" onClick={() => setAbierta(false)} /><FacetButton labelKey="ui.comun.atras" onClick={() => setAbierta(false)} /></>}>
        <BarraSeccion tituloKey="ui.paso.4.modulo.panel_solar" />
        <CostRow inmediato={{ energia: -6, soporte_vital: -3 }} retrasado={{ energia: 14 }} />
      </TarjetaContextual>
    </div>
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
        {vista === "globo" && <GloboEscena />}
        {vista === "retratos" && <Retratos />}
        {vista === "paneles" && <main className="muestrario"><PanelesE7 /></main>}
        {vista === "hud" && <HudEscena />}
        {vista === "tarjeta" && <TarjetaEscena origen={(params.get("origen") as OrigenTarjeta | null) ?? "auto"} />}
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
