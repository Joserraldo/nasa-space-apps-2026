/**
 * Mezclador de tres canales (música, voz y efectos) que sigue a Ajustes (`colonia.settings.v1`).
 * Nada suena hasta el primer toque; con la pestaña oculta o el juego en pausa hay silencio.
 */
import type { Level, SettingsState } from "../ui/state/settings";
import { idiomaDe } from "../game/i18n";
import { crearEfectos, type Efecto } from "./efectos";
import { ARCHIVOS, crearAlmacen, grabacionDe, type Almacen, type Archivos, type Cargar } from "./grabados";
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
  /** Descarga de los audios grabados. Sin ella todo suena por código y con la voz del navegador. */
  cargar?: Cargar;
  archivos?: Archivos;
}

export function entornoDelNavegador(): Entorno {
  return {
    crearContexto: () => (typeof AudioContext === "undefined" ? null : new AudioContext()),
    sintesis: typeof speechSynthesis === "undefined" ? null : speechSynthesis,
    crearFrase: (texto) => new SpeechSynthesisUtterance(texto),
    cada: (ms, tarea) => { const id = setInterval(tarea, ms); return () => clearInterval(id); },
    cargar: async (ruta) => {
      const respuesta = await fetch(ruta);
      if (!respuesta.ok) throw new Error(`audio: ${respuesta.status}`);
      return respuesta.arrayBuffer();
    },
  };
}

export function crearMezclador(ajustesIniciales: SettingsState, entorno: Entorno = entornoDelNavegador()) {
  let ajustes = ajustesIniciales;
  let hablando = false;
  let pausado = false;
  let oculto = false;
  let temaPedido: Tema | null = null;
  const lista = entorno.archivos ?? ARCHIVOS;
  let motor: {
    ctx: AudioContext; musica: GainNode; efectos: GainNode; voces: GainNode; almacen: Almacen | null;
    fx: ReturnType<typeof crearEfectos>; reproductor: ReturnType<typeof crearReproductor>; detener: () => void;
  } | null = null;

  const voz = crearVoz({
    sintesis: entorno.sintesis,
    crearFrase: entorno.crearFrase,
    volumen: () => GANANCIAS[ajustes.voice],
    idioma: () => idiomaDe(ajustes),
    alHablar: (estado) => { hablando = estado; ajustarVolumen(); },
    grabada: (texto, idioma, alTerminar) => {
      const archivo = grabacionDe(texto, idioma, lista);
      // En pausa el audio está detenido: los menús los lee el navegador.
      if (!archivo || !motor?.almacen || pausado || oculto) return null;
      const { ctx, voces, almacen } = motor;
      let fuente: AudioBufferSourceNode | null = null;
      let callada = false;
      void almacen.pedir(archivo).then((audio) => {
        if (callada) return;
        if (!audio) { alTerminar(); return; }
        fuente = ctx.createBufferSource();
        fuente.buffer = audio;
        fuente.connect(voces);
        fuente.onended = alTerminar;
        fuente.start();
      });
      return () => { callada = true; fuente?.stop(); };
    },
  });

  function ajustarVolumen(): void {
    if (!motor) return;
    const { ctx, musica, efectos, voces } = motor;
    voces.gain.setTargetAtTime(GANANCIAS[ajustes.voice], ctx.currentTime, 0.05);
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
      const voces = ctx.createGain();
      voces.gain.value = GANANCIAS[ajustes.voice];
      musica.connect(salida);
      efectos.connect(salida);
      voces.connect(salida);
      const almacen = entorno.cargar ? crearAlmacen(ctx, entorno.cargar) : null;
      // Efectos y música se piden ya; hasta que lleguen suena la versión generada por código.
      for (const archivo of [...Object.values(lista.efectos), ...Object.values(lista.musica)]) void almacen?.pedir(archivo);
      const grabado = (archivo: string | undefined) => (archivo ? almacen?.ya(archivo) ?? null : null);
      const reproductor = crearReproductor(ctx, musica, (tema) => grabado(lista.musica[tema]));
      motor = {
        ctx, musica, efectos, voces, almacen, reproductor,
        fx: crearEfectos(ctx, efectos, (efecto) => grabado(lista.efectos[efecto])),
        detener: entorno.cada(200, () => reproductor.avanzar()),
      };
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
      if (!motor) return;
      const { ctx, musica, almacen } = motor;
      const archivo = lista.musica.apertura;
      const audio = archivo ? almacen?.ya(archivo) : null;
      if (!audio) { apertura(ctx, musica, ctx.currentTime + 0.02); return; }
      const fuente = ctx.createBufferSource();
      fuente.buffer = audio;
      fuente.connect(musica);
      fuente.start();
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
