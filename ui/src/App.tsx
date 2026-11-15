import { useEffect, useReducer, useState } from "react";
import type { Action, Equipment, GameState } from "@solar-shield/contracts";
import {
  aplicarAccion,
  aterrizar,
  avanzarTick,
  elegirDilema,
  novedades,
  partidaDorada,
  pausar,
  type Novedades,
  type PuntajeSitio,
} from "@solar-shield/engine";
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

/** Módulos que tienen pregunta de Iris nivel 2 al colocarlos. */
const TEMAS_IRIS: readonly Equipment[] = ["panel_solar", "reciclador_agua", "invernadero", "escudo"];

type Fase = "inicio" | "satelite" | "sitio" | "modulos" | "base" | "tormenta" | "final";

interface Juego {
  fase: Fase;
  estado: GameState;
  colocados: Equipment[];
  sitio: PuntajeSitio | null;
  ultimas: Novedades | null;
  tormentaVista: boolean;
  /** El estado de antes de la decisión de la tormenta: mientras exista se muestra "Decision recorded" (ui/04 panel 04). */
  registro: GameState | null;
}

type Evento =
  | { tipo: "nueva" }
  | { tipo: "fase"; fase: Fase }
  | { tipo: "accion"; accion: Action }
  | { tipo: "dilema"; previas: Action[]; opcionId: string }
  | { tipo: "seguir" }
  | { tipo: "tick" }
  | { tipo: "pausa"; pausado: boolean }
  | { tipo: "sitio"; sitio: PuntajeSitio }
  | { tipo: "modulo"; modulo: Equipment };

function inicial(): Juego {
  return { fase: "inicio", estado: partidaDorada(), colocados: [], sitio: null, ultimas: null, tormentaVista: false, registro: null };
}

function reducir(j: Juego, e: Evento): Juego {
  switch (e.tipo) {
    case "nueva": return inicial();
    case "fase": return { ...j, fase: e.fase };
    // Paso 3: el motor cobra el costo del sitio una sola vez (MISION_JEZERO.sitiosCandidatos).
    case "sitio": return { ...j, estado: aterrizar(j.estado, e.sitio.id), sitio: e.sitio, fase: "modulos" };
    case "modulo": {
      const estado = aplicarAccion(j.estado, { tipo: "colocar_modulo", modulo: e.modulo });
      return { ...j, estado, colocados: [...j.colocados, e.modulo] };
    }
    case "accion": return { ...j, estado: aplicarAccion(j.estado, e.accion) };
    // Paso 6: lo verificado con la experta (si lo hubo) y luego la salida del dilema, con el extra del invernadero.
    case "dilema": {
      let s = j.estado;
      for (const a of e.previas) s = aplicarAccion(s, a);
      const estado = elegirDilema(s, e.opcionId);
      return estado === s ? j : { ...j, estado, registro: j.estado };
    }
    case "seguir": return { ...j, estado: pausar(j.estado, false), registro: null, fase: "base" };
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
  // Inicio en tres momentos (ESCENAS E0 a E2): portada, intro de 4 viñetas y carga. Después, la órbita.
  const [inicio, setInicio] = useState<"portada" | "intro" | "carga">("portada");
  const [creditos, setCreditos] = useState(false);
  const [sonido, setSonido] = useState(false);
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

  const accion = (a: Action) => enviar({ tipo: "accion", accion: a });

  return (
    <div className={enBase ? "app app-base" : "app"}>
      {(j.fase === "modulos" || enBase || j.fase === "tormenta") && (
        <HudBase estado={j.estado} ultimas={enBase ? j.ultimas : null}
          reloj={enBase ? { velocidad, onPausa: () => enviar({ tipo: "pausa", pausado: !j.estado.pausado }), onVelocidad: setVelocidad } : undefined} />
      )}

      <main>
        {j.fase === "inicio" && inicio === "portada" && (
          <Portada idioma={idioma} onIdioma={setIdioma} sonido={sonido} onSonido={() => setSonido((x) => !x)}
            puedeContinuar={false} onEmpezar={() => setInicio("intro")} onContinuar={empezarMision} onCreditos={() => setCreditos(true)} />
        )}
        {j.fase === "inicio" && inicio === "intro" && <Intro onTerminar={() => setInicio("carga")} />}
        {j.fase === "inicio" && inicio === "carga" && <Carga consejo={0} sonido={sonido} onSonido={() => setSonido((x) => !x)} onSaltar={empezarMision} />}
        {creditos && <Creditos onCerrar={() => setCreditos(false)} />}
        {j.fase === "satelite" && <PantallaOrbita estado={j.estado} onContinuar={() => enviar({ tipo: "fase", fase: "sitio" })} />}
        {j.fase === "sitio" && <PantallaSitio estado={j.estado} onElegir={(s) => enviar({ tipo: "sitio", sitio: s })} />}
        {j.fase === "modulos" && (
          <>
            <PantallaModulos estado={j.estado} colocados={j.colocados} onColocar={(m) => enviar({ tipo: "modulo", modulo: m })} onListo={() => enviar({ tipo: "fase", fase: "base" })} />
            {TEMAS_IRIS.find((m) => m === j.colocados.at(-1)) && <PreguntaDeIris key={j.colocados.length} tema={j.colocados.at(-1) as TemaPregunta} nivel={j.estado.iaBase} />}
          </>
        )}
        {j.fase === "tormenta" && (
          <PantallaTormenta estado={j.estado} colocados={j.colocados} registro={j.registro} onSeguir={() => enviar({ tipo: "seguir" })}
            onDecidir={(previas, opcionId) => enviar({ tipo: "dilema", previas, opcionId })} />
        )}
        {enBase && (
          <PantallaBase estado={j.estado} ultimas={j.ultimas} onAccion={accion} onReanudar={() => enviar({ tipo: "pausa", pausado: false })} />
        )}
        {j.fase === "final" && <PantallaFinal estado={j.estado} onOtra={() => enviar({ tipo: "nueva" })} />}
      </main>
      <footer>{t("ui.aviso.nasa")}</footer>
    </div>
  );
}
