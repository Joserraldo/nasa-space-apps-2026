import { beforeEach, describe, expect, it } from "vitest";
import { reiniciarSonido, SENALES, tocar, type ContextoAudio, type Senal } from "./sonido.js";

/** Contexto de audio falso que anota lo que se programó. */
function contextoFalso() {
  const notas: { frecuencia: number; inicio: number; fin: number }[] = [];
  let reanudado = 0;
  const ctx: ContextoAudio = {
    currentTime: 10,
    state: "suspended",
    destination: {},
    resume: () => { reanudado++; return Promise.resolve(); },
    createOscillator: () => {
      const nota = { frecuencia: 0, inicio: 0, fin: 0 };
      notas.push(nota);
      return {
        type: "sine",
        frequency: { get value() { return nota.frecuencia; }, set value(v: number) { nota.frecuencia = v; } },
        connect: () => undefined,
        start: (t = 0) => { nota.inicio = t; },
        stop: (t = 0) => { nota.fin = t; },
      };
    },
    createGain: () => ({
      gain: { setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined },
      connect: () => undefined,
    }),
  };
  return { ctx, notas, reanudados: () => reanudado };
}

describe("sonidos del juego", () => {
  beforeEach(reiniciarSonido);

  it("con el sonido apagado no crea audio ni suena", () => {
    let creados = 0;
    expect(tocar("exito", false, () => { creados++; return contextoFalso().ctx; })).toBe(0);
    expect(creados).toBe(0);
  });

  it("con el sonido encendido programa las notas de la señal, a partir de ahora", () => {
    const f = contextoFalso();
    expect(tocar("confirmar", true, () => f.ctx)).toBe(SENALES.confirmar.length);
    expect(f.notas.map((n) => n.frecuencia)).toEqual(SENALES.confirmar.map((n) => n[0]));
    expect(f.notas.every((n) => n.inicio >= 10 && n.fin > n.inicio)).toBe(true);
    // El navegador deja el audio suspendido hasta un gesto: se reanuda al tocar.
    expect(f.reanudados()).toBe(1);
  });

  it("crea el contexto una sola vez", () => {
    const f = contextoFalso();
    let creados = 0;
    const fabrica = () => { creados++; return f.ctx; };
    tocar("toque", true, fabrica);
    tocar("alerta", true, fabrica);
    expect(creados).toBe(1);
  });

  it("sin audio en el navegador, o si falla, el juego sigue en silencio", () => {
    expect(tocar("fallo", true, () => null)).toBe(0);
    reiniciarSonido();
    expect(tocar("fallo", true, () => { throw new Error("sin audio"); })).toBe(0);
  });

  it("todas las señales son cortas y suaves para niños", () => {
    for (const senal of Object.keys(SENALES) as Senal[]) {
      const notas = SENALES[senal];
      expect(notas.length).toBeGreaterThan(0);
      const fin = Math.max(...notas.map(([, inicio, duracion]) => inicio + duracion));
      expect(fin).toBeLessThanOrEqual(1);
      expect(notas.every(([f]) => f >= 200 && f <= 1200)).toBe(true);
    }
  });
});
