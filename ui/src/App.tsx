import { useEffect, useReducer, useState } from "react";
import type { Action, Equipment, GameState } from "@solar-shield/contracts";
import {
  aplicarAccion,
  avanzarTick,
  novedades,
  partidaDorada,
  pausar,
  telemetriaPendiente,
  tormentaActiva,
  type Novedades,
  type PuntajeSitio,
} from "@solar-shield/engine";
import { Hud } from "./componentes/Hud.js";
import { Tripulacion } from "./componentes/Tripulacion.js";
import { describirAccion } from "./componentes/Dialogos.js";
import { IdiomaContext, useT, type Idioma } from "./i18n.js";
import { ColocarModulos } from "./pantallas/ColocarModulos.js";
import { ElegirSitio } from "./pantallas/ElegirSitio.js";
import { Final } from "./pantallas/Final.js";
import { Satelite } from "./pantallas/Satelite.js";
import { Tormenta } from "./pantallas/Tormenta.js";

type Fase = "inicio" | "satelite" | "sitio" | "modulos" | "base" | "tormenta" | "final";

interface Juego {
  fase: Fase;
  estado: GameState;
  colocados: Equipment[];
  sitio: PuntajeSitio | null;
  ultimas: Novedades | null;
  tormentaVista: boolean;
}

type Evento =
  | { tipo: "nueva" }
  | { tipo: "fase"; fase: Fase }
  | { tipo: "accion"; accion: Action }
  | { tipo: "acciones"; acciones: Action[] }
  | { tipo: "tick" }
  | { tipo: "pausa"; pausado: boolean }
  | { tipo: "sitio"; sitio: PuntajeSitio }
  | { tipo: "modulo"; modulo: Equipment };

function inicial(): Juego {
  return { fase: "inicio", estado: partidaDorada(), colocados: [], sitio: null, ultimas: null, tormentaVista: false };
}

function reducir(j: Juego, e: Evento): Juego {
  switch (e.tipo) {
    case "nueva": return inicial();
    case "fase": return { ...j, fase: e.fase };
    case "sitio": return { ...j, sitio: e.sitio, fase: "modulos" };
    case "modulo": {
      const estado = aplicarAccion(j.estado, { tipo: "colocar_modulo", modulo: e.modulo });
      return { ...j, estado, colocados: [...j.colocados, e.modulo] };
    }
    case "accion": return { ...j, estado: aplicarAccion(j.estado, e.accion) };
    case "acciones": {
      let s = j.estado;
      for (const a of e.acciones) s = aplicarAccion(s, a);
      return { ...j, estado: pausar(s, false), fase: "base" };
    }
    case "pausa": return { ...j, estado: pausar(j.estado, e.pausado) };
    case "tick": {
      if (j.estado.pausado || j.estado.resultado !== "en_curso") return j;
      const sig = avanzarTick(j.estado);
      const n = novedades(j.estado, sig);
      if (sig.resultado !== "en_curso") return { ...j, estado: sig, ultimas: n, fase: "final" };
      if (n.tormentaLlego && !j.tormentaVista) return { ...j, estado: pausar(sig, true), ultimas: n, fase: "tormenta", tormentaVista: true };
      return { ...j, estado: n.pausar ? pausar(sig, true) : sig, ultimas: n };
    }
  }
}

export function App() {
  const [idioma, setIdioma] = useState<Idioma>(() => (navigator.language.startsWith("es") ? "es" : "en"));
  return (
    <IdiomaContext.Provider value={idioma}>
      <Pantalla idioma={idioma} setIdioma={setIdioma} />
    </IdiomaContext.Provider>
  );
}

function Pantalla({ idioma, setIdioma }: { idioma: Idioma; setIdioma: (i: Idioma) => void }) {
  const { t } = useT();
  const [j, enviar] = useReducer(reducir, undefined, inicial);
  const [velocidad, setVelocidad] = useState(1);
  const enBase = j.fase === "base";

  // Reloj fijo: un tick cada 4 s a 1x. El motor decide todo; ui solo dispara el tick.
  useEffect(() => {
    if (!enBase || j.estado.pausado) return;
    const id = setInterval(() => enviar({ tipo: "tick" }), 4000 / velocidad);
    return () => clearInterval(id);
  }, [enBase, j.estado.pausado, velocidad]);

  useEffect(() => { document.documentElement.lang = idioma; }, [idioma]);

  const tele = telemetriaPendiente(j.estado);
  const accion = (a: Action) => enviar({ tipo: "accion", accion: a });

  return (
    <div className="app">
      <header className="barra">
        <span className="titulo">🛡️ {t("ui.titulo")}</span>
        {enBase && (
          <>
            <span>{t("ui.dia", { dia: j.estado.dia })} · {t("ui.tick", { tick: j.estado.tick })}</span>
            <button className="secundario" onClick={() => enviar({ tipo: "pausa", pausado: !j.estado.pausado })} aria-pressed={j.estado.pausado}>
              {j.estado.pausado ? `▶ ${t("ui.reanudar")}` : `⏸ ${t("ui.pausa")}`}
            </button>
            <label>{t("ui.velocidad")} <select value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))}><option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option></select></label>
          </>
        )}
        <label>{t("ui.idioma")} <select value={idioma} onChange={(e) => setIdioma(e.target.value as Idioma)}><option value="en">English</option><option value="es">Español</option></select></label>
      </header>

      <main className={enBase ? "juego" : ""}>
        {j.fase === "inicio" && (
          <section className="tarjeta columna">
            <h1>{t("ui.titulo")}</h1>
            <p>{t("ui.subtitulo")}</p>
            <div><button onClick={() => enviar({ tipo: "fase", fase: "satelite" })}>{t("ui.empezar")}</button></div>
          </section>
        )}
        {j.fase === "satelite" && <Satelite estado={j.estado} onContinuar={() => enviar({ tipo: "fase", fase: "sitio" })} />}
        {j.fase === "sitio" && <ElegirSitio estado={j.estado} onElegir={(s) => enviar({ tipo: "sitio", sitio: s })} />}
        {j.fase === "modulos" && (
          <>
            <Hud estado={j.estado} />
            <ColocarModulos colocados={j.colocados} onColocar={(m) => enviar({ tipo: "modulo", modulo: m })} onListo={() => enviar({ tipo: "fase", fase: "base" })} />
          </>
        )}
        {j.fase === "tormenta" && (
          <>
            <Hud estado={j.estado} />
            <Tormenta estado={j.estado} onDecidir={(as) => enviar({ tipo: "acciones", acciones: as })} />
          </>
        )}
        {enBase && (
          <>
            <div className="columna">
              <Hud estado={j.estado} />
              <section className="tarjeta columna" aria-label={t("ui.acciones.titulo")}>
                <h2>{t("ui.acciones.titulo")}</h2>
                <p><span className="etiqueta">{t(`ui.iris.estado.${j.estado.iaBase}`)}</span></p>
                <div className="fila">
                  <button className="secundario" onClick={() => accion({ tipo: "esperar" })}>{t("ui.accion.esperar")}</button>
                  <button className="secundario" onClick={() => accion({ tipo: "refugiarse" })}>{t("ui.accion.refugiarse")}</button>
                  <button className="secundario" onClick={() => accion({ tipo: "subir_escudo", nivel: 1 })}>{t("ui.accion.subir_escudo")}</button>
                  <button className="secundario" onClick={() => accion({ tipo: "salida_exterior", objetivo: "panel_solar" })}>{t("ui.accion.salida_exterior")}</button>
                  {j.estado.iaBase === "danada" && <button className="peligro" onClick={() => accion({ tipo: "reparar", equipo: "ia_base" })}>{t("ui.accion.reparar_ia")}</button>}
                  {tormentaActiva(j.estado) && !tele && <button className="solar" onClick={() => accion({ tipo: "enviar_telemetria" })}>📡 {t("ui.paso.7.telemetria")}</button>}
                </div>
                {tele && <p>📡 {t("ui.paso.7.llegando", { ticks: tele.ticksRestantes })}</p>}
                {j.estado.pausado && j.ultimas && (
                  <div className="tarjeta alerta" role="status">
                    {j.ultimas.malaSuerte.map((c, i) => <p key={`m${i}`}>⚠ {t("ui.novedad.mala_suerte")}: {t(c.descripcionKey)} <span className="delta menos">{c.delta}</span></p>)}
                    {j.ultimas.iaCambio && <p>◉ {t(`ui.iris.estado.${j.ultimas.iaCambio.a}`)}</p>}
                    {j.ultimas.efectosLlegaron.map((c, i) => <p key={`e${i}`}>✓ {t("ui.novedad.efecto")}: {t(c.descripcionKey)} <span className="delta mas">+{c.delta}</span></p>)}
                    <button onClick={() => enviar({ tipo: "pausa", pausado: false })}>▶ {t("ui.reanudar")}</button>
                  </div>
                )}
                <details>
                  <summary>{t("ui.paso.8.titulo")}</summary>
                  <ul className="registro">
                    {[...j.estado.causas].reverse().slice(0, 30).map((c, i) => (
                      <li key={i}>{t("ui.tick", { tick: c.tick })} · {t(c.descripcionKey)}{c.accion && c.descripcionKey.startsWith("causa.") ? ` (${describirAccion(c.accion, t)})` : ""} {c.delta !== undefined && <span className={`delta ${c.delta > 0 ? "mas" : "menos"}`}>{c.delta > 0 ? "+" : ""}{c.delta}</span>}</li>
                    ))}
                  </ul>
                </details>
              </section>
            </div>
            <Tripulacion estado={j.estado} onAccion={accion} />
          </>
        )}
        {j.fase === "final" && <Final estado={j.estado} onOtra={() => enviar({ tipo: "nueva" })} />}
      </main>
      <footer>{t("ui.aviso.nasa")}</footer>
    </div>
  );
}
