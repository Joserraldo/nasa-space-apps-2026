/**
 * Mezclador de tres canales (música, voz y efectos) que sigue a Ajustes (`colonia.settings.v1`).
 * Nada suena hasta el primer toque; con la pestaña oculta o el juego en pausa hay silencio.
 */
import type { Level, SettingsState } from "../ui/state/settings";
import { idiomaDe } from "../game/i18n";
import { crearEfectos, type Efecto } from "./efectos";
import { apertura, crearReproductor, type Tema } from "./musica";
import { crearVoz, type Sintesis } from "./voz";

export const GANANCIAS: Record<Level, number> = { 0: 0, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1 };
/** Cuánto queda la música mientras habla la voz. */
export const MUSICA_CON_VOZ = 0.35;

export interface Entorno {
  crearContexto: () => AudioContext | null;
  sintesis: Sintesis | null;
  crearFrase: (texto: string) => SpeechSynthesisUtterance;
  cada: (ms: number, tarea: () => void) => () => void;
}

export function entornoDelNavegador(): Entorno {
  return {
    crearContexto: () => (typeof AudioContext === "undefined" ? null : new AudioContext()),
    sintesis: typeof speechSynthesis === "undefined" ? null : speechSynthesis,
    crearFrase: (texto) => new SpeechSynthesisUtterance(texto),
    cada: (ms, tarea) => { const id = setInterval(tarea, ms); return () => clearInterval(id); },
  };
}

export function crearMezclador(ajustesIniciales: SettingsState, entorno: Entorno = entornoDelNavegador()) {
  let ajustes = ajustesIniciales;
  let hablando = false;
  let pausado = false;
  let oculto = false;
  let temaPedido: Tema | null = null;
  let motor: {
    ctx: AudioContext; musica: GainNode; efectos: GainNode;
    fx: ReturnType<typeof crearEfectos>; reproductor: ReturnType<typeof crearReproductor>; detener: () => void;
  } | null = null;

  const voz = crearVoz({
    sintesis: entorno.sintesis,
    crearFrase: entorno.crearFrase,
    volumen: () => GANANCIAS[ajustes.voice],
    idioma: () => idiomaDe(ajustes),
    alHablar: (estado) => { hablando = estado; ajustarVolumen(); },
  });

  function ajustarVolumen(): void {
    if (!motor) return;
    const { ctx, musica, efectos } = motor;
    const objetivo = GANANCIAS[ajustes.music] * (hablando ? MUSICA_CON_VOZ : 1);
    musica.gain.setTargetAtTime(objetivo, ctx.currentTime, 0.15);
    efectos.gain.setTargetAtTime(GANANCIAS[ajustes.sound], ctx.currentTime, 0.05);
  }

  function activo(): void {
    if (!motor) return;
    if (pausado || oculto) { voz.callar(); void motor.ctx.suspend(); }
    else void motor.ctx.resume();
  }

  return {
    voz,
    get listo() { return motor !== null; },
    /** Llamar dentro del primer toque o tecla. */
    desbloquear(): void {
      voz.desbloquear();
      if (motor) { activo(); return; }
      const ctx = entorno.crearContexto();
      if (!ctx) return;
      // Un compresor evita saturar cuando coinciden música y efectos.
      const salida = ctx.createDynamicsCompressor();
      salida.connect(ctx.destination);
      const musica = ctx.createGain();
      const efectos = ctx.createGain();
      musica.gain.value = GANANCIAS[ajustes.music];
      efectos.gain.value = GANANCIAS[ajustes.sound];
      musica.connect(salida);
      efectos.connect(salida);
      const reproductor = crearReproductor(ctx, musica);
      motor = { ctx, musica, efectos, reproductor, fx: crearEfectos(ctx, efectos), detener: entorno.cada(200, () => reproductor.avanzar()) };
      reproductor.poner(temaPedido);
      activo();
    },
    ajustar(nuevos: SettingsState): void {
      ajustes = nuevos;
      if (GANANCIAS[ajustes.voice] === 0) voz.callar();
      ajustarVolumen();
    },
    musica(tema: Tema | null): void {
      temaPedido = tema;
      motor?.reproductor.poner(tema);
    },
    /** La apertura de la intro: se oye una vez, sobre la música. */
    abrirIntro(): void {
      if (motor) apertura(motor.ctx, motor.musica, motor.ctx.currentTime + 0.02);
    },
    efecto(nombre: Efecto): boolean {
      if (!motor || pausado || oculto || ajustes.sound === 0) return false;
      return motor.fx.tocar(nombre);
    },
    pausar(valor: boolean): void { pausado = valor; activo(); },
    ocultar(valor: boolean): void { oculto = valor; activo(); },
    cerrar(): void {
      voz.callar();
      motor?.detener();
      void motor?.ctx.close();
      motor = null;
    },
  };
}

export type Mezclador = ReturnType<typeof crearMezclador>;
