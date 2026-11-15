import { useEffect, useReducer, useRef, useState } from "react";
import type { Action, Equipment } from "@solar-shield/contracts";
import { HudBase } from "./componentes/HudBase.js";
import { IdiomaContext, useT, type Idioma } from "./i18n.js";
import { PantallaSitio } from "./pantallas/PantallaSitio.js";
import { PantallaModulos } from "./pantallas/PantallaModulos.js";
import { PantallaFinal } from "./pantallas/PantallaFinal.js";
import { PantallaOrbita } from "./pantallas/PantallaOrbita.js";
import { PantallaBase } from "./pantallas/PantallaBase.js";
import { PantallaTormenta } from "./pantallas/PantallaTormenta.js";
import { PreguntaDeIris } from "./componentes/PreguntaDeIris.js";
import { Portada } from "./componentes/Portada.js";
import { Intro } from "./componentes/Intro.js";
import { Carga } from "./componentes/Carga.js";
import { Creditos } from "./componentes/Creditos.js";
import type { TemaPregunta } from "@solar-shield/agents";
import { MISION_JEZERO } from "@solar-shield/missions";
import { cargarAjustes, guardarAjustes } from "./juego/ajustes.js";
import { almacenDelNavegador, cargarPartida, guardarPartida } from "./juego/guardado.js";
import { inicial, reducir } from "./juego/reductor.js";
import { tocar } from "./juego/sonido.js";

/** Módulos que tienen pregunta de Iris nivel 2 al colocarlos. */
const TEMAS_IRIS: readonly Equipment[] = ["panel_solar", "reciclador_agua", "invernadero", "escudo"];

export function App() {
  // Idioma y sonido se recuerdan en el navegador (juego/ajustes.ts); inglés es la base.
  const [ajustes, setAjustes] = useState(() => cargarAjustes(almacenDelNavegador(), {
    idiomaNavegador: navigator.language,
    prefiereMovimientoReducido: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  useEffect(() => { guardarAjustes(almacenDelNavegador(), ajustes); }, [ajustes]);
  return (
    <IdiomaContext.Provider value={ajustes.idioma}>
      <Pantalla idioma={ajustes.idioma} setIdioma={(idioma) => setAjustes((a) => ({ ...a, idioma }))}
        sonido={ajustes.sonido} setSonido={(sonido) => setAjustes((a) => ({ ...a, sonido }))} />
    </IdiomaContext.Provider>
  );
}

function Pantalla({ idioma, setIdioma, sonido, setSonido }: {
  idioma: Idioma; setIdioma: (i: Idioma) => void;
  sonido: boolean; setSonido: (s: boolean) => void;
}) {
  const { t } = useT();
  const [j, enviar] = useReducer(reducir, undefined, inicial);
  // Partida guardada en este navegador: habilita "Continue" en la portada.
  const [guardada, setGuardada] = useState(() => cargarPartida(almacenDelNavegador()));
  useEffect(() => {
    guardarPartida(almacenDelNavegador(), j);
    if (j.fase === "inicio") setGuardada(cargarPartida(almacenDelNavegador()));
  }, [j]);
  const [velocidad, setVelocidad] = useState(1);
  const enBase = j.fase === "base";
  // Inicio en tres momentos (ESCENAS E0 a E2): portada, intro de 4 viñetas y carga. Después, la órbita.
  const [inicio, setInicio] = useState<"portada" | "intro" | "carga">("portada");
  const [creditos, setCreditos] = useState(false);
  // Al encender el sonido suena una nota: el jugador oye que funciona.
  const alternarSonido = () => { tocar("toque", !sonido); setSonido(!sonido); };
  // Avisos sonoros de lo que pasa en la partida: llega la tormenta, se gana o se pierde.
  const faseAnterior = useRef(j.fase);
  useEffect(() => {
    if (faseAnterior.current === j.fase) return;
    faseAnterior.current = j.fase;
    if (j.fase === "tormenta") tocar("alerta", sonido);
    else if (j.fase === "final") tocar(j.estado.resultado === "exito" ? "exito" : "fallo", sonido);
  }, [j.fase, j.estado.resultado, sonido]);
  useEffect(() => { if (j.fase === "inicio") setInicio("portada"); }, [j.fase]);
  const empezarMision = () => enviar({ tipo: "fase", fase: "satelite" });
  // La carga es un respiro corto entre la intro y la órbita; se puede saltar con "Skip".
  useEffect(() => {
    if (j.fase !== "inicio" || inicio !== "carga") return;
    const id = setTimeout(empezarMision, 1800);
    return () => clearTimeout(id);
  }, [j.fase, inicio]);

  // Reloj fijo: un tick cada 4 s a 1x. El motor decide todo; ui solo dispara el tick.
  useEffect(() => {
    if (!enBase || j.estado.pausado) return;
    const id = setInterval(() => enviar({ tipo: "tick" }), 4000 / velocidad);
    return () => clearInterval(id);
  }, [enBase, j.estado.pausado, velocidad]);

  useEffect(() => { document.documentElement.lang = idioma; }, [idioma]);

  const accion = (a: Action) => { tocar("confirmar", sonido); enviar({ tipo: "accion", accion: a }); };
  const continuar = () => { if (guardada) { tocar("confirmar", sonido); enviar({ tipo: "restaurar", juego: guardada }); } };

  return (
    <div className={enBase ? "app app-base" : "app"}>
      {(j.fase === "modulos" || enBase || j.fase === "tormenta") && (
        <HudBase estado={j.estado} ultimas={enBase ? j.ultimas : null}
          objetivo={j.fase === "modulos" ? { labelKey: "ui.comun.hud.objetivo.modulos", vars: { n: MISION_JEZERO.modulosAColocar } } : { labelKey: j.fase === "tormenta" ? "ui.comun.hud.objetivo.tormenta" : "ui.comun.hud.objetivo.base" }}
          reloj={enBase ? { velocidad, onPausa: () => enviar({ tipo: "pausa", pausado: !j.estado.pausado }), onVelocidad: setVelocidad } : undefined} />
      )}

      <main>
        {j.fase === "inicio" && inicio === "portada" && (
          <Portada idioma={idioma} onIdioma={setIdioma} sonido={sonido} onSonido={alternarSonido}
            puedeContinuar={guardada !== null} onEmpezar={() => setInicio("intro")} onContinuar={continuar} onCreditos={() => setCreditos(true)} />
        )}
        {j.fase === "inicio" && inicio === "intro" && <Intro onTerminar={() => setInicio("carga")} />}
        {j.fase === "inicio" && inicio === "carga" && <Carga consejo={0} sonido={sonido} onSonido={alternarSonido} onSaltar={empezarMision} />}
        {creditos && <Creditos onCerrar={() => setCreditos(false)} />}
        {j.fase === "satelite" && <PantallaOrbita estado={j.estado} onContinuar={() => enviar({ tipo: "fase", fase: "sitio" })} />}
        {j.fase === "sitio" && <PantallaSitio estado={j.estado} onElegir={(s) => { tocar("confirmar", sonido); enviar({ tipo: "sitio", sitio: s }); }} />}
        {j.fase === "modulos" && (
          <>
            <PantallaModulos estado={j.estado} colocados={j.colocados} onColocar={(m) => { tocar("confirmar", sonido); enviar({ tipo: "modulo", modulo: m }); }} onListo={() => enviar({ tipo: "fase", fase: "base" })} />
            {TEMAS_IRIS.find((m) => m === j.colocados.at(-1)) && <PreguntaDeIris key={j.colocados.length} tema={j.colocados.at(-1) as TemaPregunta} nivel={j.estado.iaBase} />}
          </>
        )}
        {j.fase === "tormenta" && (
          <PantallaTormenta estado={j.estado} colocados={j.colocados} registro={j.registro} onSeguir={() => enviar({ tipo: "seguir" })}
            onDecidir={(previas, opcionId) => { tocar("confirmar", sonido); enviar({ tipo: "dilema", previas, opcionId }); }} />
        )}
        {enBase && (
          <PantallaBase estado={j.estado} colocados={j.colocados} ultimas={j.ultimas} onAccion={accion} onReanudar={() => enviar({ tipo: "pausa", pausado: false })} />
        )}
        {j.fase === "final" && <PantallaFinal estado={j.estado} onOtra={() => enviar({ tipo: "nueva" })} />}
      </main>
      <footer>{t("ui.aviso.nasa")}</footer>
    </div>
  );
}
