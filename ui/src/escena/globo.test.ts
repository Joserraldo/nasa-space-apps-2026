import { describe, expect, it } from "vitest";
import { posicionGlobo } from "./EscenaBase.js";

/** #390: el globo no se sale por arriba ni queda detrás del HUD. `y` es la punta de abajo; arriba = y - alto. */
describe("posicionGlobo", () => {
  const globo = { ancho: 256, alto: 110 };

  it("celular horizontal (844x390) con HUD alto: el borde de arriba queda debajo del HUD", () => {
    const reserva = 120;
    const { y } = posicionGlobo({ x: 400, y: 40 }, { ancho: 844, alto: 390 }, globo, reserva);
    expect(y - globo.alto).toBeGreaterThanOrEqual(reserva);
    expect(y).toBeLessThanOrEqual(390);
  });

  it("si el actor está bien abajo, el globo va sobre él sin tapar la fila de controles", () => {
    const { y } = posicionGlobo({ x: 400, y: 300 }, { ancho: 1440, alto: 900 }, globo, 80);
    expect(y).toBe(300);
    const bajo = posicionGlobo({ x: 400, y: 880 }, { ancho: 1440, alto: 900 }, globo, 80);
    expect(bajo.y).toBe(900 - 96);
  });

  it("no se sale por los costados", () => {
    expect(posicionGlobo({ x: 5, y: 300 }, { ancho: 390, alto: 844 }, globo, 80).x).toBe(globo.ancho / 2 + 8);
    expect(posicionGlobo({ x: 389, y: 300 }, { ancho: 390, alto: 844 }, globo, 80).x).toBe(390 - globo.ancho / 2 - 8);
  });

  it("si no entra en ningún lado, manda no taparse con el HUD", () => {
    const { y } = posicionGlobo({ x: 400, y: 200 }, { ancho: 844, alto: 300 }, { ancho: 256, alto: 200 }, 120);
    expect(y - 200).toBeGreaterThanOrEqual(120);
  });
});
