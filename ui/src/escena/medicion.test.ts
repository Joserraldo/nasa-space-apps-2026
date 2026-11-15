import { describe, expect, it } from "vitest";
import { crearMedidorRender } from "./medicion";

const cuenta = { drawCalls: 10, triangulos: 1200 };
describe("medición del render", () => {
  it("usa los intervalos dibujados y los últimos contadores reales", () => {
    const m = crearMedidorRender();
    for (const t of [0, 16, 32, 80]) m.registrar(t, cuenta);
    m.registrar(96, { drawCalls: 7, triangulos: 900 });
    const r = m.leer();
    expect(r.fpsPromedio).toBeCloseTo(4 * 1000 / 96);
    expect(r.fpsMinimo).toBeCloseTo(1000 / 48);
    expect(r.drawCalls).toBe(7);
    expect(r.triangulos).toBe(900);
  });
  it("excluye las muestras que salieron de la ventana", () => {
    const m = crearMedidorRender(500);
    for (const t of [0, 100, 200, 650]) m.registrar(t, cuenta);
    expect(m.leer().fpsPromedio).toBeCloseTo(1000 / 450);
    expect(m.leer().fpsMinimo).toBeCloseTo(1000 / 450);
  });
  it("no presenta FPS ni contadores antiguos al parar o recuperar el contexto", () => {
    const m = crearMedidorRender();
    m.registrar(0, cuenta); m.registrar(16, cuenta);
    m.reiniciar();
    expect(m.leer()).toEqual({ fpsPromedio: null, fpsMinimo: null, drawCalls: 0, triangulos: 0 });
    m.registrar(10000, cuenta);
    expect(m.leer().fpsPromedio).toBeNull();
    m.registrar(10016, cuenta);
    expect(m.leer().fpsPromedio).toBeCloseTo(62.5);
  });
});
