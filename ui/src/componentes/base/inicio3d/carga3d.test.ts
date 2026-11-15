import { describe, expect, it } from "vitest";
import { CAJAS_CARGA, crearCarga3D } from "./carga3d.js";

describe("carga 3D (inicio/03)", () => {
  it("tres módulos en fila, de izquierda a derecha, y el niño a la izquierda", () => {
    for (const modo of ["ancho", "horizontal", "vertical"] as const) {
      const c = CAJAS_CARGA[modo];
      expect(c.panel!.x).toBeLessThan(c.invernadero!.x);
      expect(c.invernadero!.x).toBeLessThan(c.domo!.x);
    }
    expect(CAJAS_CARGA.ancho.nino!.x + CAJAS_CARGA.ancho.nino!.w).toBeLessThan(CAJAS_CARGA.ancho.panel!.x + 2);
  });

  it("monta el niño con la tableta y los módulos del juego; se libera sin errores", () => {
    const il = crearCarga3D();
    const nombres: string[] = [];
    for (const p of il.piezas) p.objeto.traverse((o) => nombres.push(o.name));
    expect(nombres).toContain("personaje-nino");
    for (const n of ["Carga_Panel", "Carga_Invernadero", "Carga_Domo"]) expect(nombres.some((x) => x.startsWith(n))).toBe(true);
    expect(() => il.liberar!()).not.toThrow();
  });
});
