/**
 * Compatibilidad con el contrato REAL de /contracts (del motor, ya en develop).
 * Mientras los campos opcionales de datos (#17) no estén aprobados, el espejo de data/ es un
 * superconjunto. Esta prueba garantiza que todo lo que publicamos pasa el contrato del motor.
 */
import { describe, expect, it } from "vitest";
import { SpaceWeatherEventSchema as ContratoReal } from "../../contracts/src/space-weather";
import { eventosCurados, eventosMock } from "../src";

describe("contrato real de /contracts", () => {
  it.each([...eventosCurados, ...eventosMock].map((e) => [e.id, e] as const))("%s pasa SpaceWeatherEventSchema", (_id, ev) => {
    expect(ContratoReal.safeParse(ev).success).toBe(true);
  });
});
