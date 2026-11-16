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
import { Transicion } from "./componentes/Transicion.js";
import { MundoBase } from "./pantallas/MundoBase.js";
import type { TemaPregunta } from "@solar-shield/agents";
import { MISION_JEZERO } from "@solar-shield/missions";
import { Acceso, type SesionJugador } from "./componentes/Acceso.js";
import { cerrarSesionCuenta } from "./juego/cuenta.js";
import { useProgresoCuenta } from "./juego/useProgresoCuenta.js";
import { FacetButton } from "./componentes/base/FacetButton.js";
import { cargarAjustes, guardarAjustes, type CalidadGrafica } from "./juego/ajustes.js";
import { almacenDelNavegador } from "./juego/guardado.js";
import { inicial, reducir } from "./juego/reductor.js";
import { tocar } from "./juego/sonido.js";

/** Módulos que tienen pregunta de Iris nivel 2 al colocarlos. */
const TEMAS_IRIS: readonly Equipment[] = ["panel_solar", "reciclador_agua", "invernadero", "escudo"];

export function App() {
  const [sesion, setSesion] = useState<SesionJugador|null>(null);
  // Idioma y sonido se recuerdan en el navegador (juego/ajustes.ts); inglés es la base.
  const [ajustes, setAjustes] = useState(() => cargarAjustes(almacenDelNavegador(), {
    idiomaNavegador: navigator.language,
    prefiereMovimientoReducido: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  useEffect(() => { guardarAjustes(almacenDelNavegador(), ajustes); }, [ajustes]);
  return (
    <IdiomaContext.Provider value={ajustes.idioma}>
      {sesion === null ? <Acceso idioma={ajustes.idioma} onIdioma={idioma=>setAjustes(a=>({...a,idioma}))} onEntrar={setSesion} /> : <Pantalla key={sesion.usuario??"invitado"} sesion={sesion} onSalir={()=>setSesion(null)} idioma={ajustes.idioma} setIdioma={(idioma) => setAjustes((a) => ({ ...a, idioma }))}
        sonido={ajustes.sonido} setSonido={(sonido) => setAjustes((a) => ({ ...a, sonido }))}
        grafica={{ calidad: ajustes.calidad, movimientoReducido: ajustes.movimientoReducido,
          onCalidad: (calidad) => setAjustes((a) => (a.calidad === calidad ? a : { ...a, calidad })) }} />}
    </IdiomaContext.Provider>
  );
}

function Pantalla({ sesion, onSalir, idioma, setIdioma, sonido, setSonido, grafica }: {
  sesion: SesionJugador; onSalir(): void;
  idioma: Idioma; setIdioma: (i: Idioma) => void;
  sonido: boolean; setSonido: (s: boolean) => void;
  /** Ajustes guardados de la escena: la calidad que propone la escena se recuerda. */
  grafica: { calidad: CalidadGrafica; movimientoReducido: boolean; onCalidad(c: CalidadGrafica): void };
}) {
  const { t } = useT();
  const [j, enviar] = useReducer(reducir, undefined, inicial);
  // La cuenta carga desde D1. El invitado mantiene su partida solo durante esta visita.
  const [guardada, setGuardada] = useState(sesion.progreso);
  const {estado:estadoGuardado,guardar} = useProgresoCuenta(sesion.usuario,j);
  const [errorSalir,setErrorSalir] = useState(false);
  const [saliendo,setSaliendo] = useState(false);
  useEffect(()=>{if(j.fase==='final')setGuardada(null);},[j.fase]);
  useEffect(()=>{
    if(sesion.usuario || j.fase==='inicio' || j.fase==='final')return;
    const avisar=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};
    window.addEventListener('beforeunload',avisar);
    return ()=>window.removeEventListener('beforeunload',avisar);
  },[sesion.usuario,j.fase]);
  const salir=async()=>{
    if(saliendo)return;
    if(!sesion.usuario && j.fase!=='inicio' && j.fase!=='final' && !window.confirm(t('ui.cuenta.invitado.salir')))return;
    setErrorSalir(false);
    setSaliendo(true);
    if(sesion.usuario){
      if(!await guardar()){setSaliendo(false);return;}
      if(!await cerrarSesionCuenta()){setErrorSalir(true);setSaliendo(false);return;}
    }
    onSalir();
  };
  const [velocidad, setVelocidad] = useState(1);
  const enBase = j.fase === "base";
  // E5 a E7 comparten un solo mundo 3D (MundoBase): cambiar de fase no vuelve a montar la escena.
  const enMundo = j.fase === "modulos" || enBase || j.fase === "tormenta";
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

  const reloj = enBase ? { velocidad, onPausa: () => enviar({ tipo: "pausa", pausado: !j.estado.pausado }), onVelocidad: setVelocidad } : undefined;
  const objetivo = j.fase === "modulos" ? { labelKey: "ui.comun.hud.objetivo.modulos", vars: { n: MISION_JEZERO.modulosAColocar } }
    : { labelKey: j.fase === "tormenta" ? "ui.comun.hud.objetivo.tormenta" : "ui.comun.hud.objetivo.base" };

  return (
    <div className={enMundo ? "app app-mundo" : "app"}>
      <aside className="cuenta-barra" aria-label={t('ui.cuenta.panel')}>
        <p>{sesion.usuario?t('ui.cuenta.bienvenida',{usuario:sesion.usuario}):t('ui.cuenta.invitado.activo')}</p>
        {sesion.usuario && <p role="status" aria-label={t("ui.cuenta.guardado.etiqueta")}>{t(estadoGuardado)}</p>}
        {errorSalir && <p role="alert">{t("ui.cuenta.error.salir")}</p>}
        <FacetButton labelKey={sesion.usuario?'ui.cuenta.salir':'ui.cuenta.volver'} busy={saliendo} onClick={()=>void salir()} />
      </aside>
      {/* En la base el HUD lo pone la pantalla, que es dueña de la fila de abajo (Crew, Map, [E], [V]). */}
      {(j.fase === "modulos" || j.fase === "tormenta") && <HudBase estado={j.estado} ultimas={null} objetivo={objetivo} />}

      <main>
        {enMundo ? (
          <MundoBase fase={j.fase as "modulos" | "base" | "tormenta"} estado={j.estado} colocados={j.colocados}
            calidad={grafica.calidad} movimientoReducido={grafica.movimientoReducido} onCalidad={grafica.onCalidad}>
            <Transicion clave={j.fase}>
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
                <PantallaBase estado={j.estado} colocados={j.colocados} ultimas={j.ultimas} hud={{ reloj }}
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
            {j.fase === "sitio" && <PantallaSitio estado={j.estado} onElegir={(s) => { tocar("confirmar", sonido); enviar({ tipo: "sitio", sitio: s }); }} />}
            {j.fase === "final" && <PantallaFinal estado={j.estado} onOtra={() => enviar({ tipo: "nueva" })} />}
          </Transicion>
        )}
        {creditos && <Creditos onCerrar={() => setCreditos(false)} />}
      </main>
      {/* El aviso de proyecto no oficial va en la portada, la órbita, el sitio, los créditos y el final;
          durante el juego en la base no le quita una fila al mundo. */}
      {!enMundo && <footer>{t("ui.aviso.nasa")}</footer>}
    </div>
  );
}
