import { describe, expect, it } from "vitest";
import { CAJAS_PORTADA, crearPortada3D } from "./portada3d.js";

describe("portada 3D (inicio/01)", () => {
  it("en ancho usa las cajas de DISEÑO §6 para el niño, el planeta y el asteroide", () => {
    expect(CAJAS_PORTADA.ancho.nino).toEqual({ x: 49, y: 18, w: 31, h: 57 });
    expect(CAJAS_PORTADA.ancho.planeta).toEqual({ x: 79, y: 15, w: 16, h: 14 });
    expect(CAJAS_PORTADA.ancho.asteroide).toEqual({ x: 39, y: 7, w: 10, h: 13 });
    // La nave sale del lienzo por abajo y por la derecha: queda recortada por el borde.
    const n = CAJAS_PORTADA.ancho.nave!;
    expect(n.x + n.w).toBeGreaterThan(100);
    expect(n.y + n.h).toBeGreaterThan(100);
  });

  it("monta el niño real del juego, la nave y los planetas; se libera sin errores", () => {
    const il = crearPortada3D();
    expect(il.piezas).toHaveLength(6);
    const nombres: string[] = [];
    for (const p of il.piezas) p.objeto.traverse((o) => nombres.push(o.name));
    expect(nombres).toContain("personaje-nino");
    expect(nombres.some((n) => n.startsWith("Portada_NaveOrbital"))).toBe(true);
    // Solo el niño flota (6 px en 6 s, giro de 1° como máximo).
    const nino = il.piezas.find((p) => p.capa === 4)!;
    for (const t of [0, 1.5, 3, 4.5]) {
      const d = nino.mover!(t)!;
      expect(Math.abs(d.dy ?? 0)).toBeLessThanOrEqual(3);
      expect(Math.abs(d.giro ?? 0)).toBeLessThanOrEqual(1);
    }
    expect(() => il.liberar!()).not.toThrow();
  });
});
