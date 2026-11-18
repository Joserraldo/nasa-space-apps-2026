import { describe, expect, it } from "vitest";
import { calcularTasa } from "./dosis.js";

describe("calcularTasa", () => {
  it("sin lectura previa no hay tasa", () => {
    expect(calcularTasa(null, { tick: 0, dosis: 1 })).toBeUndefined();
  });

  it("con ticks consecutivos devuelve la diferencia", () => {
    expect(calcularTasa({ tick: 3, dosis: 1.2 }, { tick: 4, dosis: 1.6 })).toBeCloseTo(0.4, 9);
  });

  it("con ticks no consecutivos no hay tasa", () => {
    expect(calcularTasa({ tick: 3, dosis: 1 }, { tick: 5, dosis: 2 })).toBeUndefined();
    expect(calcularTasa({ tick: 3, dosis: 1 }, { tick: 3, dosis: 2 })).toBeUndefined();
    expect(calcularTasa({ tick: 4, dosis: 1 }, { tick: 3, dosis: 2 })).toBeUndefined();
  });

  it("nunca es negativa", () => {
    expect(calcularTasa({ tick: 3, dosis: 2 }, { tick: 4, dosis: 1 })).toBe(0);
    expect(calcularTasa({ tick: 3, dosis: 4 }, { tick: 4, dosis: 4 })).toBe(0);
  });
});
