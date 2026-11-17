import { describe, expect, it } from "vitest";
import { puertasSalaEstacion, puntosSalaEstacion, SALAS_ESTACION, zonaSalaEstacion } from "./salaEstacion";

describe("salaEstacion", () => {
  it.each(SALAS_ESTACION)("%s lets the kid in a few steps from every door, inside the room and clear of furniture", (sala) => {
    const c = zonaSalaEstacion(sala);
    for (const puerta of puertasSalaEstacion(sala)) {
      const { x, z } = puerta.entrada;
      expect(x >= c.xMin && x <= c.xMax && z >= c.zMin && z <= c.zMax).toBe(true);
      expect(Math.hypot(puerta.x - x, puerta.z - z)).toBeGreaterThan(0.9);
      for (const s of puntosSalaEstacion(sala)) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(s.radio + 0.3);
    }
  });

  it.each(SALAS_ESTACION)("%s opens to the corridor", (sala) => {
    expect(puertasSalaEstacion(sala).map((p) => p.destino)).toContain("pasillo");
  });
});
