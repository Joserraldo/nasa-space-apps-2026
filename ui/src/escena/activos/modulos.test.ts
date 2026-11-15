import { describe, expect, it } from "vitest";
import { partesVisibles } from "./modulos";

describe("presencia de módulos", () => {
  it("mantiene anclaje y solo muestra luces cuando funciona", () => {
    const ausente = partesVisibles("ausente");
    const instalando = partesVisibles("instalando");
    const funcionando = partesVisibles("funcionando");
    const averiado = partesVisibles("averiado");
    expect([ausente, instalando, funcionando, averiado].every((p) => p.anclaje)).toBe(true);
    expect(ausente.solido).toBe(false);
    expect(instalando.andamio).toBe(true);
    expect(funcionando.vivos).toBe(true);
    expect(averiado.vivos).toBe(false);
  });
});
