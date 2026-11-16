import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Equipment, GameState } from "@solar-shield/contracts";
import { tormentaActiva } from "@solar-shield/engine";
import type { CamaraEscena, EventoDestino, PosicionJugador } from "../escena/EscenaBase.js";
import type { EntradaTactil } from "../escena/entradaTactil.js";
import { interactivoDeLugar, type ActorId, type Interactivo, type SalaId } from "../escena/frontera.js";
import { INICIO_JUGADOR, LUGARES, lugar } from "../escena/mundo.js";
import { hayGraficos3D } from "../escena/soporte.js";
import { vistaEscena, type FaseVista, type LugarObjetivo } from "../escena/vista.js";
import type { CalidadGrafica } from "../juego/ajustes.js";
import { eventosDeTick } from "../juego/eventos.js";
import { averiaIrisRevelada } from "./lugares.js";
import "./mundo.css";

// Three.js queda en un chunk aparte: no pesa en la primera carga.
const EscenaBase = lazy(() => import("../escena/EscenaBase.js").then((m) => ({ default: m.EscenaBase })));

export type FaseMundo = "modulos" | "base" | "tormenta";

/**
 * Lo que las pantallas E5 a E7 le piden al mundo compartido y lo que el mundo les cuenta. Es la
 * única vía entre las capas (HUD, paneles, hojas) y la escena: ninguna pantalla monta otra escena.
 */
export interface Mundo {
  /** WebGL no está o se perdió: las pantallas siguen igual sobre el respaldo 2D. */
  sin3d: boolean;
  /** Lugar al alcance del jugador, según la escena. */
  cercano: LugarObjetivo | null;
  camara: CamaraEscena;
  alternarCamara(): void;
  /** Destino elegido en el mapa; la escena camina hasta allí y avisa con `onDestino`. */
  destino: LugarObjetivo | null;
  irA(l: LugarObjetivo | null): void;
  /** Gestos táctiles que entrega la escena; null mientras no los entregue. */
  entrada: EntradaTactil | null;
  movimientoReducido: boolean;
  /** La capa de arriba tiene algo abierto (diálogo, confirmación, mapa, hoja): el mundo no se mueve. */
  fijarBloqueado(b: boolean): void;
  /** E5: módulo que se ve "instalando" en su anclaje mientras se elige. */
  fijarInstalando(m: Equipment | null): void;
  /** Lo que hay al alcance (lugar, actor o puerta): lo que ofrece `[E]`. */
  interactivo: Interactivo | null;
  /** Sala donde está el niño; la cambia `[E] Enter`/`Exit` en una puerta. */
  sala: SalaId;
  /** `[E]` desde un botón o el toque de acción: la misma vía que la tecla. */
  usarCercano(): void;
  /** Quién atiende `[E]` en lugares y actores (las puertas las atiende el mundo). Sin nadie, no hace nada. */
  fijarUso(fn: ((i: Interactivo) => void) | null): void;
  /** Quién habla en el diálogo abierto: la escena lo gira hacia el niño. */
  fijarHablando(a: ActorId | null): void;
  /** Lugar adonde guía Iris ahora: la escena lo resalta (`VistaEscena.lugarObjetivo`). */
  fijarObjetivo(l: LugarObjetivo | null): void;
}

const NADA = () => undefined;
const MUNDO_VACIO: Mundo = {
  sin3d: true, cercano: null, interactivo: null, sala: "exterior", usarCercano: NADA, fijarHablando: NADA, camara: "tercera", alternarCamara: NADA, destino: null, irA: NADA, entrada: null,
  movimientoReducido: true, fijarBloqueado: NADA, fijarInstalando: NADA, fijarUso: NADA, fijarObjetivo: NADA,
};
const MundoContexto = createContext<Mundo>(MUNDO_VACIO);
/** Aparte: cambia hasta 5 veces por segundo y solo lo lee el mapa. */
const PosicionContexto = createContext<PosicionJugador>(INICIO_JUGADOR);

export const useMundo = () => useContext(MundoContexto);
export const usePosicionJugador = () => useContext(PosicionContexto);

/**
 * Publica el alto de la hoja inferior en `--hoja-alto`. En celular vertical el mundo se achica hasta
 * el borde de la hoja (mundo.css), así la base y el niño quedan a la vista encima de la decisión.
 */
export function useAltoHoja(hoja: RefObject<HTMLElement>, abierta: boolean) {
  useEffect(() => {
    const raiz = document.documentElement;
    const el = hoja.current;
    if (!abierta || !el) return;
    const medir = () => raiz.style.setProperty("--hoja-alto", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    medir();
    return () => { obs.disconnect(); raiz.style.removeProperty("--hoja-alto"); };
  }, [hoja, abierta]);
}

/** Fase que ve la escena: la tormenta se ve también en la base mientras dure. */
export function faseVista(fase: FaseMundo, estado: GameState): FaseVista {
  if (fase === "modulos") return "modulos";
  return fase === "tormenta" || tormentaActiva(estado) ? "tormenta" : "base";
}

/** Verbo de `[E]` para lo que hay al alcance (E2). Acercarse solo nombra el verbo: nunca cobra. */
export type VerboInteraccion = "hablar" | "construir" | "entrar" | "salir" | "usar";
export function verboDe(i: Interactivo, fase: FaseMundo): VerboInteraccion {
  if (i.tipo === "actor") return "hablar";
  if (i.tipo === "puerta") return i.entrar ? "entrar" : "salir";
  return fase === "modulos" && LUGARES.some((l) => l.id === i.lugar && l.modulo) ? "construir" : "usar";
}

/** Tecla de `[E]` que atiende la pantalla: no al escribir, ni con modificadores, ni repetida. */
export function esTeclaUsar(e: Pick<KeyboardEvent, "key" | "code" | "repeat" | "ctrlKey" | "metaKey" | "altKey" | "target">): boolean {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || esCampo(e.target)) return false;
  return e.key === "e" || e.key === "E" || e.code === "KeyE";
}

const esCampo = (el: EventTarget | null) =>
  typeof HTMLElement !== "undefined" && el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * El mundo 3D de la base, montado UNA vez para E5, E6 y E7 (plan de integración, hallazgo 6): el
 * canvas sobrevive a `modulos -> base -> tormenta -> base`, así la cámara, el jugador e Iris no
 * vuelven al inicio al cambiar de fase. Las pantallas son capas encima (`children`) y hablan con
 * la escena por `useMundo()`. `calidad` y movimiento reducido vienen de los ajustes guardados.
 */
export function MundoBase({ fase, estado, colocados, calidad, movimientoReducido, onCalidad, children }: {
  fase: FaseMundo;
  estado: GameState;
  colocados: readonly Equipment[];
  calidad: CalidadGrafica;
  movimientoReducido: boolean;
  onCalidad(c: CalidadGrafica): void;
  children: ReactNode;
}) {
  const [sin3d, setSin3d] = useState(() => !hayGraficos3D());
  const [cercano, setCercano] = useState<LugarObjetivo | null>(null);
  const [camara, setCamara] = useState<CamaraEscena>("tercera");
  const [destino, setDestino] = useState<LugarObjetivo | null>(null);
  const [entrada, setEntrada] = useState<EntradaTactil | null>(null);
  const [posicion, setPosicion] = useState<PosicionJugador>(INICIO_JUGADOR);
  const [bloqueadoCapa, setBloqueadoCapa] = useState(false);
  const [campo, setCampo] = useState(false);
  const [instalando, setInstalando] = useState<Equipment | null>(null);
  const [lugarObjetivo, setLugarObjetivo] = useState<LugarObjetivo | null>(null);
  const uso = useRef<((i: Interactivo) => void) | null>(null);
  const [alcance, setAlcance] = useState<Interactivo | null>(null);
  const [sala, setSala] = useState<SalaId>("exterior");
  const [hablando, setHablando] = useState<ActorId | null>(null);

  // Escribir en un campo (preguntar a la tripulación) frena el mundo: las letras no lo mueven.
  useEffect(() => {
    const entra = (e: FocusEvent) => setCampo(esCampo(e.target));
    // Al salir, el foco todavía no llegó a su destino: se mira en el cuadro siguiente.
    const sale = () => requestAnimationFrame(() => setCampo(esCampo(document.activeElement)));
    document.addEventListener("focusin", entra);
    document.addEventListener("focusout", sale);
    return () => {
      document.removeEventListener("focusin", entra);
      document.removeEventListener("focusout", sale);
    };
  }, []);
  const bloqueado = bloqueadoCapa || campo;

  const fv = faseVista(fase, estado);
  const vista = useMemo(() => vistaEscena(estado, { fase: fv, colocados, instalando: fase === "modulos" ? instalando : null, averiaRevelada: fase !== "modulos" && averiaIrisRevelada(estado), lugarObjetivo }),
    [estado, colocados, fv, fase, instalando, lugarObjetivo]);
  // Eventos del último tick: se comparan el estado anterior y el actual (una vez por tick).
  const previo = useRef(estado);
  const eventos = useMemo(() => {
    const ev = previo.current.tick === estado.tick ? [] : eventosDeTick(previo.current, estado);
    previo.current = estado;
    return ev;
  }, [estado]);

  const alternarCamara = useCallback(() => setCamara((c) => (c === "tercera" ? "primera" : "tercera")), []);
  const fijarUso = useCallback((fn: ((i: Interactivo) => void) | null) => { uso.current = fn; }, []);
  // Sin WebGL la escena no avisa: lo que hay al alcance es el lugar donde el mapa dejó al niño.
  const interactivo = sin3d ? interactivoDeLugar(cercano) : alcance;
  // E2: una sola vía para `[E]`. La escena (tecla E con 3D), la tecla sin 3D, el aviso del HUD y el
  // toque táctil llegan aquí. Las puertas cambian la sala; lugares y actores van a la pantalla.
  const actual = useRef({ interactivo, bloqueado, sin3d });
  actual.current = { interactivo, bloqueado, sin3d };
  const usarDe = useCallback((l: LugarObjetivo | null) => {
    const { bloqueado: b } = actual.current;
    // Lo último que avisó la escena; si todavía no avisó, el lugar que manda con la tecla.
    const i = actual.current.interactivo ?? interactivoDeLugar(l);
    if (!i || b) return;
    if (i.tipo === "puerta") setSala(i.entrar ? i.sala : "exterior");
    else uso.current?.(i);
  }, []);
  const usarCercano = useCallback(() => usarDe(null), [usarDe]);
  // El único manejador de teclado de `[E]` en la pantalla. Con 3D la escena ya escucha la tecla y
  // avisa por `onUsar`; este solo atiende el respaldo 2D, así una pulsación nunca se usa dos veces.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      // Como en la escena: E siempre es "usar", también con el foco en un botón (Enter es del botón).
      if (actual.current.sin3d && esTeclaUsar(e)) usarCercano();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [usarCercano]);
  // Con la escena, el mapa le da un destino y ella camina. Sin WebGL no hay quién camine: el niño
  // "llega" al punto de uso del lugar (ESCENAS §3.5, alternativa sin arrastrar para el respaldo 2D).
  const irA = useCallback((l: LugarObjetivo | null) => {
    if (!sin3d) { setDestino(l); return; }
    setCercano(l);
    if (l) { const p = lugar(l); setPosicion({ x: p.x, z: p.z }); }
  }, [sin3d]);
  const mundo = useMemo<Mundo>(() => ({
    sin3d, cercano, interactivo, sala, usarCercano, fijarHablando: setHablando, camara, alternarCamara, destino, irA, entrada, movimientoReducido,
    fijarBloqueado: setBloqueadoCapa, fijarInstalando: setInstalando, fijarUso, fijarObjetivo: setLugarObjetivo,
  }), [sin3d, cercano, interactivo, sala, usarCercano, camara, alternarCamara, destino, irA, entrada, movimientoReducido, fijarUso]);

  return (
    <div className="mundo" data-fase={fase}>
      <div className="mundo-escena" aria-hidden="true">
        {sin3d ? <div className="mundo-hueco" data-escena={fase} /> : (
          <Suspense fallback={<div className="mundo-hueco" data-escena={fase} />}>
            <EscenaBase vista={vista} eventos={eventos} calidad={calidad} camara={camara} movimientoReducido={movimientoReducido}
              onLugarCercano={setCercano}
              onInteractivo={setAlcance}
              onUsar={usarDe}
              sala={sala}
              hablando={hablando}
              onCalidad={onCalidad}
              onWebGLPerdido={() => setSin3d(true)}
              destino={destino}
              onDestino={(e: EventoDestino) => setDestino((d) => (d === e.lugar ? null : d))}
              bloqueado={bloqueado}
              onPosicion={setPosicion}
              onCambiarCamara={alternarCamara}
              onEntradaTactil={setEntrada} />
          </Suspense>
        )}
      </div>
      <MundoContexto.Provider value={mundo}>
        <PosicionContexto.Provider value={posicion}>{children}</PosicionContexto.Provider>
      </MundoContexto.Provider>
    </div>
  );
}
