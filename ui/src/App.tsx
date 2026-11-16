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
import { Acceso, type SesionJugador } from "./componentes/Acceso.js";
import { cerrarSesionCuenta } from "./juego/cuenta.js";
import { useProgresoCuenta } from "./juego/useProgresoCuenta.js";
import { FacetButton } from "./componentes/base/FacetButton.js";
import { cargarAjustes, guardarAjustes, type CalidadGrafica, type CamaraJugador } from "./juego/ajustes.js";
import { Menu } from "./componentes/Menu.js";
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
          onCalidad: (calidad) => setAjustes((a) => (a.calidad === calidad ? a : { ...a, calidad })),
          camara: ajustes.camara, onCamara: (camara) => setAjustes((a) => (a.camara === camara ? a : { ...a, camara })) }} />}
    </IdiomaContext.Provider>
  );
}

function Pantalla({ sesion, onSalir, idioma, setIdioma, sonido, setSonido, grafica }: {
  sesion: SesionJugador; onSalir(): void;
  idioma: Idioma; setIdioma: (i: Idioma) => void;
  sonido: boolean; setSonido: (s: boolean) => void;
  /** Ajustes guardados de la escena: la calidad que propone la escena se recuerda. */
  grafica: { calidad: CalidadGrafica; movimientoReducido: boolean; onCalidad(c: CalidadGrafica): void; camara: CamaraJugador; onCamara(c: CamaraJugador): void };
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
  // E4: el menú se abre desde "Settings" en la portada y desde "Menu" en el HUD. No toca la partida.
  const [menu, setMenu] = useState(false);
  const abrirMenu = useCallback(() => setMenu(true), []);
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
      <aside className="cuenta-barra" aria-label={t('ui.cuenta.panel')}>
        <p>{sesion.usuario?t('ui.cuenta.bienvenida',{usuario:sesion.usuario}):t('ui.cuenta.invitado.activo')}</p>
        {sesion.usuario && <p role="status" aria-label={t("ui.cuenta.guardado.etiqueta")}>{t(estadoGuardado)}</p>}
        {errorSalir && <p role="alert">{t("ui.cuenta.error.salir")}</p>}
        <FacetButton labelKey={sesion.usuario?'ui.cuenta.salir':'ui.cuenta.volver'} busy={saliendo} onClick={()=>void salir()} />
      </aside>
      {/* En la base el HUD lo pone la pantalla, que es dueña de la fila de abajo (Crew, Map, [E], [V]). */}
      {((j.fase === "modulos" && !llegando) || j.fase === "tormenta") && <HudBase estado={j.estado} ultimas={null} objetivo={objetivo} onMenu={abrirMenu} />}

      <main>
        {enMundo ? (
          <MundoBase fase={j.fase as "modulos" | "base" | "tormenta"} estado={j.estado} colocados={j.colocados}
            calidad={grafica.calidad} movimientoReducido={grafica.movimientoReducido} onCalidad={grafica.onCalidad}
            camara={grafica.camara} onCamara={grafica.onCamara} bloqueadoFuera={menu}>
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
                <PantallaBase estado={j.estado} colocados={j.colocados} ultimas={j.ultimas} hud={{ reloj, onMenu: abrirMenu }} progreso={progreso} onProgreso={avanzarHud} memoria={memoria} onMemoria={setMemoria}
                  vistos={vistos} onVisto={(id) => setVistos((v) => (v.includes(id) ? v : [...v, id]))}
                  onAccion={accion} onReanudar={() => enviar({ tipo: "pausa", pausado: false })} />
              )}
            </Transicion>
          </MundoBase>
        ) : (
          <Transicion clave={j.fase === "inicio" ? inicio : j.fase}>
            {j.fase === "inicio" && inicio === "portada" && (
              <Portada idioma={idioma} onIdioma={setIdioma} sonido={sonido} onSonido={alternarSonido}
                puedeContinuar={guardada !== null} onEmpezar={() => setInicio("intro")} onContinuar={continuar} onAjustes={abrirMenu} onCreditos={() => setCreditos(true)} />
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
        {menu && (
          <Menu camara={grafica.camara} onCamara={grafica.onCamara} calidad={grafica.calidad} onCalidad={grafica.onCalidad}
            sonido={sonido} onSonido={alternarSonido} idioma={idioma} onIdioma={setIdioma} onCerrar={() => setMenu(false)} />
        )}
      </main>
      {/* El aviso de proyecto no oficial va en la portada, la órbita, el sitio, los créditos y el final;
          durante el juego en la base no le quita una fila al mundo. */}
      {!enMundo && <footer ref={pie} className="aviso-nasa">{t("ui.aviso.nasa")}</footer>}
    </div>
  );
}
