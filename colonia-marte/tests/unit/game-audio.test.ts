import { describe, expect, it, vi } from "vitest";
import { crearEfectos, EFECTOS, MAXIMO_SIMULTANEOS } from "../../src/audio/efectos";
import { crearMezclador, GANANCIAS, MUSICA_CON_VOZ, type Entorno } from "../../src/audio/mezclador";
import { crearReproductor, TEMAS } from "../../src/audio/musica";
import { conectarVoz, elegirVoz, lineaDeVoz, type Voz } from "../../src/audio/voz";
import { cargarIntro } from "../../src/game/intro";
import { DEFAULT_SETTINGS } from "../../src/ui/state/settings";

/** Un AudioContext falso que anota ganancias y estado. */
function contextoFalso() {
  const ganancias: { value: number; objetivo: number | null }[] = [];
  const parametro = (value = 0) => {
    const p = { value, objetivo: null as number | null, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
      setTargetAtTime(v: number) { p.objetivo = v; } };
    return p;
  };
  const nodo = () => ({ connect() {}, start() {}, stop() {}, type: "", buffer: null, frequency: parametro() });
  const ctx = {
    currentTime: 0, sampleRate: 8000, destination: {}, estado: "running",
    createOscillator: nodo, createBiquadFilter: nodo, createBufferSource: nodo, createDynamicsCompressor: nodo,
    createBuffer: (_: number, largo: number) => ({ getChannelData: () => new Float32Array(largo) }),
    createGain: () => { const gain = parametro(1); ganancias.push(gain); return { ...nodo(), gain }; },
    resume: async () => { ctx.estado = "running"; },
    suspend: async () => { ctx.estado = "suspended"; },
    close: async () => { ctx.estado = "closed"; },
  };
  return { ctx, ganancias };
}

function entornoFalso() {
  const { ctx, ganancias } = contextoFalso();
  const dichas: SpeechSynthesisUtterance[] = [];
  let creados = 0;
  const entorno: Entorno = {
    crearContexto: () => { creados++; return ctx as unknown as AudioContext; },
    sintesis: { getVoices: () => [{ lang: "en-GB" }, { lang: "en-US", localService: true }, { lang: "es-ES" }], speak: (f) => dichas.push(f), cancel() {} },
    crearFrase: (text) => ({ text }) as SpeechSynthesisUtterance,
    cada: () => () => {},
  };
  return { entorno, ctx, ganancias, dichas, creados: () => creados };
}

describe("mezclador", () => {
  it("nada suena antes del primer toque", () => {
    const f = entornoFalso();
    const m = crearMezclador(DEFAULT_SETTINGS, f.entorno);
    m.musica("calma");
    expect(m.efecto("boton")).toBe(false);
    expect(m.voz.decir("Hello")).toBe(false);
    expect(f.creados()).toBe(0);
    m.desbloquear();
    m.desbloquear();
    expect(f.creados()).toBe(1);
    expect(m.voz.decir("Hello")).toBe(true);
  });

  it("los niveles 0 a 4 de Ajustes son la ganancia de cada canal", () => {
    const f = entornoFalso();
    const m = crearMezclador(DEFAULT_SETTINGS, f.entorno);
    m.desbloquear();
    const [musica, efectos] = f.ganancias;
    expect([musica!.value, efectos!.value]).toEqual([0.75, 0.75]);
    m.ajustar({ ...DEFAULT_SETTINGS, music: 1, sound: 0, voice: 2 });
    expect([musica!.objetivo, efectos!.objetivo]).toEqual([0.25, 0]);
    expect(m.efecto("boton")).toBe(false);
    m.voz.decir("Hi");
    expect(f.dichas.at(-1)!.volume).toBe(GANANCIAS[2]);
  });

  it("la música baja mientras habla y vuelve al terminar", () => {
    const f = entornoFalso();
    const m = crearMezclador(DEFAULT_SETTINGS, f.entorno);
    m.desbloquear();
    m.voz.decir("Hello", "vera");
    expect(f.ganancias[0]!.objetivo).toBeCloseTo(0.75 * MUSICA_CON_VOZ);
    f.dichas.at(-1)!.onend!(new Event("end") as SpeechSynthesisEvent);
    expect(f.ganancias[0]!.objetivo).toBe(0.75);
  });

  it("la voz sigue el idioma y se calla en nivel 0", () => {
    const f = entornoFalso();
    const m = crearMezclador({ ...DEFAULT_SETTINGS, language: "es" } as typeof DEFAULT_SETTINGS, f.entorno);
    m.desbloquear();
    m.voz.decir("Hola");
    expect(f.dichas.at(-1)!.lang).toBe("es-ES");
    m.ajustar({ ...DEFAULT_SETTINGS, voice: 0 });
    expect(m.voz.decir("Hola")).toBe(false);
  });

  it("silencio en pausa y con la pestaña oculta", () => {
    const f = entornoFalso();
    const m = crearMezclador(DEFAULT_SETTINGS, f.entorno);
    m.desbloquear();
    m.pausar(true);
    expect(f.ctx.estado).toBe("suspended");
    expect(m.efecto("boton")).toBe(false);
    m.ocultar(true);
    m.pausar(false);
    expect(f.ctx.estado).toBe("suspended");
    m.ocultar(false);
    expect(f.ctx.estado).toBe("running");
  });
});

describe("efectos, música y voz", () => {
  it("máximo tres efectos a la vez y sin repetir el mismo encima", () => {
    const { ctx } = contextoFalso();
    const fx = crearEfectos(ctx as unknown as AudioContext, {} as AudioNode);
    expect(fx.tocar("boton")).toBe(true);
    expect(fx.tocar("boton")).toBe(false);
    expect([fx.tocar("gasto"), fx.tocar("alerta")]).toEqual([true, true]);
    expect(MAXIMO_SIMULTANEOS).toBe(3);
    expect(fx.tocar("mapa")).toBe(false);
    ctx.currentTime = 10;
    expect(fx.tocar("mapa")).toBe(true);
  });

  it("hay sonido para cada efecto y música de la intro", () => {
    for (const toma of cargarIntro().tomas) {
      expect(EFECTOS[toma.efecto], toma.efecto).toBeDefined();
      expect(TEMAS[toma.musica], toma.musica).toBeDefined();
    }
  });

  it("lee lo tocado antes de que el botón actúe, para no cortar la línea nueva", () => {
    vi.stubGlobal("MutationObserver", class { observe() {} disconnect() {} });
    const escuchas: [string, unknown][] = [];
    const raiz = { querySelectorAll: () => [], addEventListener: (t: string, _: unknown, captura: unknown) => escuchas.push([t, captura]), removeEventListener() {} };
    conectarVoz(raiz as unknown as HTMLElement, { decir: () => true, callar() {} } as unknown as Voz)();
    expect(escuchas).toEqual([["click", true]]);
    vi.unstubAllGlobals();
  });

  it("el tema final suena una vez y los demás se repiten", () => {
    for (const [tema, veces] of [["final", TEMAS.final.acordes.length], ["calma", 10]] as const) {
      const { ctx, ganancias } = contextoFalso();
      let osciladores = 0;
      const contado = { ...ctx, createOscillator: () => { osciladores++; return ctx.createOscillator(); } };
      const r = crearReproductor(contado as unknown as AudioContext, {} as AudioNode);
      r.poner(tema);
      const porCompas = osciladores;
      for (let i = 1; i < 10; i++) { contado.currentTime = i * TEMAS[tema].compas; r.avanzar(); }
      expect(osciladores / porCompas, tema).toBeCloseTo(veces, 0);
      expect(ganancias.length).toBeGreaterThan(0);
    }
  });

  it("elige la voz del idioma y lee el data-voice-line más cercano", () => {
    const voces = [{ lang: "en-GB" }, { lang: "es_MX" }, { lang: "en-US" }];
    expect(elegirVoz(voces, "en")!.lang).toBe("en-US");
    expect(elegirVoz(voces, "es")!.lang).toBe("es_MX");
    expect(elegirVoz([{ lang: "fr-FR" }], "es")).toBeNull();
    expect(lineaDeVoz({ closest: () => ({ getAttribute: () => "Pause the game." }) })).toBe("Pause the game.");
    expect(lineaDeVoz({ closest: () => null })).toBeNull();
  });
});
