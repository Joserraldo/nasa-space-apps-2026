import { describe, expect, it } from "vitest";
import { elegir, enteroEntre, hashSeed, siguiente } from "./rng.js";

function secuencia(seed: string, n: number): number[] {
  let estado = hashSeed(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const paso = siguiente(estado);
    out.push(paso.valor);
    estado = paso.estado;
  }
  return out;
}

describe("rng determinista", () => {
  it("misma semilla => misma secuencia", () => {
    expect(secuencia("2026-11-14", 50)).toEqual(secuencia("2026-11-14", 50));
  });

  it("semillas distintas => secuencias distintas", () => {
    expect(secuencia("luna", 10)).not.toEqual(secuencia("marte", 10));
  });

  it("valores en [0, 1)", () => {
    for (const v of secuencia("x", 1000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("enteroEntre respeta los límites", () => {
    let estado = hashSeed("limites");
    for (let i = 0; i < 500; i++) {
      const r = enteroEntre(estado, 3, 7);
      expect(r.entero).toBeGreaterThanOrEqual(3);
      expect(r.entero).toBeLessThanOrEqual(7);
      estado = r.estado;
    }
  });

  it("elegir devuelve un elemento de la lista y es reproducible", () => {
    const sitios = ["marte_jezero", "luna_polo_sur", "outpost_sorpresa"] as const;
    const a = elegir(hashSeed("sitio"), sitios);
    const b = elegir(hashSeed("sitio"), sitios);
    expect(a.elegido).toBe(b.elegido);
    expect(sitios).toContain(a.elegido);
  });

  it("el estado nunca es 0 al arrancar", () => {
    expect(hashSeed("")).not.toBe(0);
  });
});
