import { useEffect, useRef, useState, type RefObject } from "react";
import type { GameState } from "@solar-shield/contracts";
import type { Novedades } from "@solar-shield/engine";
import { useT, type Vars } from "../i18n.js";
import { Pildora, PildoraBoton, PildoraObjetivo } from "./base/Pildoras.js";
import { RECURSOS, ResourcePlaque } from "./base/Piezas.js";
import "./hud.css";

/**
 * HUD de las fases de base (módulos, base y tormenta), escrito desde `mundo/01` (DISEÑO §5.2): sin
 * franja, píldoras de una línea flotando sobre la escena. Arriba a la derecha los tres recursos y
 * debajo el objetivo; arriba a la izquierda día, turno y el reloj; abajo (solo si la pantalla trae
 * el mundo y sus controles) Crew, Map, la acción con [E] y el cambio de cámara con [V].
 * Mide su propia altura y la publica en `--hud-reserva-izq`, `--hud-reserva-der` y `--hud-reserva` (la mayor), para que los
 * paneles de cada pantalla empiecen debajo de las píldoras sin taparlas.
 * Escala `min(ancho/1024, alto/683)` pero nunca por debajo de 1: el texto no baja de 16 px (ESCENAS §2.7).
 * En celular (apaisado o vertical) es una sola fila compacta, como la lámina de celular: los tres
 * recursos con su nombre corto (el completo en `aria-label`), el objetivo en apaisado y la pausa con
 * solo su icono; día, turno y velocidad quedan para el lector de pantalla. Con controles táctiles,
 * `[E]` y `[V]` los dibuja `ControlesTactiles` y aquí quedan `Crew` y `Map` junto al joystick.
 */

export const VELOCIDADES = [0.5, 1, 2] as const;

/** Partes del HUD que aparecen con el juego (PLAN-JUGABILIDAD §1, E3). `Pause` y los recursos, siempre. */
export interface HudVisible {
  crew: boolean;
  mapa: boolean;
  velocidad: boolean;
}

/** Lo que el niño ya vivió en esta partida y abre partes del HUD. */
export interface ProgresoHud {
  /** Ya habló con alguien de la tripulación (un lugar con experto, el campo de preguntas o la tormenta). */
  conversado: boolean;
  /** Ya vio su primer objetivo con un lugar del mundo. */
  objetivo: boolean;
}

export const PROGRESO_INICIAL: ProgresoHud = { conversado: false, objetivo: false };

/**
 * HUD progresivo (tabla de PLAN-JUGABILIDAD §1): `Map` llega con el primer objetivo, `Crew` después de
 * la primera conversación y la velocidad del reloj cuando los módulos ya están puestos. Sin la escena 3D
 * (respaldo 2D) no se puede caminar hasta nadie: `Crew` y `Map` se ven siempre.
 */
export function hudVisible({ progreso, sin3d, modulosListos }: { progreso: ProgresoHud; sin3d: boolean; modulosListos: boolean }): HudVisible {
  return {
    crew: sin3d || progreso.conversado,
    mapa: sin3d || progreso.objetivo || progreso.conversado,
    velocidad: modulosListos,
  };
}

const TODO_VISIBLE: HudVisible = { crew: true, mapa: true, velocidad: true };

function escalaHud(): number {
  if (typeof window === "undefined") return 1;
  return Math.max(1, Math.min(window.innerWidth / 1024, window.innerHeight / 683));
}

function useEscalaHud(): number {
  const [escala, setEscala] = useState(escalaHud);
  useEffect(() => {
    const medir = () => setEscala(escalaHud());
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  return escala;
}

/** Publica hasta dónde llegan las píldoras de arriba para que los paneles no las tapen. */
function useReserva(capa: RefObject<HTMLElement>, izq: RefObject<HTMLElement>, der: RefObject<HTMLElement>) {
  useEffect(() => {
    const raiz = document.documentElement;
    // Distancia desde el borde superior del HUD (que es el de la pantalla o el de la página).
    const abajo = (r: RefObject<HTMLElement>) => Math.ceil((r.current?.getBoundingClientRect().bottom ?? 0) - (capa.current?.getBoundingClientRect().top ?? 0)) + 8;
    const medir = () => {
      raiz.style.setProperty("--hud-reserva", `${Math.max(abajo(izq), abajo(der))}px`);
      raiz.style.setProperty("--hud-reserva-izq", `${abajo(izq)}px`);
      raiz.style.setProperty("--hud-reserva-der", `${abajo(der)}px`);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (izq.current) obs.observe(izq.current);
    if (der.current) obs.observe(der.current);
    window.addEventListener("resize", medir);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", medir);
      raiz.style.removeProperty("--hud-reserva");
      raiz.style.removeProperty("--hud-reserva-izq");
      raiz.style.removeProperty("--hud-reserva-der");
    };
  }, [capa, izq, der]);
}

export interface HudMundo {
  onTripulacion(): void;
  onMapa(): void;
  /** Acción cercana ("Inspect controller"); sin ella no se dibuja el aviso de [E]. */
  interaccion?: { labelKey: string; onUsar(): void } | undefined;
  camara: "tercera" | "primera";
  onCamara(): void;
}

export interface HudBaseProps {
  estado: GameState;
  /** Novedades del último turno: sus causas con recurso y delta se muestran bajo cada píldora. */
  ultimas?: Novedades | null | undefined;
  /** Controles del reloj; si faltan (módulos, tormenta), el HUD solo muestra día, turno y recursos. */
  reloj?: { velocidad: number; onPausa(): void; onVelocidad(v: number): void } | undefined;
  /** Objetivo actual, por clave i18n: píldora con anillo cian bajo los recursos. */
  objetivo?: { labelKey: string; vars?: Vars } | undefined;
  /** Fila de abajo de mundo/01. Solo la monta quien tiene el mundo y sus controles. */
  mundo?: HudMundo | undefined;
  /** Controles táctiles a la vista: la acción y la cámara las dibuja `ControlesTactiles`. */
  tactil?: boolean | undefined;
  /** Hay un panel de decisión o consulta abierto: la fila de abajo cede su sitio al panel. */
  panelAbierto?: boolean | undefined;
  /** E4: abre el menú (cámara, calidad, sonido e idioma). Siempre visible, como la pausa. */
  onMenu?: (() => void) | undefined;
  /** Qué partes ya aparecieron (E3, `hudVisible`). Sin este dato se ve todo, como en el muestrario. */
  visible?: HudVisible | undefined;
}

export function HudBase({ estado, ultimas, reloj, objetivo, mundo, tactil = false, panelAbierto = false, onMenu, visible = TODO_VISIBLE }: HudBaseProps) {
  const { t } = useT();
  const escala = useEscalaHud();
  const capa = useRef<HTMLElement>(null);
  const izq = useRef<HTMLDivElement>(null);
  const der = useRef<HTMLDivElement>(null);
  useReserva(capa, izq, der);
  const cambios = ultimas ? [...ultimas.efectosLlegaron, ...ultimas.malaSuerte] : [];
  // E4: en celular la fila de arriba es una sola y con la pausa no entra otro botón (390x844 tapaba la
  // pausa). Con controles táctiles y fila de abajo, el menú va abajo, junto a Crew y Map.
  const menuAbajo = tactil && !!mundo;
  const siguiente = (v: number) => VELOCIDADES[(VELOCIDADES.indexOf(v as (typeof VELOCIDADES)[number]) + 1) % VELOCIDADES.length]!;
  return (
    <section ref={capa} className={`hud-base${tactil ? " hud-tactil" : ""}${panelAbierto ? " hud-con-panel" : ""}`} aria-label={t("ui.hud.titulo")} style={{ zoom: escala }}>
      <div className="hud-arriba">
        <div className="hud-izq" ref={izq}>
          <Pildora className="hud-dia"><span>{t("ui.dia", { dia: estado.dia })}</span> <span aria-hidden="true">·</span> <span>{t("ui.tick", { tick: estado.tick })}</span></Pildora>
          {reloj && (
            <>
              <PildoraBoton className="hud-pausa" labelKey={estado.pausado ? "ui.reanudar" : "ui.pausa"} icon={estado.pausado ? "jugar" : "pausa"} onClick={reloj.onPausa} />
              {visible.velocidad && <PildoraBoton className="hud-velocidad" labelKey="ui.hud.velocidad" labelVars={{ v: reloj.velocidad }} icon="reloj" onClick={() => reloj.onVelocidad(siguiente(reloj.velocidad))} />}
            </>
          )}
          {onMenu && !menuAbajo && <PildoraBoton className="hud-menu" labelKey="ui.menu.abrir" icon="engranaje" onClick={onMenu} />}
        </div>
        <div className="hud-der" ref={der}>
          <div className="hud-placas">
            {RECURSOS.map((r) => (
              <ResourcePlaque key={r} recurso={r} value={estado.recursos[r]} pending={estado.efectosPendientes}
                feedback={cambios.filter((c) => c.recurso === r && c.delta !== undefined).map((c, i) => ({ id: `${c.tick}-${r}-${i}`, delta: c.delta!, causaKey: c.descripcionKey }))} />
            ))}
          </div>
          {objetivo && <PildoraObjetivo labelKey={objetivo.labelKey} vars={objetivo.vars} />}
        </div>
      </div>
      {mundo && (
        <div className="hud-abajo">
          <div className="hud-abajo-izq">
            {visible.crew && <PildoraBoton labelKey="ui.comun.tripulacion" icon="tripulacion" onClick={mundo.onTripulacion} />}
            {visible.mapa && <PildoraBoton labelKey="ui.comun.mapa" icon="mapa" onClick={mundo.onMapa} />}
            {onMenu && menuAbajo && <PildoraBoton className="hud-menu" labelKey="ui.menu.abrir" icon="engranaje" onClick={onMenu} />}
          </div>
          {!tactil && mundo.interaccion && <PildoraBoton className="hud-centro" labelKey={mundo.interaccion.labelKey} tecla={{ letra: "E", tono: "accion" }} onClick={mundo.interaccion.onUsar} />}
          {!tactil && <PildoraBoton className="hud-camara" labelKey={mundo.camara === "tercera" ? "ui.comun.hud.primera" : "ui.comun.hud.tercera"} tecla={{ letra: "V", tono: "camara" }} onClick={mundo.onCamara} />}
        </div>
      )}
    </section>
  );
}
