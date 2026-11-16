import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Action, Equipment } from "@solar-shield/contracts";
import { HudBase, PROGRESO_INICIAL, type ProgresoHud } from "./componentes/HudBase.js";
import { IdiomaContext, useT, type Idioma } from "./i18n.js";
import { PantallaSitio } from "./pantallas/PantallaSitio.js";
import { PantallaModulos } from "./pantallas/PantallaModulos.js";
import { PantallaFinal } from "./pantallas/PantallaFinal.js";
import { PantallaOrbita } from "./pantallas/PantallaOrbita.js";
import { PantallaBase } from "./pantallas/PantallaBase.js";
import { PantallaTormenta } from "./pantallas/PantallaTormenta.js";
import { PreguntaDeIris } from "./componentes/PreguntaDeIris.js";
import { Portada } from "./componentes/Portada.js";
import "./aviso.css";
import { Intro } from "./componentes/Intro.js";
import { Carga } from "./componentes/Carga.js";
import { Llegada } from "./componentes/Llegada.js";
import { Creditos } from "./componentes/Creditos.js";
import { Transicion } from "./componentes/Transicion.js";
import { MundoBase } from "./pantallas/MundoBase.js";
import { MEMORIA_INICIAL, type MemoriaConversacion, type TemaPregunta } from "@solar-shield/agents";
import { MISION_JEZERO } from "@solar-shield/missions";
import { cargarAjustes, guardarAjustes, type CalidadGrafica } from "./juego/ajustes.js";
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
        sonido={ajustes.sonido} setSonido={(sonido) => setAjustes((a) => ({ ...a, sonido }))}
        grafica={{ calidad: ajustes.calidad, movimientoReducido: ajustes.movimientoReducido,
          onCalidad: (calidad) => setAjustes((a) => (a.calidad === calidad ? a : { ...a, calidad })) }} />
    </IdiomaContext.Provider>
  );
}

function Pantalla({ idioma, setIdioma, sonido, setSonido, grafica }: {
  idioma: Idioma; setIdioma: (i: Idioma) => void;
  sonido: boolean; setSonido: (s: boolean) => void;
  /** Ajustes guardados de la escena: la calidad que propone la escena se recuerda. */
  grafica: { calidad: CalidadGrafica; movimientoReducido: boolean; onCalidad(c: CalidadGrafica): void };
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
  // HUD progresivo (E3): qué partes ya aparecieron en esta partida. Una partida nueva empieza sin ellas;
  // una partida retomada con "Continue" las trae todas (el niño ya las conoció).
  const [progreso, setProgreso] = useState<ProgresoHud>(PROGRESO_INICIAL);
  // #377: lo que la tripulación recuerda de esta partida. Vive mientras dura la sesión; guardarlo con la
  // partida es del frente A (juego/guardado, #360). Una partida nueva empieza sin recuerdos.
  const [memoria, setMemoria] = useState<MemoriaConversacion>(MEMORIA_INICIAL);
  const [vistos, setVistos] = useState<readonly string[]>([]);
  const avanzarHud = (p: Partial<ProgresoHud>) => setProgreso((a) => (Object.entries(p).every(([k, v]) => a[k as keyof ProgresoHud] === v) ? a : { ...a, ...p }));
  const enBase = j.fase === "base";
  // E5 a E7 comparten un solo mundo 3D (MundoBase): cambiar de fase no vuelve a montar la escena.
  // E8 (inicio/04): al elegir el sitio, "Arriving at Jezero" y, ya en la base, "Ready to explore". Solo en una
  // partida nueva: "Continue" entra directo. Es flujo de la interfaz: el aterrizaje ya lo aplicó el reductor.
  const [entrada, setEntrada] = useState<"llegada" | "listo" | null>(null);
  const llegando = j.fase === "modulos" && entrada === "llegada";
  const seguirLlegada = useCallback(() => setEntrada((e) => (e === "llegada" ? "listo" : e)), []);
  const enMundo = (j.fase === "modulos" && !llegando) || enBase || j.fase === "tormenta";
  // Inicio en tres momentos (ESCENAS E0 a E2): portada, intro de 4 viñetas y carga. Después, la órbita.
  const [inicio, setInicio] = useState<"portada" | "intro" | "carga">("portada");
  const [creditos, setCreditos] = useState(false);
  // Al encender el sonido suena una nota: el jugador oye que funciona.
  const alternarSonido = () => { tocar("toque", !sonido); setSonido(!sonido); };
  // Avisos sonoros de lo que pasa en la partida: llega la tormenta, se gana o se pierde.
  // El aviso del pie comparte la ventana con la pantalla: su alto real se publica en --alto-barra, que portada,
  // intro, carga, órbita, sitio y final descuentan de su alto. Así el documento no se desplaza por el aviso.
  const raiz = useRef<HTMLDivElement>(null);
  const pie = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const caja = raiz.current;
    if (!caja) return;
    const aviso = pie.current;
    if (!aviso) { caja.style.setProperty("--alto-barra", "0px"); return; }
    const medir = () => caja.style.setProperty("--alto-barra", `${Math.ceil(aviso.getBoundingClientRect().height)}px`);
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(aviso);
    return () => observador.disconnect();
  }, [enMundo]);
  const faseAnterior = useRef(j.fase);
  useEffect(() => {
    if (faseAnterior.current === j.fase) return;
    faseAnterior.current = j.fase;
    if (j.fase === "tormenta") tocar("alerta", sonido);
    else if (j.fase === "final") tocar(j.estado.resultado === "exito" ? "exito" : "fallo", sonido);
  }, [j.fase, j.estado.resultado, sonido]);
  useEffect(() => { if (j.fase === "inicio") setInicio("portada"); }, [j.fase]);
  const empezarMision = () => { setProgreso(PROGRESO_INICIAL); setMemoria(MEMORIA_INICIAL); setVistos([]); enviar({ tipo: "fase", fase: "satelite" }); };
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
  const continuar = () => { if (guardada) { tocar("confirmar", sonido); setProgreso({ conversado: true, objetivo: true }); enviar({ tipo: "restaurar", juego: guardada }); } };

  const reloj = enBase ? { velocidad, onPausa: () => enviar({ tipo: "pausa", pausado: !j.estado.pausado }), onVelocidad: setVelocidad } : undefined;
  const objetivo = j.fase === "modulos" ? { labelKey: "ui.comun.hud.objetivo.modulos", vars: { n: MISION_JEZERO.modulosAColocar } }
    : { labelKey: j.fase === "tormenta" ? "ui.comun.hud.objetivo.tormenta" : "ui.comun.hud.objetivo.base" };

  return (
    <div ref={raiz} className={enMundo ? "app app-mundo" : "app"}>
      {/* En la base el HUD lo pone la pantalla, que es dueña de la fila de abajo (Crew, Map, [E], [V]). */}
      {((j.fase === "modulos" && !llegando) || j.fase === "tormenta") && <HudBase estado={j.estado} ultimas={null} objetivo={objetivo} />}

      <main>
        {enMundo ? (
          <MundoBase fase={j.fase as "modulos" | "base" | "tormenta"} estado={j.estado} colocados={j.colocados}
            calidad={grafica.calidad} movimientoReducido={grafica.movimientoReducido} onCalidad={grafica.onCalidad}>
            <Transicion clave={j.fase}>
              {j.fase === "modulos" && (
                <>
                  <PantallaModulos estado={j.estado} colocados={j.colocados} onColocar={(m) => { tocar("confirmar", sonido); enviar({ tipo: "modulo", modulo: m }); }} onListo={() => enviar({ tipo: "fase", fase: "base" })}
                    bienvenida={entrada === "listo" ? { onExplorar: () => setEntrada(null) } : undefined} />
                  {TEMAS_IRIS.find((m) => m === j.colocados.at(-1)) && <PreguntaDeIris key={j.colocados.length} tema={j.colocados.at(-1) as TemaPregunta} nivel={j.estado.iaBase} />}
                </>
              )}
              {j.fase === "tormenta" && (
                <PantallaTormenta estado={j.estado} colocados={j.colocados} registro={j.registro} onSeguir={() => enviar({ tipo: "seguir" })}
                  onDecidir={(previas, opcionId) => { tocar("confirmar", sonido); enviar({ tipo: "dilema", previas, opcionId }); }}
                  onConverso={() => avanzarHud({ conversado: true })} />
              )}
              {enBase && (
                <PantallaBase estado={j.estado} colocados={j.colocados} ultimas={j.ultimas} hud={{ reloj }} progreso={progreso} onProgreso={avanzarHud} memoria={memoria} onMemoria={setMemoria}
                  vistos={vistos} onVisto={(id) => setVistos((v) => (v.includes(id) ? v : [...v, id]))}
                  onAccion={accion} onReanudar={() => enviar({ tipo: "pausa", pausado: false })} />
              )}
            </Transicion>
          </MundoBase>
        ) : (
          <Transicion clave={j.fase === "inicio" ? inicio : j.fase}>
            {j.fase === "inicio" && inicio === "portada" && (
              <Portada idioma={idioma} onIdioma={setIdioma} sonido={sonido} onSonido={alternarSonido}
                puedeContinuar={guardada !== null} onEmpezar={() => setInicio("intro")} onContinuar={continuar} onCreditos={() => setCreditos(true)} />
            )}
            {j.fase === "inicio" && inicio === "intro" && <Intro onTerminar={() => setInicio("carga")} />}
            {j.fase === "inicio" && inicio === "carga" && <Carga consejo={0} sonido={sonido} onSonido={alternarSonido} onSaltar={empezarMision} />}
            {j.fase === "satelite" && <PantallaOrbita estado={j.estado} onContinuar={() => enviar({ tipo: "fase", fase: "sitio" })} />}
            {j.fase === "sitio" && <PantallaSitio estado={j.estado} onElegir={(s) => { tocar("confirmar", sonido); setEntrada("llegada"); enviar({ tipo: "sitio", sitio: s }); }} />}
            {llegando && <Llegada onSeguir={seguirLlegada} />}
            {j.fase === "final" && <PantallaFinal estado={j.estado} onOtra={() => { setProgreso(PROGRESO_INICIAL); setMemoria(MEMORIA_INICIAL); setVistos([]); enviar({ tipo: "nueva" }); }} />}
          </Transicion>
        )}
        {creditos && <Creditos onCerrar={() => setCreditos(false)} />}
      </main>
      {/* El aviso de proyecto no oficial va en la portada, la órbita, el sitio, los créditos y el final;
          durante el juego en la base no le quita una fila al mundo. */}
      {!enMundo && <footer ref={pie} className="aviso-nasa">{t("ui.aviso.nasa")}</footer>}
    </div>
  );
}
